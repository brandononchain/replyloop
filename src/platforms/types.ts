// ─────────────────────────────────────────────────────────────────
// Echoback: Shared Types
// ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  platform: Platform;
  author: string;
  rating: number;
  text: string;
  date: string;
  responded: boolean;
  responseText?: string;
  responseDate?: string;
  locationName?: string;
  locationId?: string;
}

export interface ReviewResponse {
  reviewId: string;
  platform: Platform;
  responseText: string;
  postedAt: string;
  success: boolean;
}

export interface ReputationSummary {
  platform: Platform | "all";
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  responseRate: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  periodStart: string;
  periodEnd: string;
}

export interface ReviewAlert {
  review: Review;
  severity: number;
  reason: string;
}

export interface TrendAnalysis {
  platform: Platform | "all";
  period: string;
  topThemes: Array<{ theme: string; count: number; sentiment: "positive" | "negative" | "neutral" }>;
  ratingTrend: Array<{ period: string; avgRating: number; count: number }>;
  sentimentShift: string;
}

export interface PlatformConnection {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  locationCount?: number;
  totalReviews?: number;
  lastSync?: string;
}

export type Platform = "google" | "yelp" | "trustpilot" | "g2" | "appstore" | "playstore";

export interface PlatformAdapter {
  listReviews(params: ListReviewsParams): Promise<Review[]>;
  getReview(reviewId: string): Promise<Review | null>;
  respondToReview(reviewId: string, responseText: string): Promise<ReviewResponse>;
  getSummary(dateRange?: DateRange): Promise<ReputationSummary>;
}

export interface ListReviewsParams {
  dateRange?: DateRange;
  minRating?: number;
  maxRating?: number;
  responded?: boolean;
  limit?: number;
  locationId?: string;
}

export interface DateRange {
  start: string;
  end: string;
}
