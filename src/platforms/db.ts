// DB-backed PlatformAdapter — reads reviews/responses cached in Supabase
// for a single organization. Writes go through whatever connector originally
// produced the review (handled by the sync worker).

import type {
  PlatformAdapter,
  ListReviewsParams,
  Review,
  ReputationSummary,
  ReviewResponse,
  Platform,
  DateRange,
} from "./types.js";
import { supabase } from "../db/supabase.js";
import { postGoogleReply } from "./googlePublish.js";

type ReviewRow = {
  id: string;
  platform: Platform;
  external_id: string;
  author: string;
  rating: number;
  text: string;
  review_date: string;
  responded: boolean;
  response_text: string | null;
  response_date: string | null;
  location_id: string | null;
};

function rowToReview(r: ReviewRow, locationName: string | null = null): Review {
  return {
    id: r.id,
    platform: r.platform,
    author: r.author,
    rating: r.rating,
    text: r.text,
    date: r.review_date,
    responded: r.responded,
    responseText: r.response_text ?? undefined,
    responseDate: r.response_date ?? undefined,
    locationId: r.location_id ?? undefined,
    locationName: locationName ?? undefined,
  };
}

export function createDbAdapter(organizationId: string): PlatformAdapter {
  return {
    async listReviews(params: ListReviewsParams): Promise<Review[]> {
      let q = supabase
        .from("reviews")
        .select("id,platform,external_id,author,rating,text,review_date,responded,response_text,response_date,location_id")
        .eq("organization_id", organizationId)
        .order("review_date", { ascending: false })
        .limit(params.limit ?? 20);

      if (params.minRating !== undefined) q = q.gte("rating", params.minRating);
      if (params.maxRating !== undefined) q = q.lte("rating", params.maxRating);
      if (params.responded !== undefined) q = q.eq("responded", params.responded);
      if (params.dateRange?.start) q = q.gte("review_date", params.dateRange.start);
      if (params.dateRange?.end) q = q.lte("review_date", params.dateRange.end);
      if (params.locationId) q = q.eq("location_id", params.locationId);

      const { data, error } = await q;
      if (error) throw new Error(`DB read failed: ${error.message}`);
      return (data ?? []).map((r) => rowToReview(r as ReviewRow));
    },

    async getReview(reviewId: string): Promise<Review | null> {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,platform,external_id,author,rating,text,review_date,responded,response_text,response_date,location_id")
        .eq("organization_id", organizationId)
        .eq("id", reviewId)
        .maybeSingle();
      if (error) throw new Error(`DB read failed: ${error.message}`);
      return data ? rowToReview(data as ReviewRow) : null;
    },

    async respondToReview(reviewId: string, responseText: string): Promise<ReviewResponse> {
      // Step 1: fetch review + its connection to know which upstream API to call
      const { data: rev, error: revErr } = await supabase
        .from("reviews")
        .select("id, platform, external_id, connection_id, organization_id, raw")
        .eq("organization_id", organizationId)
        .eq("id", reviewId)
        .maybeSingle();
      if (revErr || !rev) {
        return {
          success: false,
          reviewId,
          platform: "google",
          responseText,
          postedAt: new Date().toISOString(),
        };
      }

      // Step 2: dispatch to the right upstream connector.
      let postedAt = new Date().toISOString();
      let publishOk = true;
      let publishError: string | undefined;

      if (rev.platform === "google" && rev.connection_id) {
        const reviewResourceName =
          (rev.raw as { name?: string } | null)?.name ?? null;
        if (!reviewResourceName) {
          publishOk = false;
          publishError = "missing google review resource name in cached payload";
        } else {
          const result = await postGoogleReply({
            connectionId: rev.connection_id,
            organizationId: rev.organization_id,
            reviewResourceName,
            responseText,
          });
          publishOk = result.success;
          publishError = result.error;
          postedAt = result.postedAt;
        }
      }
      // (yelp / trustpilot / etc. publishers go here later)

      if (!publishOk) {
        return {
          success: false,
          reviewId,
          platform: rev.platform as Platform,
          responseText,
          postedAt,
          ...(publishError ? { error: publishError } : {}),
        } as ReviewResponse;
      }

      const { error: upErr } = await supabase
        .from("reviews")
        .update({ responded: true, response_text: responseText, response_date: postedAt })
        .eq("id", reviewId);
      if (upErr) {
        return {
          success: false,
          reviewId,
          platform: rev.platform as Platform,
          responseText,
          postedAt,
        };
      }

      return {
        success: true,
        reviewId,
        platform: rev.platform as Platform,
        responseText,
        postedAt,
      };
    },

    async getSummary(dateRange?: DateRange): Promise<ReputationSummary> {
      let q = supabase
        .from("reviews")
        .select("rating, responded, review_date")
        .eq("organization_id", organizationId);
      if (dateRange?.start) q = q.gte("review_date", dateRange.start);
      if (dateRange?.end) q = q.lte("review_date", dateRange.end);

      const { data, error } = await q;
      if (error) throw new Error(`DB read failed: ${error.message}`);

      const reviews = data ?? [];
      const total = reviews.length;
      const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let ratingSum = 0;
      let responded = 0;
      let pos = 0;
      let neu = 0;
      let neg = 0;

      for (const r of reviews) {
        ratingDist[r.rating] = (ratingDist[r.rating] ?? 0) + 1;
        ratingSum += r.rating;
        if (r.responded) responded++;
        if (r.rating >= 4) pos++;
        else if (r.rating === 3) neu++;
        else neg++;
      }

      const dates = reviews.map((r) => r.review_date).sort();
      return {
        platform: "all",
        periodStart: dateRange?.start ?? dates[0] ?? new Date().toISOString().slice(0, 10),
        periodEnd: dateRange?.end ?? dates[dates.length - 1] ?? new Date().toISOString().slice(0, 10),
        averageRating: total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0,
        totalReviews: total,
        responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
        ratingDistribution: ratingDist,
        sentimentBreakdown: { positive: pos, neutral: neu, negative: neg },
      };
    },
  };
}
