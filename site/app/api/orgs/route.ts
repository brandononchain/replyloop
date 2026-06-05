import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations:organization_id(*)")
    .eq("user_id", userRes.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    organizations: (data ?? [])
      .filter((r) => r.organizations)
      .map((r) => ({ role: r.role, ...(r.organizations as Record<string, unknown>) })),
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
  if (!body.name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const slug =
    body.slug?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
    body.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 32);

  const { data, error } = await supabase.rpc("create_org_with_owner", {
    p_name: body.name,
    p_slug: slug,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ organization_id: data });
}
