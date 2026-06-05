import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgs } from "@/lib/api/orgs";
import { getPlan } from "@/lib/billing/plans";

export default async function DashboardOverview() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  if (!org) return null;

  const supabase = await createSupabaseServerClient();
  const [{ count: keyCount }, { count: connCount }, { count: memberCount }, { count: reviewCount }] = await Promise.all([
    supabase.from("api_keys").select("*", { count: "exact", head: true }).eq("organization_id", org.id).is("revoked_at", null),
    supabase.from("platform_connections").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("memberships").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
  ]);

  const plan = getPlan(org.plan);

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-1">Overview</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-10">
        {org.name} · {plan.label} plan
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Stat label="API keys" value={keyCount ?? 0} limit={plan.apiKeys} />
        <Stat label="Connections" value={connCount ?? 0} limit={plan.locations} />
        <Stat label="Members" value={memberCount ?? 0} limit={plan.seats} />
        <Stat label="Reviews tracked" value={reviewCount ?? 0} />
      </div>

      <section className="border border-[color:var(--border)] rounded p-6 bg-[color:var(--bg-elevated)]">
        <h2 className="text-xl mb-2">Connect Claude in 30 seconds</h2>
        <p className="sans text-sm text-[color:var(--text-secondary)] mb-4">
          Create an API key, then point any MCP-compatible client at the URL below.
        </p>
        <pre className="mono text-xs bg-[color:var(--bg-secondary)] p-4 rounded overflow-x-auto">
{`{
  "mcpServers": {
    "replyloop": {
      "url": "${process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.replyloop.dev"}/sse",
      "headers": { "Authorization": "Bearer rlk_..." }
    }
  }
}`}
        </pre>
        <div className="mt-4 flex gap-3">
          <Link
            href="/dashboard/keys"
            className="sans text-sm px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded hover:opacity-90"
          >
            Create an API key
          </Link>
          <Link
            href="/dashboard/connections"
            className="sans text-sm px-4 py-2 border border-[color:var(--border)] rounded hover:bg-[color:var(--bg-secondary)]"
          >
            Connect a platform
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, limit }: { label: string; value: number; limit?: number }) {
  return (
    <div className="border border-[color:var(--border)] rounded p-4 bg-[color:var(--bg-elevated)]">
      <div className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] sans">{label}</div>
      <div className="text-2xl mt-1">
        {value}
        {typeof limit === "number" && <span className="text-sm text-[color:var(--text-muted)] ml-1">/ {limit}</span>}
      </div>
    </div>
  );
}
