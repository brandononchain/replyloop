import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgs } from "@/lib/api/orgs";

export default async function ConnectionsPage() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  if (!org) return null;

  const supabase = await createSupabaseServerClient();
  const { data: connections } = await supabase
    .from("platform_connections")
    .select("id, platform, account_label, status, last_synced_at")
    .eq("organization_id", org.id);

  const availablePlatforms = [
    { id: "google", name: "Google Business Profile", available: true },
    { id: "yelp", name: "Yelp", available: false },
    { id: "trustpilot", name: "Trustpilot", available: false },
    { id: "g2", name: "G2", available: false },
    { id: "appstore", name: "App Store", available: false },
    { id: "playstore", name: "Google Play", available: false },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-1">Connections</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
        Connect the review platforms you want Replyloop to monitor.
      </p>

      <div className="space-y-2">
        {availablePlatforms.map((p) => {
          const conn = connections?.find((c) => c.platform === p.id);
          return (
            <div
              key={p.id}
              className="border border-[color:var(--border)] rounded p-4 bg-[color:var(--bg-elevated)] flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="sans text-sm">{p.name}</span>
                  {conn?.status === "active" && (
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--positive)]">connected</span>
                  )}
                  {!p.available && (
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">soon</span>
                  )}
                </div>
                {conn?.account_label && (
                  <div className="sans text-xs text-[color:var(--text-muted)] mt-0.5">
                    {conn.account_label}
                    {conn.last_synced_at && ` · synced ${new Date(conn.last_synced_at).toLocaleDateString()}`}
                  </div>
                )}
              </div>
              {p.available ? (
                conn ? (
                  <button className="sans text-xs underline text-[color:var(--text-muted)]">Disconnect</button>
                ) : (
                  <Link
                    href={`/api/connections/${p.id}/start?organization_id=${org.id}`}
                    className="sans text-sm px-3 py-1.5 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded hover:opacity-90"
                  >
                    Connect
                  </Link>
                )
              ) : (
                <button disabled className="sans text-sm px-3 py-1.5 border border-[color:var(--border)] rounded opacity-50">
                  Coming soon
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
