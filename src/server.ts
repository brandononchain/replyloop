// ─────────────────────────────────────────────────────────────────
// Echoback MCP Server
// Reputation management connector for Claude
// ─────────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { demoAdapter } from "./platforms/demo.js";
import { analyzeReviewTrends, getReviewAlerts } from "./analysis/sentiment.js";
import type { PlatformAdapter } from "./platforms/types.js";
import express from "express";
import cors from "cors";

// ─── Adapter selection ───────────────────────────────────────────

function getAdapter(): PlatformAdapter {
  // In production, check for Google tokens and return createGoogleAdapter()
  // For MVP / demo mode, use the demo adapter
  return demoAdapter;
}

const adapter = getAdapter();

// ─── MCP Server ──────────────────────────────────────────────────

const server = new McpServer({
  name: "echoback",
  version: "1.0.0",
});

// ─── Tool: list_reviews ──────────────────────────────────────────

server.tool(
  "list_reviews",
  "List reviews across connected platforms. Filter by rating, date range, and response status. Returns review text, author, rating, date, and whether a response has been posted.",
  {
    platform: z
      .enum(["google", "yelp", "trustpilot", "g2", "appstore", "playstore", "all"])
      .default("all")
      .describe("Platform to fetch reviews from. Use 'all' for all connected platforms."),
    min_rating: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe("Minimum star rating to include (1-5)"),
    max_rating: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe("Maximum star rating to include (1-5)"),
    responded: z
      .boolean()
      .optional()
      .describe("Filter by response status. true = only responded, false = only unanswered"),
    date_start: z
      .string()
      .optional()
      .describe("Start date for filter (ISO 8601, e.g. 2026-05-01)"),
    date_end: z
      .string()
      .optional()
      .describe("End date for filter (ISO 8601, e.g. 2026-05-13)"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of reviews to return"),
  },
  async (params) => {
    try {
      const reviews = await adapter.listReviews({
        minRating: params.min_rating,
        maxRating: params.max_rating,
        responded: params.responded,
        limit: params.limit,
        dateRange:
          params.date_start && params.date_end
            ? { start: params.date_start, end: params.date_end }
            : undefined,
      });

      const formatted = reviews
        .map(
          (r) =>
            `[${r.rating}/5 stars] ${r.author} — ${new Date(r.date).toLocaleDateString()}\n` +
            `"${r.text}"\n` +
            (r.responded
              ? `↳ Response: "${r.responseText}"\n`
              : `↳ ⚠ No response yet\n`) +
            `ID: ${r.id} | Location: ${r.locationName || "N/A"}`
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${reviews.length} reviews:\n\n${formatted}`,
          },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error fetching reviews: ${err.message}` }] };
    }
  }
);

// ─── Tool: get_review ────────────────────────────────────────────

server.tool(
  "get_review",
  "Get full details of a single review by its ID, including the complete thread and response history.",
  {
    review_id: z.string().describe("The unique review ID (e.g. rev_001)"),
  },
  async ({ review_id }) => {
    try {
      const review = await adapter.getReview(review_id);
      if (!review) {
        return { content: [{ type: "text" as const, text: `Review ${review_id} not found.` }] };
      }

      const detail =
        `Review by ${review.author}\n` +
        `Rating: ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)} (${review.rating}/5)\n` +
        `Date: ${new Date(review.date).toLocaleDateString()}\n` +
        `Platform: ${review.platform}\n` +
        `Location: ${review.locationName || "N/A"}\n\n` +
        `"${review.text}"\n\n` +
        (review.responded
          ? `Response (${new Date(review.responseDate!).toLocaleDateString()}):\n"${review.responseText}"`
          : "No response posted yet.");

      return { content: [{ type: "text" as const, text: detail }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ─── Tool: respond_to_review ─────────────────────────────────────

server.tool(
  "respond_to_review",
  "Post a response to a specific review. The response will be published on the review platform (Google, Yelp, etc). Use this after drafting a response the user has approved.",
  {
    review_id: z.string().describe("The review ID to respond to"),
    response_text: z
      .string()
      .min(1)
      .max(4096)
      .describe("The response text to post publicly on the review platform"),
  },
  async ({ review_id, response_text }) => {
    try {
      const result = await adapter.respondToReview(review_id, response_text);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `Response posted successfully.\n\n` +
                `Review ID: ${result.reviewId}\n` +
                `Platform: ${result.platform}\n` +
                `Posted at: ${new Date(result.postedAt).toLocaleString()}\n\n` +
                `Response:\n"${result.responseText}"`,
            },
          ],
        };
      } else {
        return {
          content: [
            { type: "text" as const, text: `Failed to post response to review ${review_id}. The review may not exist or the platform connection may have expired.` },
          ],
        };
      }
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error posting response: ${err.message}` }] };
    }
  }
);

// ─── Tool: get_reputation_summary ────────────────────────────────

server.tool(
  "get_reputation_summary",
  "Get an overview of your reputation metrics: average rating, total reviews, rating distribution, response rate, and sentiment breakdown. Can be filtered by date range.",
  {
    date_start: z
      .string()
      .optional()
      .describe("Start date (ISO 8601)"),
    date_end: z
      .string()
      .optional()
      .describe("End date (ISO 8601)"),
  },
  async (params) => {
    try {
      const dateRange =
        params.date_start && params.date_end
          ? { start: params.date_start, end: params.date_end }
          : undefined;

      const summary = await adapter.getSummary(dateRange);

      const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

      const text =
        `Reputation Summary (${summary.platform})\n` +
        `Period: ${summary.periodStart} to ${summary.periodEnd}\n\n` +
        `Overall: ${stars(summary.averageRating)} ${summary.averageRating}/5\n` +
        `Total Reviews: ${summary.totalReviews}\n` +
        `Response Rate: ${summary.responseRate}%\n\n` +
        `Rating Distribution:\n` +
        `  5★  ${"█".repeat(summary.ratingDistribution[5])} ${summary.ratingDistribution[5]}\n` +
        `  4★  ${"█".repeat(summary.ratingDistribution[4])} ${summary.ratingDistribution[4]}\n` +
        `  3★  ${"█".repeat(summary.ratingDistribution[3])} ${summary.ratingDistribution[3]}\n` +
        `  2★  ${"█".repeat(summary.ratingDistribution[2])} ${summary.ratingDistribution[2]}\n` +
        `  1★  ${"█".repeat(summary.ratingDistribution[1])} ${summary.ratingDistribution[1]}\n\n` +
        `Sentiment:\n` +
        `  Positive (4-5★): ${summary.sentimentBreakdown.positive}\n` +
        `  Neutral  (3★):   ${summary.sentimentBreakdown.neutral}\n` +
        `  Negative (1-2★): ${summary.sentimentBreakdown.negative}`;

      return { content: [{ type: "text" as const, text }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ─── Tool: get_review_alerts ─────────────────────────────────────

server.tool(
  "get_review_alerts",
  "Get urgent review alerts that need immediate attention. Returns negative reviews ranked by severity, considering rating, negative keywords, recency, and response status.",
  {
    min_severity: z
      .number()
      .min(1)
      .max(5)
      .default(2)
      .describe("Minimum severity threshold (1=low, 5=critical)"),
  },
  async ({ min_severity }) => {
    try {
      const allReviews = await adapter.listReviews({ limit: 100 });
      const alerts = getReviewAlerts(allReviews, min_severity);

      if (alerts.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No review alerts at the current severity threshold. Your reputation looks good." },
          ],
        };
      }

      const formatted = alerts
        .map(
          (a) =>
            `🚨 Severity ${a.severity}/5 — ${a.reason}\n` +
            `[${a.review.rating}/5] ${a.review.author}: "${a.review.text.slice(0, 200)}${a.review.text.length > 200 ? "..." : ""}"\n` +
            `Date: ${new Date(a.review.date).toLocaleDateString()} | ID: ${a.review.id}`
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${alerts.length} alerts requiring attention:\n\n${formatted}`,
          },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ─── Tool: analyze_review_trends ─────────────────────────────────

server.tool(
  "analyze_review_trends",
  "Analyze review trends over time. Shows recurring themes in customer feedback, rating trends by week or month, and overall sentiment direction.",
  {
    group_by: z
      .enum(["week", "month"])
      .default("month")
      .describe("Group trend data by week or month"),
    date_start: z.string().optional().describe("Start date (ISO 8601)"),
    date_end: z.string().optional().describe("End date (ISO 8601)"),
  },
  async (params) => {
    try {
      const reviews = await adapter.listReviews({
        limit: 500,
        dateRange:
          params.date_start && params.date_end
            ? { start: params.date_start, end: params.date_end }
            : undefined,
      });

      const analysis = analyzeReviewTrends(reviews, params.group_by);

      const themes = analysis.topThemes
        .map((t) => `  ${t.sentiment === "positive" ? "✅" : t.sentiment === "negative" ? "❌" : "➖"} "${t.theme}" — mentioned ${t.count}x`)
        .join("\n");

      const trend = analysis.ratingTrend
        .map((t) => `  ${t.period}: ${"★".repeat(Math.round(t.avgRating))} ${t.avgRating} avg (${t.count} reviews)`)
        .join("\n");

      const text =
        `Review Trend Analysis\n` +
        `Sentiment direction: ${analysis.sentimentShift}\n\n` +
        `Top themes in customer feedback:\n${themes}\n\n` +
        `Rating trend by ${params.group_by}:\n${trend}`;

      return { content: [{ type: "text" as const, text }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ─── Tool: list_connected_platforms ──────────────────────────────

server.tool(
  "list_connected_platforms",
  "Show which review platforms are connected and their status. Displays platform name, connection status, location count, and total reviews.",
  {},
  async () => {
    // For MVP, show demo status. In production, check actual connections.
    const platforms = [
      { platform: "google", connected: true, accountName: "Demo Business", locationCount: 2, totalReviews: 12, lastSync: new Date().toISOString() },
      { platform: "yelp", connected: false },
      { platform: "trustpilot", connected: false },
      { platform: "g2", connected: false },
      { platform: "appstore", connected: false },
      { platform: "playstore", connected: false },
    ];

    const formatted = platforms
      .map(
        (p) =>
          `${p.connected ? "✅" : "⬜"} ${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}` +
          (p.connected
            ? ` — ${p.accountName} | ${p.locationCount} locations | ${p.totalReviews} reviews | Last sync: ${new Date(p.lastSync!).toLocaleString()}`
            : " — Not connected")
      )
      .join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Connected Review Platforms:\n\n${formatted}\n\nTo connect additional platforms, visit your Echoback dashboard.`,
        },
      ],
    };
  }
);

// ─── Transport: STDIO or SSE ─────────────────────────────────────

const transportMode = process.argv.includes("--sse") ? "sse" : "stdio";

if (transportMode === "sse") {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => transports.delete(transport.sessionId));
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    // express.json() already consumed the body stream; pass it explicitly.
    await transport.handlePostMessage(req, res, req.body);
  });

  // Health check
  app.get("/health", (_, res) => res.json({ status: "ok", server: "echoback", version: "1.0.0" }));

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, () => {
    console.log(`Echoback MCP server (SSE) running on port ${port}`);
    console.log(`Connect URL: http://localhost:${port}/sse`);
  });
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Echoback MCP server running on stdio");
}
