// Minimal hand-typed DB types covering the surfaces the site touches.
// To replace with full generated types, run:
//   npx supabase gen types typescript --project-id mewkmvttpbspgfidjewa
// and drop the output here.

export type OrgRole = "owner" | "admin" | "responder" | "viewer";
export type PlanTier = "free" | "starter" | "pro" | "team" | "enterprise";
export type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  plan_status: PlanStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface PlatformConnection {
  id: string;
  organization_id: string;
  platform: string;
  account_name: string | null;
  status: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface RoutingRule {
  id: string;
  organization_id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  created_at: string;
}
