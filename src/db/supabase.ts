// Service-role Supabase client for the MCP server.
// Bypasses RLS — only used for trusted, per-tenant queries gated by API-key resolution.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Replyloop MCP: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required"
  );
}

export const supabase: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { "x-replyloop-source": "mcp-server" } },
});
