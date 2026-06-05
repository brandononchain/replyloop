import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgs } from "@/lib/api/orgs";
import { getPlan } from "@/lib/billing/plans";
import TeamClient from "./_components/team-client";

export default async function TeamPage() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  const role = orgs[0]?.role;
  if (!org) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, role, created_at")
      .eq("organization_id", org.id),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at")
      .eq("organization_id", org.id)
      .is("accepted_at", null),
  ]);

  const plan = getPlan(org.plan);

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-1">Team</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
        {members?.length ?? 0} of {plan.seats} seats used on the {plan.label} plan.
      </p>

      <TeamClient
        organizationId={org.id}
        currentRole={role!}
        members={members ?? []}
        invitations={invitations ?? []}
        planLimit={plan.seats}
      />
    </div>
  );
}
