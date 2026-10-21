# Supabase Duitku POP Backend V1

Backend-only Supabase Edge Functions for Duitku POP. This repository intentionally contains no frontend.

## Status and safety boundary

- Implementation branch: `feat/duitku-pop-backend-v1`
- Target integration: Duitku POP (not Duitku API v2)
- Database migration is a **file only**. It has not been executed.
- No Supabase secrets were set or changed.
- No Edge Functions were deployed.
- No production payment was initiated.
- A production rollout requires separate approval.

## Current components

- `duitku-create-invoice`: validates access to an existing order and requests a POP invoice.
- `duitku-callback`: validates the documented callback signature and atomically applies a callback through a database RPC.
- `get-payment-status`: returns a minimal status after verifying order ownership or guest access.
- `reconcile-payment`: protected, read-only operational inspection; it does not call an undocumented provider endpoint or mutate state.
- `supabase/migrations/20261022000000_init_duitku_pop_backend.sql`: draft schema and callback RPC; do not run against an active database without separate approval.

## Important integration dependency

V1 invoice creation expects a pre-existing row in `public.orders`. The approved scope does not define a product/catalog source, order-item model, pricing rules, shipping workflow, or an order-creation API. Therefore, this repository is **not yet a complete end-to-end checkout system**: do not accept a client-supplied amount as a substitute. Before adding public order creation, define the trusted catalog/pricing source and the guest-token issuance contract.

## Local development

Install a current Supabase CLI and Deno. Check available CLI commands using `supabase --help`; do not link this repository to an active project unless separately approved.

1. Review the migration SQL and docs.
2. Configure only local sandbox values in an ignored local environment file or the local Supabase secrets workflow.
3. Start a local Supabase stack only when Docker and the CLI are available.
4. Apply migrations only to a disposable local database after explicit local-test approval.
5. Run `deno test tests` and `deno check supabase/functions/duitku-create-invoice/index.ts supabase/functions/duitku-callback/index.ts supabase/functions/get-payment-status/index.ts supabase/functions/reconcile-payment/index.ts`.
6. Use sandbox credentials only for provider tests. This session has not run those commands.

## Expected configuration

See `env.example`. Never commit real credentials. In deployed Edge Functions, Supabase platform variables and the Duitku variables must be configured in the approved environment.

## Official references

- https://docs.duitku.com/pop/id/
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/database/secure-data
