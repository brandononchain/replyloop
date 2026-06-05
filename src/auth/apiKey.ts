// API-key authentication for the hosted MCP server.
//
// Key format:    rlk_<24 base62 chars>
// Storage:       only sha256(key) is persisted in `api_keys.key_hash`
// Resolution:    `public.resolve_api_key(hash)` returns org_id + scopes + plan
//
// Accepts either:
//   - `Authorization: Bearer rlk_xxx` header
//   - `?key=rlk_xxx`  query string  (fallback for clients that can't set headers)

import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { supabase } from "../db/supabase.js";

const KEY_PREFIX = "rlk_";
const KEY_RAND_BYTES = 18; // 18 bytes → 24 base64url chars

export type Plan = "free" | "starter" | "pro" | "team";
export type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export interface OrgContext {
  organizationId: string;
  scopes: string[];
  plan: Plan;
  planStatus: PlanStatus;
  apiKeyHash: string;
}

export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const raw = randomBytes(KEY_RAND_BYTES).toString("base64url");
  const plaintext = `${KEY_PREFIX}${raw}`;
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash, prefix: plaintext.slice(0, 12) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function extractKey(req: IncomingMessage): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith(KEY_PREFIX)) return token;
  }
  // Fallback: ?key= query string
  const url = new URL(req.url ?? "/", "http://x");
  const q = url.searchParams.get("key");
  if (q && q.startsWith(KEY_PREFIX)) return q;
  return null;
}

export async function resolveApiKey(plaintext: string): Promise<OrgContext | null> {
  const hash = hashApiKey(plaintext);
  const { data, error } = await supabase.rpc("resolve_api_key", { p_key_hash: hash });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  if (row.plan_status === "canceled" || row.plan_status === "incomplete") return null;
  return {
    organizationId: row.organization_id,
    scopes: row.scopes ?? [],
    plan: row.plan as Plan,
    planStatus: row.plan_status as PlanStatus,
    apiKeyHash: hash,
  };
}
