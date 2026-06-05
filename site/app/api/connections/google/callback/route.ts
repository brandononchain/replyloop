import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code || !stateParam) {
    return NextResponse.json({ error: "missing_code_or_state" }, { status: 400 });
  }

  let state: { org?: string; user?: string; ts?: number };
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }
  if (!state.org) return NextResponse.json({ error: "invalid_state" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user || userRes.user.id !== state.user) {
    return NextResponse.json({ error: "session_mismatch" }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirect = process.env.GOOGLE_REDIRECT_URI!;

  // Exchange the code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "token_exchange_failed", detail: await tokenRes.text() },
      { status: 400 }
    );
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Persist via RPC so tokens go through pgsodium encryption.
  const { error } = await supabaseAdmin.rpc("upsert_platform_connection", {
    p_organization_id: state.org,
    p_platform: "google",
    p_account_name: null,
    p_access_token: tokens.access_token,
    p_refresh_token: tokens.refresh_token ?? null,
    p_expires_at: expiresAt,
    p_scope: tokens.scope ?? null,
  });
  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/connections?status=error&detail=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/dashboard/connections?status=connected", request.url));
}
