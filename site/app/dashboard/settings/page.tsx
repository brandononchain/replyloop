import { getUserOrgs } from "@/lib/api/orgs";

export default async function SettingsPage() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  if (!org) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-1">Settings</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">Workspace details.</p>

      <dl className="sans text-sm divide-y divide-[color:var(--border)] border border-[color:var(--border)] rounded bg-[color:var(--bg-elevated)]">
        <Row label="Name" value={org.name} />
        <Row label="Slug" value={org.slug} />
        <Row label="Plan" value={`${org.plan} (${org.plan_status})`} />
        <Row label="Organization ID" value={org.id} mono />
        <Row label="Created" value={new Date(org.created_at).toLocaleDateString()} />
      </dl>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <dt className="text-[color:var(--text-muted)]">{label}</dt>
      <dd className={mono ? "mono text-xs" : ""}>{value}</dd>
    </div>
  );
}
