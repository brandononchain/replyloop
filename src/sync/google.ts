// Google Business Profile sync.
//
// Pulls reviews for every location attached to every Google account the
// connection's owner can access, then upserts them into Supabase keyed on
// (connection_id, external_id). Also upserts locations so the dashboard can
// show meaningful names rather than opaque IDs.
//
// API surface used:
//   - mybusinessaccountmanagement.googleapis.com/v1/accounts
//   - mybusinessbusinessinformation.googleapis.com/v1/{account}/locations
//   - mybusiness.googleapis.com/v4/{location}/reviews
//
// Reference: https://developers.google.com/my-business/reference/rest

import { supabase } from "../db/supabase.js";
import { ensureFreshGoogleToken } from "../platforms/googleAuth.js";
import { logUsage } from "../usage.js";

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

interface GoogleAccount { name: string; accountName?: string; type?: string }
interface GoogleLocation { name: string; title?: string; storefrontAddress?: { locality?: string } }
interface GoogleReview {
  reviewId?: string;
  name: string; // accounts/{a}/locations/{l}/reviews/{r}
  reviewer?: { displayName?: string };
  starRating?: keyof typeof STAR_MAP;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

interface SyncStats { locations: number; fetched: number; upserted: number; errors: number }

async function gfetch(token: string, url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status} ${url}: ${body}`);
  }
  return res.json();
}

async function listAccounts(token: string): Promise<GoogleAccount[]> {
  const data = (await gfetch(
    token,
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
  )) as { accounts?: GoogleAccount[] };
  return data.accounts ?? [];
}

async function listLocations(token: string, accountName: string): Promise<GoogleLocation[]> {
  const out: GoogleLocation[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`
    );
    url.searchParams.set("readMask", "name,title,storefrontAddress");
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = (await gfetch(token, url.toString())) as {
      locations?: GoogleLocation[];
      nextPageToken?: string;
    };
    if (data.locations) out.push(...data.locations);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

async function listReviews(token: string, locationPath: string): Promise<GoogleReview[]> {
  const out: GoogleReview[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${locationPath}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = (await gfetch(token, url.toString())) as {
      reviews?: GoogleReview[];
      nextPageToken?: string;
    };
    if (data.reviews) out.push(...data.reviews);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

async function upsertLocation(
  organizationId: string,
  connectionId: string,
  loc: GoogleLocation
): Promise<string | null> {
  const externalId = loc.name; // accounts/{a}/locations/{l}
  const { data, error } = await supabase
    .from("locations")
    .upsert(
      {
        organization_id: organizationId,
        connection_id: connectionId,
        platform: "google",
        external_id: externalId,
        name: loc.title || externalId,
        address: loc.storefrontAddress?.locality ?? null,
        metadata: loc.storefrontAddress ? { storefrontAddress: loc.storefrontAddress } : {},
      },
      { onConflict: "connection_id,external_id" }
    )
    .select("id")
    .single();
  if (error) {
    console.error(`[sync.google] location upsert failed for ${externalId}:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

async function upsertReviewBatch(
  organizationId: string,
  connectionId: string,
  locationId: string | null,
  reviews: GoogleReview[]
): Promise<number> {
  if (reviews.length === 0) return 0;
  const rows = reviews.map((r) => ({
    organization_id: organizationId,
    connection_id: connectionId,
    location_id: locationId,
    platform: "google",
    external_id: r.reviewId || r.name.split("/").pop() || r.name,
    author: r.reviewer?.displayName || "Anonymous",
    rating: r.starRating ? STAR_MAP[r.starRating] ?? 0 : 0,
    text: r.comment ?? "",
    review_date: r.createTime,
    responded: !!r.reviewReply,
    response_text: r.reviewReply?.comment ?? null,
    response_date: r.reviewReply?.updateTime ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from("reviews")
    .upsert(rows, { onConflict: "connection_id,external_id", count: "exact" });

  if (error) {
    console.error(`[sync.google] reviews upsert failed:`, error.message);
    return 0;
  }
  return count ?? rows.length;
}

export async function syncGoogleConnection(conn: {
  id: string;
  organization_id: string;
}): Promise<SyncStats> {
  const stats: SyncStats = { locations: 0, fetched: 0, upserted: 0, errors: 0 };
  const token = await ensureFreshGoogleToken(conn.id, conn.organization_id);

  const accounts = await listAccounts(token);

  for (const account of accounts) {
    let locations: GoogleLocation[] = [];
    try {
      locations = await listLocations(token, account.name);
    } catch (err) {
      stats.errors++;
      console.error(`[sync.google] listLocations(${account.name}) failed:`, err);
      continue;
    }
    stats.locations += locations.length;

    for (const loc of locations) {
      const localLocationId = await upsertLocation(conn.organization_id, conn.id, loc);
      try {
        const reviews = await listReviews(token, loc.name);
        stats.fetched += reviews.length;
        stats.upserted += await upsertReviewBatch(
          conn.organization_id,
          conn.id,
          localLocationId,
          reviews
        );
      } catch (err) {
        stats.errors++;
        console.error(`[sync.google] reviews for ${loc.name} failed:`, err);
      }
    }
  }

  await supabase
    .from("platform_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_error: stats.errors > 0 ? `${stats.errors} sub-errors during sync` : null,
    })
    .eq("id", conn.id);

  logUsage(conn.organization_id, "platform.sync", {
    platform: "google",
    ...stats,
  });

  return stats;
}
