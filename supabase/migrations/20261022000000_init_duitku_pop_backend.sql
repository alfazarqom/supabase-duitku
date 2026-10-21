-- DRAFT MIGRATION: reviewed and committed as a file only.
-- Do not execute against an active database without a separate approval.
create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text null,
  customer_phone text null,
  total_amount bigint not null check (total_amount > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_owner_created_idx
  on public.orders (owner_user_id, created_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  merchant_code text not null,
  merchant_order_id text not null unique,
  provider_reference text null unique,
  payment_url text null,
  amount bigint not null check (amount > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  payment_method text null,
  environment text not null check (environment in ('sandbox', 'production')),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_created_idx
  on public.payments (order_id, created_at desc);
create index if not exists payments_pending_created_idx
  on public.payments (created_at)
  where status = 'pending';

create table if not exists public.guest_order_access (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  revoked_at timestamptz null
);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  payment_id uuid not null references public.payments(id) on delete restrict,
  callback_digest text not null unique check (length(callback_digest) = 64),
  result_code text not null,
  processing_result text not null,
  received_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.guest_order_access enable row level security;
alter table public.payment_events enable row level security;

-- No direct browser table access in V1. All access goes through validated Edge Functions.
revoke all on public.orders, public.payments, public.guest_order_access, public.payment_events
  from public, anon, authenticated;
grant select, insert, update, delete on public.orders, public.payments,
  public.guest_order_access, public.payment_events to service_role;
grant usage, select on sequence public.payment_events_id_seq to service_role;

create or replace function public.apply_duitku_callback(
  p_merchant_code text,
  p_amount bigint,
  p_merchant_order_id text,
  p_reference text,
  p_result_code text,
  p_callback_digest text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payment public.payments%rowtype;
  v_event_id bigint;
  v_new_status text;
begin
  if p_merchant_code is null or p_amount is null or p_merchant_order_id is null
     or p_reference is null or p_result_code is null
     or p_callback_digest is null or length(p_callback_digest) <> 64 then
    raise exception 'invalid_callback_input' using errcode = '22023';
  end if;

  select * into v_payment
  from public.payments
  where merchant_order_id = p_merchant_order_id
  for update;

  if not found then
    raise exception 'unknown_merchant_order_id' using errcode = 'P0002';
  end if;

  if v_payment.merchant_code <> p_merchant_code
     or v_payment.amount <> p_amount
     or v_payment.provider_reference is distinct from p_reference then
    raise exception 'callback_transaction_mismatch' using errcode = '22000';
  end if;

  if exists (select 1 from public.payment_events e where e.callback_digest = p_callback_digest) then
    return jsonb_build_object('outcome', 'duplicate', 'status', v_payment.status);
  end if;

  if v_payment.status = 'pending' then
    v_new_status := case when p_result_code = '00' then 'paid' else 'failed' end;
    update public.payments
      set status = v_new_status, updated_at = now()
      where id = v_payment.id;

    if v_new_status = 'paid' then
      update public.orders
        set status = 'paid', updated_at = now()
        where id = v_payment.order_id and status = 'pending_payment';
    end if;
  else
    v_new_status := v_payment.status;
  end if;

  insert into public.payment_events (
    payment_id, callback_digest, result_code, processing_result
  ) values (
    v_payment.id, p_callback_digest, p_result_code,
    case when v_payment.status = 'pending' then 'applied' else 'ignored_terminal_state' end
  ) returning id into v_event_id;

  return jsonb_build_object(
    'outcome', case when v_payment.status = 'pending' then 'applied' else 'terminal_unchanged' end,
    'status', v_new_status,
    'event_id', v_event_id
  );
end;
$$;

revoke all on function public.apply_duitku_callback(text, bigint, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_duitku_callback(text, bigint, text, text, text, text)
  to service_role;

comment on function public.apply_duitku_callback(text, bigint, text, text, text, text)
  is 'Atomic Duitku POP callback application. Execute only through the trusted service-role Edge Function after signature verification.';
