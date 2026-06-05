// Per-tenant adapter selection.
//
// Strategy:
//   - If the org has at least one cached review in the DB → use DB adapter.
//   - Otherwise fall back to the demo adapter so new signups can explore
//     the MCP tools without finishing platform OAuth first.
//
// Later this expands to merging multiple platform adapters (Google + Yelp + ...)
// behind a single facade.

import type { PlatformAdapter } from "./types.js";
import { demoAdapter } from "./demo.js";
import { createDbAdapter } from "./db.js";
import { supabase } from "../db/supabase.js";

const cache = new Map<string, { adapter: PlatformAdapter; expiresAt: number }>();
const TTL_MS = 60_000;

export async function getAdapterForOrg(organizationId: string): Promise<PlatformAdapter> {
  const cached = cache.get(organizationId);
  if (cached && cached.expiresAt > Date.now()) return cached.adapter;

  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const adapter = (count ?? 0) > 0 ? createDbAdapter(organizationId) : demoAdapter;
  cache.set(organizationId, { adapter, expiresAt: Date.now() + TTL_MS });
  return adapter;
}

export function invalidateAdapter(organizationId: string): void {
  cache.delete(organizationId);
}
