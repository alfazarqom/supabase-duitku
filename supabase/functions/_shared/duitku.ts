import { constantTimeHexEqual, hmacSha256Hex } from "./crypto.ts";
import { env } from "./supabase.ts";

export type DuitkuConfig = {
  merchantCode: string;
  apiKey: string;
  baseUrl: string;
};

export function duitkuConfig(): DuitkuConfig {
  const merchantCode = env("DUITKU_MERCHANT_CODE");
  const apiKey = env("DUITKU_API_KEY");
  const configured = env("DUITKU_BASE_URL").replace(/\/$/, "");
  const allowed = new Set([
    "https://api-sandbox.duitku.com",
    "https://api-prod.duitku.com",
  ]);
  if (!allowed.has(configured)) throw new Error("DUITKU_BASE_URL must be an official POP API host");
  return { merchantCode, apiKey, baseUrl: configured };
}

export async function createInvoiceSignature(merchantCode: string, timestamp: string, apiKey: string) {
  return await hmacSha256Hex(apiKey, merchantCode + timestamp);
}

export async function verifyCallbackSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  signature: string,
  apiKey: string,
): Promise<boolean> {
  const expected = await hmacSha256Hex(apiKey, merchantCode + amount + merchantOrderId);
  return constantTimeHexEqual(expected, signature);
}

export function isSuccessfulResult(resultCode: string): boolean {
  return resultCode === "00";
}
