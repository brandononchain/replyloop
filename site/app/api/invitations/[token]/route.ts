import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface Params { params: Promise<{ token: string }> }

export async function POST(_request: NextRequest, ctx: Params) {
  const { token } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (inviteErr || !invite) return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== userRes.user.email?.toLowerCase()) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 403 });
  }

  const { error: insertErr } = await supabaseAdmin.from("memberships").insert({
    organization_id: invite.organization_id,
    user_id: userRes.user.id,
    role: invite.role,
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  await supabaseAdmin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ organization_id: invite.organization_id });
}
