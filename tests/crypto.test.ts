import { constantTimeHexEqual, hmacSha256Hex, sha256Hex } from "../supabase/functions/_shared/crypto.ts";

Deno.test("HMAC-SHA256 matches a known test vector", async () => {
  const actual = await hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog");
  const expected = "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";
  if (actual !== expected) throw new Error(`HMAC mismatch: ${actual}`);
});

Deno.test("SHA-256 matches a known test vector", async () => {
  const actual = await sha256Hex("abc");
  const expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
  if (actual !== expected) throw new Error(`SHA-256 mismatch: ${actual}`);
});

Deno.test("constant-time hex comparison accepts equal hex and rejects invalid/mismatched input", () => {
  if (!constantTimeHexEqual("aabbcc", "AABBCC")) throw new Error("expected equal hex values");
  if (constantTimeHexEqual("aabbcc", "aabbcd")) throw new Error("expected different values");
  if (constantTimeHexEqual("xyz", "xyz")) throw new Error("expected invalid hex to fail");
  if (constantTimeHexEqual("aa", "aaaa")) throw new Error("expected different lengths to fail");
});
