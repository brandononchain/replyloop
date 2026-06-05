import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrgForUser } from "@/lib/api/orgs";
import { generateApiKey } from "@/lib/api/keys";
import { getPlan } from "@/lib/billing/plans";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Params) {
  const { id: orgId } = await ctx.params;
  const membership = await getOrgForUser(orgId, "admin");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

export async function POST(request: NextRequest, ctx: Params) {
  const { id: orgId } = await ctx.params;
  const membership = await getOrgForUser(orgId, "admin");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    scopes?: string[];
  };
  if (!body.name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  // Plan limit check
  const plan = getPlan(membership.organization.plan);
  const { count } = await supabase
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("revoked_at", null);
  if ((count ?? 0) >= plan.apiKeys) {
    return NextResponse.json(
      { error: "plan_limit_reached", limit: plan.apiKeys, plan: plan.tier },
      { status: 402 }
    );
  }

  const scopes = body.scopes?.length ? body.scopes : ["mcp:read", "mcp:respond"];
  const key = generateApiKey();

  // Service role insert so we can write key_hash (column is admin-only)
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert({
      organization_id: orgId,
      name: body.name,
      key_prefix: key.prefix,
      key_hash: key.hash,
      scopes,
      created_by: userRes.user.id,
    })
    .select("id, name, key_prefix, scopes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Plaintext is shown to the user ONCE, never persisted in cleartext.
  return NextResponse.json({ key: data, plaintext: key.plaintext });
}
