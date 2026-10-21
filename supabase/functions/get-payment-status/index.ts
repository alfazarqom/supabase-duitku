import { sha256Hex } from "../_shared/crypto.ts";
import { jsonResponse, preflight, readJson } from "../_shared/http.ts";
import { adminClient, authenticatedUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  try {
    const body = await readJson(request);
    if (!body || typeof body.merchant_order_id !== "string") {
      return jsonResponse(400, { error: "invalid_request" });
    }
    const bearerPresent = (request.headers.get("authorization") ?? "").startsWith("Bearer ");
    const user = await authenticatedUser(request);
    if (bearerPresent && !user) return jsonResponse(401, { error: "invalid_session" });

    const db = adminClient();
    const { data: payment, error } = await db
      .from("payments")
      .select("id,order_id,merchant_order_id,amount,currency,status,provider_reference,created_at,expires_at")
      .eq("merchant_order_id", body.merchant_order_id)
      .maybeSingle();
    if (error) throw error;
    if (!payment) return jsonResponse(404, { error: "payment_not_found" });

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id,owner_user_id")
      .eq("id", payment.order_id)
      .single();
    if (orderError) throw orderError;

    if (user) {
      if (order.owner_user_id !== user.id) return jsonResponse(403, { error: "payment_access_denied" });
    } else {
      if (typeof body.guest_access_token !== "string" || body.guest_access_token.length < 32) {
        return jsonResponse(401, { error: "guest_access_required" });
      }
      const tokenHash = await sha256Hex(body.guest_access_token);
      const { data: access, error: accessError } = await db
        .from("guest_order_access")
        .select("order_id,expires_at,revoked_at")
        .eq("order_id", order.id)
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (accessError) throw accessError;
      if (!access || access.revoked_at || (access.expires_at && Date.parse(access.expires_at) <= Date.now())) {
        return jsonResponse(403, { error: "payment_access_denied" });
      }
    }

    return jsonResponse(200, {
      payment_id: payment.id,
      merchant_order_id: payment.merchant_order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      reference: payment.provider_reference,
      created_at: payment.created_at,
      expires_at: payment.expires_at,
    });
  } catch (error) {
    console.error("get-payment-status failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(500, { error: "internal_error" });
  }
});
