import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrgForUser } from "@/lib/api/orgs";

interface Params { params: Promise<{ id: string; keyId: string }> }

// Revoke (soft delete) — sets revoked_at, doesn't delete the row so audit
// trails remain intact.
export async function DELETE(_request: NextRequest, ctx: Params) {
  const { id: orgId, keyId } = await ctx.params;
  const membership = await getOrgForUser(orgId, "admin");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
