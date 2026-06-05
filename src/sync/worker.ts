// ────────────────────────────────────────────────────────────
// Replyloop sync worker
//
// Periodically polls connected platforms (Google Business Profile today,
// more later), upserts fresh reviews into Supabase, and refreshes OAuth
// tokens as needed.
//
// Run modes:
//   tsx src/sync/worker.ts            # long-running loop
//   tsx src/sync/worker.ts --once     # one pass and exit (for cron)
// ────────────────────────────────────────────────────────────

import { supabase } from "../db/supabase.js";
import { logUsage } from "../usage.js";
import { syncGoogleConnection } from "./google.js";

const POLL_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS || "300000", 10); // 5 min
const ONCE = process.argv.includes("--once");

interface ConnectionRow {
  id: string;
  organization_id: string;
  platform: string;
  status: string;
}

async function syncConnection(conn: ConnectionRow): Promise<void> {
  const tag = `${conn.platform}:${conn.id.slice(0, 8)}`;
  try {
    if (conn.platform === "google") {
      const stats = await syncGoogleConnection(conn);
      console.log(
        `[sync] ${tag} ok — ${stats.fetched} fetched / ${stats.upserted} upserted across ${stats.locations} locations`
      );
      return;
    }

    // Unknown platform — heartbeat only.
    await supabase
      .from("platform_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", conn.id);
    logUsage(conn.organization_id, "platform.sync", { platform: conn.platform, status: "noop" });
    console.log(`[sync] ${tag} noop — no connector implemented`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sync] ${tag} failed:`, message);
    await supabase
      .from("platform_connections")
      .update({ last_sync_error: message.slice(0, 500) })
      .eq("id", conn.id);
  }
}

async function runOnce(): Promise<void> {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, organization_id, platform, status")
    .eq("status", "active");

  if (error) {
    console.error("[sync] failed to list connections:", error.message);
    return;
  }

  const connections = (data ?? []) as ConnectionRow[];
  await Promise.all(connections.map(syncConnection));
  console.log(`[sync] processed ${connections.length} connections.`);
}

async function loop(): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.error("[sync] unhandled error:", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

if (ONCE) {
  await runOnce();
} else {
  console.log(`[sync] worker started — polling every ${POLL_INTERVAL_MS / 1000}s`);
  await loop();
}
