import { randomToken, sha256Hex } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse, preflight, readJson } from "../_shared/http.ts";
import { createInvoiceSignature, duitkuConfig } from "../_shared/duitku.ts";
import { adminClient, authenticatedUser, env } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  try {
    const body = await readJson(request);
    if (!body || typeof body.order_id !== "string") {
      return jsonResponse(400, { error: "invalid_request" });
    }
    const orderId = body.order_id;
    const bearerPresent = (request.headers.get("authorization") ?? "").startsWith("Bearer ");
    const user = await authenticatedUser(request);
    if (bearerPresent && !user) return jsonResponse(401, { error: "invalid_session" });

    const db = adminClient();
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id,owner_user_id,customer_email,customer_name,customer_phone,total_amount,currency,status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return jsonResponse(404, { error: "order_not_found" });
    if (order.status !== "pending_payment") return jsonResponse(409, { error: "order_not_payable" });

    if (user) {
      if (order.owner_user_id !== user.id) return jsonResponse(403, { error: "order_access_denied" });
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
        return jsonResponse(403, { error: "guest_order_access_denied" });
      }
    }

    if (!Number.isSafeInteger(Number(order.total_amount)) || Number(order.total_amount) <= 0) {
      return jsonResponse(409, { error: "invalid_order_amount" });
    }
    if (!order.customer_email || typeof order.customer_email !== "string") {
      return jsonResponse(409, { error: "order_customer_email_required" });
    }

    const config = duitkuConfig();
    const environment = config.baseUrl.includes("sandbox") ? "sandbox" : "production";

    const { data: existing, error: existingError } = await db
      .from("payments")
      .select("id,merchant_order_id,payment_url,status")
      .eq("order_id", order.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.payment_url) {
      return jsonResponse(200, {
        payment_id: existing.id,
        merchant_order_id: existing.merchant_order_id,
        payment_url: existing.payment_url,
        status: existing.status,
        reused: true,
      });
    }
    if (existing) {
      return jsonResponse(409, {
        error: "invoice_creation_outcome_unknown",
        message: "An invoice attempt is already pending reconciliation; do not create another invoice automatically.",
      });
    }

    const merchantOrderId = `${order.id.replaceAll("-", "").slice(0, 24)}${Date.now()}`;
    const { data: payment, error: insertError } = await db
      .from("payments")
      .insert({
        order_id: order.id,
        merchant_code: config.merchantCode,
        merchant_order_id: merchantOrderId,
        amount: Number(order.total_amount),
        currency: "IDR",
        status: "pending",
        environment,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const timestamp = String(Date.now());
    const signature = await createInvoiceSignature(config.merchantCode, timestamp, config.apiKey);
    const payload = {
      paymentAmount: Number(order.total_amount),
      merchantOrderId,
      productDetails: `Order ${order.id}`.slice(0, 255),
      email: order.customer_email,
      ...(order.customer_name ? { customerVaName: order.customer_name.slice(0, 20) } : {}),
      ...(order.customer_phone ? { phoneNumber: order.customer_phone } : {}),
      callbackUrl: env("DUITKU_CALLBACK_URL"),
      returnUrl: env("DUITKU_RETURN_URL"),
    };

    let upstream: Response;
    try {
      upstream = await fetch(`${config.baseUrl}/api/merchant/createInvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-duitku-timestamp": timestamp,
          "x-duitku-signature": signature,
          "x-duitku-merchantcode": config.merchantCode,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      // A timeout is ambiguous: Duitku may have created the invoice. Keep the row pending.
      return jsonResponse(503, { error: "invoice_creation_outcome_unknown", payment_id: payment.id });
    }

    const responseText = await upstream.text();
    let provider: Record<string, unknown>;
    try {
      provider = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      return jsonResponse(502, { error: "invalid_provider_response", payment_id: payment.id });
    }

    if (!upstream.ok || String(provider.statusCode ?? "") !== "00") {
      // A 409 can indicate an in-flight provider request. Keep it pending for reconciliation.
      if (upstream.status !== 409) {
        await db.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.id).eq("status", "pending");
      }
      return jsonResponse(upstream.status === 409 ? 409 : 502, {
        error: upstream.status === 409 ? "provider_transaction_in_progress" : "provider_invoice_rejected",
        payment_id: payment.id,
      });
    }

    const reference = typeof provider.reference === "string" ? provider.reference : "";
    const paymentUrl = typeof provider.paymentUrl === "string" ? provider.paymentUrl : "";
    let parsedUrl: URL | null = null;
    try { parsedUrl = new URL(paymentUrl); } catch { /* checked below */ }
    if (!reference || !parsedUrl || parsedUrl.protocol !== "https:") {
      return jsonResponse(502, { error: "invalid_provider_invoice_fields", payment_id: payment.id });
    }

    const { error: updateError } = await db
      .from("payments")
      .update({
        provider_reference: reference,
        payment_url: paymentUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (updateError) {
      // Provider may have created the invoice; retain local pending row for recovery.
      return jsonResponse(503, { error: "invoice_persist_pending_reconciliation", payment_id: payment.id });
    }

    return jsonResponse(200, {
      payment_id: payment.id,
      merchant_order_id: merchantOrderId,
      payment_url: paymentUrl,
      status: "pending",
      reused: false,
    });
  } catch (error) {
    console.error("duitku-create-invoice failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(500, { error: "internal_error" });
  }
});
