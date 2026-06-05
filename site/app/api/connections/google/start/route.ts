import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/api/orgs";

// Kick off the Google Business Profile OAuth flow.
// State carries the orgId we're connecting to (so the callback can find it).
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("organization_id");
  if (!orgId) return NextResponse.json({ error: "organization_id_required" }, { status: 400 });

  const membership = await getOrgForUser(orgId, "admin");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirect) {
    return NextResponse.json({ error: "google_oauth_not_configured" }, { status: 500 });
  }

  // Sign the state with the current user's id so the callback verifies it.
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const state = Buffer.from(
    JSON.stringify({ org: orgId, user: userRes.user?.id, ts: Date.now() })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/business.manage",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
