// ─────────────────────────────────────────────────────────────────
// Replyloop: Demo Platform Adapter
// Realistic mock data for testing and demo mode
// ─────────────────────────────────────────────────────────────────

import type {
  PlatformAdapter,
  Review,
  ReviewResponse,
  ReputationSummary,
  ListReviewsParams,
  DateRange,
} from "./types.js";

const MOCK_REVIEWS: Review[] = [
  {
    id: "rev_001",
    platform: "google",
    author: "Sarah M.",
    rating: 5,
    text: "Absolutely love this place. The staff went above and beyond to help us. Will definitely be coming back.",
    date: "2026-05-12T14:30:00Z",
    responded: false,
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_002",
    platform: "google",
    author: "James T.",
    rating: 1,
    text: "Terrible experience. Waited 45 minutes and nobody acknowledged us. The manager was dismissive when I complained. Never again.",
    date: "2026-05-11T09:15:00Z",
    responded: false,
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_003",
    platform: "google",
    author: "Maria L.",
    rating: 4,
    text: "Great food, slightly slow service but the quality made up for it. The pasta was incredible.",
    date: "2026-05-10T18:45:00Z",
    responded: true,
    responseText: "Thank you Maria! We appreciate the feedback on timing and glad you enjoyed the pasta.",
    responseDate: "2026-05-10T20:00:00Z",
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_004",
    platform: "google",
    author: "David K.",
    rating: 2,
    text: "Parking is a nightmare and the prices have gone up significantly. Food was okay but not worth the hassle.",
    date: "2026-05-09T12:00:00Z",
    responded: false,
    locationName: "Westside Location",
    locationId: "loc_002",
  },
  {
    id: "rev_005",
    platform: "google",
    author: "Emily R.",
    rating: 5,
    text: "Best brunch in the city hands down. The avocado toast and cold brew are perfection. The ambiance is so cozy.",
    date: "2026-05-08T11:30:00Z",
    responded: true,
    responseText: "Thank you Emily! Our chef will love hearing this. See you at brunch again soon!",
    responseDate: "2026-05-08T15:00:00Z",
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_006",
    platform: "google",
    author: "Robert H.",
    rating: 3,
    text: "Average experience. Nothing special but nothing terrible either. Could use some menu updates.",
    date: "2026-05-07T19:20:00Z",
    responded: false,
    locationName: "Westside Location",
    locationId: "loc_002",
  },
  {
    id: "rev_007",
    platform: "google",
    author: "Lisa W.",
    rating: 1,
    text: "Found a hair in my food. Reported it to the server who just shrugged. Completely unacceptable hygiene standards.",
    date: "2026-05-06T13:10:00Z",
    responded: false,
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_008",
    platform: "google",
    author: "Tom B.",
    rating: 5,
    text: "We held our anniversary dinner here and they made it so special. Complimentary dessert and the waiter remembered our names. Truly exceptional service.",
    date: "2026-05-05T20:00:00Z",
    responded: true,
    responseText: "Happy anniversary Tom! It was our pleasure to make your evening special.",
    responseDate: "2026-05-06T09:00:00Z",
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_009",
    platform: "google",
    author: "Nancy P.",
    rating: 4,
    text: "Lovely atmosphere and good wine selection. Would have given 5 stars but the dessert menu is limited.",
    date: "2026-05-04T17:30:00Z",
    responded: false,
    locationName: "Westside Location",
    locationId: "loc_002",
  },
  {
    id: "rev_010",
    platform: "google",
    author: "Chris A.",
    rating: 2,
    text: "Overpriced for what you get. The portion sizes have shrunk but the prices keep climbing. Disappointing trend.",
    date: "2026-05-03T14:00:00Z",
    responded: false,
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_011",
    platform: "google",
    author: "Priya S.",
    rating: 5,
    text: "The new seasonal menu is fantastic. Every dish was beautifully presented and tasted amazing. Our server Alex was incredibly knowledgeable about the wine pairings.",
    date: "2026-05-02T19:45:00Z",
    responded: false,
    locationName: "Downtown Location",
    locationId: "loc_001",
  },
  {
    id: "rev_012",
    platform: "google",
    author: "Mike D.",
    rating: 3,
    text: "Used to be my go-to spot but quality has been inconsistent lately. Some nights are great, others are mediocre. Needs more consistency.",
    date: "2026-05-01T21:00:00Z",
    responded: false,
    locationName: "Westside Location",
    locationId: "loc_002",
  },
];

// Mutable copy for demo responses
let reviews = [...MOCK_REVIEWS.map((r) => ({ ...r }))];

function filterReviews(params: ListReviewsParams): Review[] {
  let filtered = [...reviews];

  if (params.minRating !== undefined) {
    filtered = filtered.filter((r) => r.rating >= params.minRating!);
  }
  if (params.maxRating !== undefined) {
    filtered = filtered.filter((r) => r.rating <= params.maxRating!);
  }
  if (params.responded !== undefined) {
    filtered = filtered.filter((r) => r.responded === params.responded);
  }
  if (params.locationId) {
    filtered = filtered.filter((r) => r.locationId === params.locationId);
  }
  if (params.dateRange) {
    const start = new Date(params.dateRange.start).getTime();
    const end = new Date(params.dateRange.end).getTime();
    filtered = filtered.filter((r) => {
      const d = new Date(r.date).getTime();
      return d >= start && d <= end;
    });
  }

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (params.limit) {
    filtered = filtered.slice(0, params.limit);
  }

  return filtered;
}

export const demoAdapter: PlatformAdapter = {
  async listReviews(params: ListReviewsParams): Promise<Review[]> {
    return filterReviews(params);
  },

  async getReview(reviewId: string): Promise<Review | null> {
    return reviews.find((r) => r.id === reviewId) || null;
  },

  async respondToReview(reviewId: string, responseText: string): Promise<ReviewResponse> {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) {
      return {
        reviewId,
        platform: "google",
        responseText,
        postedAt: new Date().toISOString(),
        success: false,
      };
    }

    review.responded = true;
    review.responseText = responseText;
    review.responseDate = new Date().toISOString();

    return {
      reviewId,
      platform: review.platform,
      responseText,
      postedAt: review.responseDate,
      success: true,
    };
  },

  async getSummary(dateRange?: DateRange): Promise<ReputationSummary> {
    let filtered = reviews;
    if (dateRange) {
      const start = new Date(dateRange.start).getTime();
      const end = new Date(dateRange.end).getTime();
      filtered = reviews.filter((r) => {
        const d = new Date(r.date).getTime();
        return d >= start && d <= end;
      });
    }

    const total = filtered.length;
    const avgRating = total > 0 ? filtered.reduce((s, r) => s + r.rating, 0) / total : 0;
    const responded = filtered.filter((r) => r.responded).length;

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filtered.forEach((r) => dist[r.rating]++);

    const positive = filtered.filter((r) => r.rating >= 4).length;
    const negative = filtered.filter((r) => r.rating <= 2).length;
    const neutral = total - positive - negative;

    return {
      platform: "google",
      totalReviews: total,
      averageRating: Math.round(avgRating * 100) / 100,
      ratingDistribution: dist,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      sentimentBreakdown: { positive, neutral, negative },
      periodStart: dateRange?.start || "2026-05-01",
      periodEnd: dateRange?.end || "2026-05-13",
    };
  },
};

export function resetDemoData() {
  reviews = [...MOCK_REVIEWS.map((r) => ({ ...r }))];
}
