import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the admin client.");
}

/**
 * Service-role Supabase client. Bypasses RLS — only use from trusted server
 * routes (API handlers, server actions, webhooks). Never expose to the browser.
 */
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
