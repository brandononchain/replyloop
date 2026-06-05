import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrgForUser } from "@/lib/api/orgs";
import { getPlan } from "@/lib/billing/plans";
import { sendInvitationEmail } from "@/lib/email/invitation";
import type { OrgRole } from "@/lib/supabase/types";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Params) {
  const { id: orgId } = await ctx.params;
  const membership = await getOrgForUser(orgId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const [members, invites] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, role, created_at")
      .eq("organization_id", orgId),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("organization_id", orgId)
      .is("accepted_at", null),
  ]);

  if (members.error) return NextResponse.json({ error: members.error.message }, { status: 500 });
  return NextResponse.json({
    members: members.data ?? [],
    invitations: invites.data ?? [],
  });
}

export async function POST(request: NextRequest, ctx: Params) {
  const { id: orgId } = await ctx.params;
  const membership = await getOrgForUser(orgId, "admin");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: OrgRole };
  if (!body.email) return NextResponse.json({ error: "email_required" }, { status: 400 });
  const role: OrgRole = body.role ?? "responder";

  // Seat-limit check (members + open invites)
  const plan = getPlan(membership.organization.plan);
  const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("accepted_at", null),
  ]);
  if (((memberCount ?? 0) + (inviteCount ?? 0)) >= plan.seats) {
    return NextResponse.json(
      { error: "seat_limit_reached", limit: plan.seats, plan: plan.tier },
      { status: 402 }
    );
  }

  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { data, error } = await supabaseAdmin
    .from("invitations")
    .insert({
      organization_id: orgId,
      email: body.email.toLowerCase(),
      role,
      token,
      invited_by: userRes.user.id,
      expires_at: expires,
    })
    .select("id, email, role, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://replyloop.dev"}/invitations/${token}`;

  const emailResult = await sendInvitationEmail({
    to: body.email.toLowerCase(),
    orgName: membership.organization.name,
    inviterEmail: userRes.user.email ?? null,
    role,
    acceptUrl,
  });

  return NextResponse.json({
    invitation: data,
    accept_url: acceptUrl,
    email_sent: emailResult.sent,
    email_reason: emailResult.reason,
  });
}
