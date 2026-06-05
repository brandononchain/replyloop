// Google OAuth helpers — refresh access tokens, fetch encrypted tokens for a
// connection, and persist rotated tokens back through the pgsodium RPC.

import { supabase } from "../db/supabase.js";

interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // epoch ms
  scope: string | null;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type: string;
}

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export async function loadGoogleTokens(connectionId: string): Promise<GoogleTokens | null> {
  const [{ data: meta }, accessRpc, refreshRpc] = await Promise.all([
    supabase
      .from("platform_connections")
      .select("token_expires_at, scope, organization_id")
      .eq("id", connectionId)
      .maybeSingle(),
    supabase.rpc("decrypt_platform_token", { p_connection_id: connectionId, p_field: "access" }),
    supabase.rpc("decrypt_platform_token", { p_connection_id: connectionId, p_field: "refresh" }),
  ]);

  if (!meta || accessRpc.error || !accessRpc.data) return null;

  return {
    accessToken: accessRpc.data as string,
    refreshToken: (refreshRpc.data as string) ?? null,
    expiresAt: meta.token_expires_at ? new Date(meta.token_expires_at).getTime() : 0,
    scope: meta.scope,
  };
}

async function exchangeRefreshToken(refreshToken: string): Promise<RefreshResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${body}`);
  }
  return (await res.json()) as RefreshResponse;
}

export async function ensureFreshGoogleToken(
  connectionId: string,
  organizationId: string
): Promise<string> {
  const tokens = await loadGoogleTokens(connectionId);
  if (!tokens) throw new Error(`no tokens stored for connection ${connectionId}`);

  if (tokens.expiresAt - Date.now() > REFRESH_THRESHOLD_MS) {
    return tokens.accessToken;
  }
  if (!tokens.refreshToken) {
    // Access token is stale and we have no way to renew — surface clearly.
    throw new Error(`access token expired and no refresh_token for connection ${connectionId}`);
  }

  const refreshed = await exchangeRefreshToken(tokens.refreshToken);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const { error } = await supabase.rpc("upsert_platform_connection", {
    p_organization_id: organizationId,
    p_platform: "google",
    p_account_name: null,
    p_access_token: refreshed.access_token,
    p_refresh_token: tokens.refreshToken, // keep existing refresh token
    p_expires_at: newExpiresAt,
    p_scope: refreshed.scope ?? tokens.scope,
  });
  if (error) throw new Error(`failed to persist refreshed token: ${error.message}`);

  return refreshed.access_token;
}
