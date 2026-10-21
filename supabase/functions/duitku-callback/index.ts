import { sha256Hex } from "../_shared/crypto.ts";
import { jsonResponse, preflight } from "../_shared/http.ts";
import { duitkuConfig, verifyCallbackSignature } from "../_shared/duitku.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });
  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/x-www-form-urlencoded")) {
    return jsonResponse(415, { error: "unsupported_content_type" });
  }

  try {
    const form = new URLSearchParams(await request.text());
    const merchantCode = form.get("merchantCode") ?? "";
    const amountText = form.get("amount") ?? "";
    const merchantOrderId = form.get("merchantOrderId") ?? "";
    const reference = form.get("reference") ?? "";
    const resultCode = form.get("resultCode") ?? "";
    const signature = form.get("signature") ?? "";

    if (!merchantCode || !/^\d+$/.test(amountText) || !merchantOrderId || !reference ||
      !resultCode || !signature) {
      return jsonResponse(400, { error: "missing_callback_fields" });
    }
    const amount = Number(amountText);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return jsonResponse(400, { error: "invalid_callback_amount" });
    }

    const config = duitkuConfig();
    if (merchantCode !== config.merchantCode) return jsonResponse(401, { error: "invalid_merchant" });
    const validSignature = await verifyCallbackSignature(
      merchantCode, amountText, merchantOrderId, signature, config.apiKey,
    );
    if (!validSignature) return jsonResponse(401, { error: "invalid_signature" });

    // POP's documented callback signature covers merchantCode + amount + merchantOrderId.
    // It does not cover resultCode/reference; match reference to the stored invoice and keep
    // the documented signature limitation visible in SECURITY.md and operational guidance.
    const callbackDigest = await sha256Hex([
      merchantCode, amountText, merchantOrderId, reference, resultCode, signature,
    ].join("|"));

    const db = adminClient();
    const { data, error } = await db.rpc("apply_duitku_callback", {
      p_merchant_code: merchantCode,
      p_amount: amount,
      p_merchant_order_id: merchantOrderId,
      p_reference: reference,
      p_result_code: resultCode,
      p_callback_digest: callbackDigest,
    });
    if (error) {
      console.error("duitku-callback database processing failed", error.code ?? "database_error");
      // Non-200 encourages Duitku retry; do not acknowledge an event not safely processed.
      return jsonResponse(500, { error: "callback_processing_failed" });
    }

    // Duitku requires HTTP 200 after successful callback handling.
    return jsonResponse(200, { received: true, outcome: data?.outcome ?? "processed" });
  } catch (error) {
    console.error("duitku-callback failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(500, { error: "internal_error" });
  }
});
