import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrgRole, Organization } from "@/lib/supabase/types";

export interface OrgMembership {
  organization: Organization;
  role: OrgRole;
}

/**
 * Load all orgs the current user is a member of, plus their role in each.
 * Returns [] if not signed in.
 */
export async function getUserOrgs(): Promise<OrgMembership[]> {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return [];

  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations:organization_id(*)")
    .eq("user_id", userRes.user.id);

  if (error || !data) return [];
  return data
    .filter((row) => row.organizations)
    .map((row) => ({
      organization: row.organizations as unknown as Organization,
      role: row.role as OrgRole,
    }));
}

/**
 * Resolve a single org by id and confirm the current user has at least the
 * given role. Returns null if not authorized or org missing.
 */
export async function getOrgForUser(
  orgId: string,
  minRole: OrgRole = "viewer"
): Promise<OrgMembership | null> {
  const orgs = await getUserOrgs();
  const found = orgs.find((o) => o.organization.id === orgId);
  if (!found) return null;
  if (!roleAtLeast(found.role, minRole)) return null;
  return found;
}

const RANK: Record<OrgRole, number> = { viewer: 0, responder: 1, admin: 2, owner: 3 };

export function roleAtLeast(actual: OrgRole, required: OrgRole): boolean {
  return RANK[actual] >= RANK[required];
}
