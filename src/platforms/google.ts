// ─────────────────────────────────────────────────────────────────
// Echoback: Google Business Profile Adapter
// Uses Google My Business API v4 for review management
// ─────────────────────────────────────────────────────────────────

import type {
  PlatformAdapter,
  Review,
  ReviewResponse,
  ReputationSummary,
  ListReviewsParams,
  DateRange,
} from "./types.js";

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface GoogleReviewRaw {
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
  name: string;
}

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

function mapGoogleReview(raw: GoogleReviewRaw, locationName?: string, locationId?: string): Review {
  return {
    id: raw.reviewId || raw.name.split("/").pop() || "",
    platform: "google",
    author: raw.reviewer?.displayName || "Anonymous",
    rating: STAR_MAP[raw.starRating] || 0,
    text: raw.comment || "(no text, rating only)",
    date: raw.createTime,
    responded: !!raw.reviewReply,
    responseText: raw.reviewReply?.comment,
    responseDate: raw.reviewReply?.updateTime,
    locationName,
    locationId,
  };
}

export function createGoogleAdapter(tokens: GoogleTokens): PlatformAdapter {
  const BASE = "https://mybusiness.googleapis.com/v4";

  async function authedFetch(url: string, options: RequestInit = {}) {
    // TODO: token refresh logic when expiresAt is near
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google API ${res.status}: ${body}`);
    }
    return res.json();
  }

  async function getAccountId(): Promise<string> {
    const data = await authedFetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
    );
    if (!data.accounts || data.accounts.length === 0) {
      throw new Error("No Google Business accounts found");
    }
    return data.accounts[0].name; // e.g. "accounts/123456"
  }

  async function getLocations(accountName: string): Promise<Array<{ name: string; title: string }>> {
    const data = await authedFetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`
    );
    return data.locations || [];
  }

  return {
    async listReviews(params: ListReviewsParams): Promise<Review[]> {
      const accountName = await getAccountId();
      const locations = await getLocations(accountName);
      const allReviews: Review[] = [];

      for (const loc of locations) {
        if (params.locationId && loc.name !== params.locationId) continue;

        const data = await authedFetch(
          `${BASE}/${loc.name}/reviews?pageSize=${params.limit || 50}&orderBy=updateTime desc`
        );

        if (data.reviews) {
          const mapped = data.reviews.map((r: GoogleReviewRaw) =>
            mapGoogleReview(r, loc.title, loc.name)
          );
          allReviews.push(...mapped);
        }
      }

      // Apply local filters
      let filtered = allReviews;
      if (params.minRating !== undefined) filtered = filtered.filter((r) => r.rating >= params.minRating!);
      if (params.maxRating !== undefined) filtered = filtered.filter((r) => r.rating <= params.maxRating!);
      if (params.responded !== undefined) filtered = filtered.filter((r) => r.responded === params.responded);
      if (params.dateRange) {
        const start = new Date(params.dateRange.start).getTime();
        const end = new Date(params.dateRange.end).getTime();
        filtered = filtered.filter((r) => {
          const d = new Date(r.date).getTime();
          return d >= start && d <= end;
        });
      }

      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return params.limit ? filtered.slice(0, params.limit) : filtered;
    },

    async getReview(reviewId: string): Promise<Review | null> {
      const accountName = await getAccountId();
      const locations = await getLocations(accountName);

      for (const loc of locations) {
        try {
          const data = await authedFetch(`${BASE}/${loc.name}/reviews/${reviewId}`);
          return mapGoogleReview(data, loc.title, loc.name);
        } catch {
          continue;
        }
      }
      return null;
    },

    async respondToReview(reviewId: string, responseText: string): Promise<ReviewResponse> {
      const accountName = await getAccountId();
      const locations = await getLocations(accountName);

      for (const loc of locations) {
        try {
          const data = await authedFetch(
            `${BASE}/${loc.name}/reviews/${reviewId}/reply`,
            {
              method: "PUT",
              body: JSON.stringify({ comment: responseText }),
            }
          );
          return {
            reviewId,
            platform: "google",
            responseText,
            postedAt: data.updateTime || new Date().toISOString(),
            success: true,
          };
        } catch {
          continue;
        }
      }

      return {
        reviewId,
        platform: "google",
        responseText,
        postedAt: new Date().toISOString(),
        success: false,
      };
    },

    async getSummary(dateRange?: DateRange): Promise<ReputationSummary> {
      const allReviews = await this.listReviews({ dateRange, limit: 500 });
      const total = allReviews.length;
      const avgRating = total > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / total : 0;
      const responded = allReviews.filter((r) => r.responded).length;

      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allReviews.forEach((r) => dist[r.rating]++);

      const positive = allReviews.filter((r) => r.rating >= 4).length;
      const negative = allReviews.filter((r) => r.rating <= 2).length;

      return {
        platform: "google",
        totalReviews: total,
        averageRating: Math.round(avgRating * 100) / 100,
        ratingDistribution: dist,
        responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
        sentimentBreakdown: { positive, neutral: total - positive - negative, negative },
        periodStart: dateRange?.start || "all-time",
        periodEnd: dateRange?.end || new Date().toISOString(),
      };
    },
  };
}
