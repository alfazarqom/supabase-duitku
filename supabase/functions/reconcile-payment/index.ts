import { jsonResponse, preflight, readJson } from "../_shared/http.ts";
import { adminClient, authenticatedUser, env } from "../_shared/supabase.ts";

// V1 deliberately exposes no provider inquiry call: the official POP page reviewed for this
// implementation does not document a dedicated inquiry endpoint. This endpoint is a protected
// operational inspection hook only and never mutates payment state.
Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  try {
    const user = await authenticatedUser(request);
    if (!user || user.app_metadata?.role !== "admin") {
      return jsonResponse(403, { error: "admin_access_required" });
    }
    const body = await readJson(request);
    if (!body || typeof body.merchant_order_id !== "string") {
      return jsonResponse(400, { error: "invalid_request" });
    }
    const db = adminClient();
    const { data, error } = await db
      .from("payments")
      .select("id,order_id,merchant_order_id,amount,status,provider_reference,environment,created_at,updated_at")
      .eq("merchant_order_id", body.merchant_order_id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonResponse(404, { error: "payment_not_found" });
    return jsonResponse(200, { payment: data, reconciliation: "manual_review_required" });
  } catch (error) {
    console.error("reconcile-payment failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(500, { error: "internal_error" });
  }
});
