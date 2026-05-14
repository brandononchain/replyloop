// ─────────────────────────────────────────────────────────────────
// Echoback: Review Analysis
// Keyword extraction and trend analysis from review text
// ─────────────────────────────────────────────────────────────────

import type { Review, TrendAnalysis, ReviewAlert } from "../platforms/types.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "was", "were", "are", "been", "be", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may",
  "might", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in",
  "for", "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over", "under",
  "again", "further", "then", "once", "here", "there", "when", "where", "why",
  "how", "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "but", "and", "or", "if", "while", "about", "up", "it", "its",
  "i", "my", "me", "we", "our", "you", "your", "they", "them", "their", "this",
  "that", "these", "those", "what", "which", "who", "whom", "his", "her", "he",
  "she", "also", "really", "much", "get", "got", "went", "going", "go", "come",
  "came", "back", "even", "still", "well", "one", "two", "first",
]);

const NEGATIVE_SIGNALS = [
  "terrible", "awful", "worst", "horrible", "disgusting", "unacceptable",
  "rude", "slow", "cold", "dirty", "overpriced", "disappointing", "never again",
  "waste", "poor", "bad", "gross", "stale", "ignored", "dismissive", "hair",
  "bug", "cockroach", "sick", "food poisoning",
];

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

function groupByPeriod(reviews: Review[], groupBy: "week" | "month"): Map<string, Review[]> {
  const groups = new Map<string, Review[]>();

  for (const review of reviews) {
    const date = new Date(review.date);
    let key: string;

    if (groupBy === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      key = startOfWeek.toISOString().slice(0, 10);
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(review);
  }

  return groups;
}

export function analyzeReviewTrends(
  reviews: Review[],
  groupBy: "week" | "month" = "month"
): TrendAnalysis {
  // Theme extraction
  const themeCounts = new Map<string, { count: number; sentiments: number[] }>();

  for (const review of reviews) {
    const keywords = extractKeywords(review.text);
    for (const word of keywords) {
      if (!themeCounts.has(word)) {
        themeCounts.set(word, { count: 0, sentiments: [] });
      }
      const entry = themeCounts.get(word)!;
      entry.count++;
      entry.sentiments.push(review.rating);
    }
  }

  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([theme, data]) => {
      const avgSentiment = data.sentiments.reduce((s, r) => s + r, 0) / data.sentiments.length;
      return {
        theme,
        count: data.count,
        sentiment: avgSentiment >= 3.5 ? "positive" as const : avgSentiment <= 2.5 ? "negative" as const : "neutral" as const,
      };
    });

  // Rating trend over time
  const groups = groupByPeriod(reviews, groupBy);
  const ratingTrend = Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, revs]) => ({
      period,
      avgRating: Math.round((revs.reduce((s, r) => s + r.rating, 0) / revs.length) * 100) / 100,
      count: revs.length,
    }));

  // Sentiment shift description
  let sentimentShift = "Stable";
  if (ratingTrend.length >= 2) {
    const recent = ratingTrend[ratingTrend.length - 1].avgRating;
    const previous = ratingTrend[ratingTrend.length - 2].avgRating;
    const diff = recent - previous;
    if (diff > 0.3) sentimentShift = "Improving (+{0})".replace("{0}", diff.toFixed(2));
    else if (diff < -0.3) sentimentShift = "Declining ({0})".replace("{0}", diff.toFixed(2));
  }

  return {
    platform: reviews.length > 0 ? reviews[0].platform : "google",
    period: groupBy,
    topThemes,
    ratingTrend,
    sentimentShift,
  };
}

export function getReviewAlerts(reviews: Review[], minSeverity: number = 1): ReviewAlert[] {
  const alerts: ReviewAlert[] = [];

  for (const review of reviews) {
    let severity = 0;
    const reasons: string[] = [];

    // Low rating
    if (review.rating === 1) {
      severity += 3;
      reasons.push("1-star rating");
    } else if (review.rating === 2) {
      severity += 2;
      reasons.push("2-star rating");
    }

    // Negative signal words
    const textLower = review.text.toLowerCase();
    const matchedSignals = NEGATIVE_SIGNALS.filter((s) => textLower.includes(s));
    if (matchedSignals.length > 0) {
      severity += matchedSignals.length;
      reasons.push(`Contains: ${matchedSignals.join(", ")}`);
    }

    // Unanswered
    if (!review.responded) {
      severity += 1;
      reasons.push("No response yet");
    }

    // Recent (within 48h)
    const hoursAgo = (Date.now() - new Date(review.date).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 48) {
      severity += 1;
      reasons.push("Posted within 48 hours");
    }

    if (severity >= minSeverity) {
      alerts.push({
        review,
        severity: Math.min(severity, 5),
        reason: reasons.join(". "),
      });
    }
  }

  return alerts.sort((a, b) => b.severity - a.severity);
}
