import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}

export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "supabase-duitku-backend-v1" } },
  });
}

export async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
