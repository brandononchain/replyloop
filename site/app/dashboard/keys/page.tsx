import KeysClient from "./_components/keys-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgs } from "@/lib/api/orgs";
import { getPlan } from "@/lib/billing/plans";

export default async function KeysPage() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  if (!org) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  const plan = getPlan(org.plan);

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-1">API keys</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
        Use these to authenticate MCP connections at{" "}
        <code className="mono text-xs">{process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.replyloop.dev"}/sse</code>.
        Plan limit: {plan.apiKeys}.
      </p>

      <KeysClient organizationId={org.id} initialKeys={data ?? []} planLimit={plan.apiKeys} />
    </div>
  );
}
