# Security Notes — Duitku POP Backend V1

## Verified protocol details

The official POP documentation specifies:

- Create Invoice: POST JSON to `https://api-sandbox.duitku.com/api/merchant/createInvoice` in sandbox or `https://api-prod.duitku.com/api/merchant/createInvoice` in production.
- Request headers include `x-duitku-timestamp` (Unix milliseconds), `x-duitku-signature`, and `x-duitku-merchantcode`.
- Request signature: HMAC-SHA256 over `merchantCode + timestamp`, keyed by the Duitku API Key.
- Callback: HTTP POST with `application/x-www-form-urlencoded`.
- Callback signature: HMAC-SHA256 over `merchantCode + amount + merchantOrderId`, keyed by the Merchant Key.
- Browser redirect/JS callback is not proof of payment; the server callback is the payment notification channel.
- Callback delivery requires HTTP 200 after successful handling; the docs describe provider retries if HTTP 200 is not received.

Source: https://docs.duitku.com/pop/id/ (reviewed 2026-10-22).

## Important protocol limitation

The documented callback signature does **not** cover `resultCode` or `reference`; those values are not cryptographically bound by that signature formula. V1 additionally matches the callback reference to the reference persisted from invoice creation, but that does not cryptographically bind `resultCode`.

The current POP documentation reviewed here does not document a dedicated server-side inquiry endpoint in its POP section. Therefore:

- Do not treat a valid signature as proof that every callback field is signed.
- Do not use the browser return URL or JS callback to change payment state.
- Consider a trusted provider-side confirmation/status-check contract or provider-supported network allowlisting as defense in depth before production.
- Do not silently use Duitku API v2 inquiry/signature rules as a substitute for POP.
- Production use should remain blocked until the merchant's acceptable callback-verification model is confirmed.

The callback handler follows the documented POP callback signature and reference matching, but this protocol limitation remains a residual risk and is not hidden by the implementation.

## Access controls

- Edge Function JWT gateway verification is disabled for the mixed login/guest endpoints; handlers manually verify bearer sessions and ownership.
- Guest access requires a high-entropy token and stores only its SHA-256 hash in the schema.
- The migration enables RLS and revokes direct table access from `anon` and `authenticated`; V1 data access goes through server-side functions.
- The service-role key must remain server-side.
- `reconcile-payment` is read-only and requires `app_metadata.role === "admin"`; confirm the project's trusted role provisioning before use.
- CORS is not an authorization mechanism.

## Known gaps before complete checkout

The current schema has no catalog, order-item, stock, shipping, or public order-creation flow. Invoice creation expects an order row created by a trusted upstream process. Do not expose a direct order insert or accept client-provided totals until pricing/catalog requirements are approved.
