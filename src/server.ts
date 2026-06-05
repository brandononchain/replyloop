// ────────────────────────────────────────────────────────────
// Replyloop MCP Server
// Reputation management connector for Claude / any MCP client.
//
// Run modes:
//   • stdio (local / self-host)               → demo adapter, no auth
//        tsx src/server.ts
//   • SSE on mcp.replyloop.dev (hosted)       → per-tenant via API key
//        HOSTED_MODE=true tsx src/server.ts --sse
// ────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express, { type Request, type Response } from "express";
import cors from "cors";

import { demoAdapter } from "./platforms/demo.js";
import { getAdapterForOrg } from "./platforms/factory.js";
import { analyzeReviewTrends, getReviewAlerts } from "./analysis/sentiment.js";
import type { PlatformAdapter } from "./platforms/types.js";
import { extractKey, resolveApiKey, type OrgContext } from "./auth/apiKey.js";
import { logUsage, logAudit } from "./usage.js";

const VERSION = "2.0.0";

// ────────────────────────────────────────────────────────────
// Per-session server factory. Each MCP connection gets a fresh server
// bound to the caller's adapter so tenants never share state.
// ────────────────────────────────────────────────────────────

function buildServer(adapter: PlatformAdapter, ctx: OrgContext | null): McpServer {
  const server = new McpServer({ name: "replyloop", version: VERSION });

  const audit = (action: string, metadata: Record<string, unknown> = {}): void => {
    if (!ctx) return;
    logUsage(ctx.organizationId, "mcp.tool_call", { action, ...metadata });
    logAudit(ctx.organizationId, action, { actorKind: "api_key", metadata });
  };

  server.tool(
    "list_reviews",
    "List reviews across connected platforms. Filter by rating, date range, and response status.",
    {
      platform: z.enum(["google", "yelp", "trustpilot", "g2", "appstore", "playstore", "all"]).default("all"),
      min_rating: z.number().min(1).max(5).optional(),
      max_rating: z.number().min(1).max(5).optional(),
      responded: z.boolean().optional(),
      date_start: z.string().optional(),
      date_end: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
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
        audit("list_reviews", { count: reviews.length });
        const formatted = reviews
          .map(
            (r) =>
              `[${r.rating}/5 stars] ${r.author} — ${new Date(r.date).toLocaleDateString()}\n` +
              `"${r.text}"\n` +
              (r.responded ? `↳ Response: "${r.responseText}"\n` : `↳ ⚠ No response yet\n`) +
              `ID: ${r.id} | Location: ${r.locationName || "N/A"}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text" as const, text: `Found ${reviews.length} reviews:\n\n${formatted}` }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error fetching reviews: ${err.message}` }] };
      }
    }
  );

  server.tool(
    "get_review",
    "Get full details of a single review by its ID.",
    { review_id: z.string() },
    async ({ review_id }) => {
      try {
        const review = await adapter.getReview(review_id);
        if (!review) return { content: [{ type: "text" as const, text: `Review ${review_id} not found.` }] };
        audit("get_review", { review_id });
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

  server.tool(
    "respond_to_review",
    "Post a response to a specific review. Publishes upstream.",
    {
      review_id: z.string(),
      response_text: z.string().min(1).max(4096),
    },
    async ({ review_id, response_text }) => {
      try {
        const result = await adapter.respondToReview(review_id, response_text);
        audit("respond_to_review", { review_id, success: result.success });
        if (result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Response posted successfully.\n\nReview ID: ${result.reviewId}\n` +
                  `Platform: ${result.platform}\nPosted at: ${new Date(result.postedAt).toLocaleString()}\n\n` +
                  `Response:\n"${result.responseText}"`,
              },
            ],
          };
        }
        return { content: [{ type: "text" as const, text: `Failed to post response to review ${review_id}.` }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error posting response: ${err.message}` }] };
      }
    }
  );

  server.tool(
    "get_reputation_summary",
    "Overview of reputation metrics.",
    { date_start: z.string().optional(), date_end: z.string().optional() },
    async (params) => {
      try {
        const dateRange =
          params.date_start && params.date_end ? { start: params.date_start, end: params.date_end } : undefined;
        const summary = await adapter.getSummary(dateRange);
        audit("get_reputation_summary");
        const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
        const text =
          `Reputation Summary (${summary.platform})\nPeriod: ${summary.periodStart} to ${summary.periodEnd}\n\n` +
          `Overall: ${stars(summary.averageRating)} ${summary.averageRating}/5\n` +
          `Total Reviews: ${summary.totalReviews}\nResponse Rate: ${summary.responseRate}%\n\n` +
          `Rating Distribution:\n` +
          `  5★  ${"█".repeat(summary.ratingDistribution[5])} ${summary.ratingDistribution[5]}\n` +
          `  4★  ${"█".repeat(summary.ratingDistribution[4])} ${summary.ratingDistribution[4]}\n` +
          `  3★  ${"█".repeat(summary.ratingDistribution[3])} ${summary.ratingDistribution[3]}\n` +
          `  2★  ${"█".repeat(summary.ratingDistribution[2])} ${summary.ratingDistribution[2]}\n` +
          `  1★  ${"█".repeat(summary.ratingDistribution[1])} ${summary.ratingDistribution[1]}\n\n` +
          `Sentiment:\n  Positive (4-5★): ${summary.sentimentBreakdown.positive}\n` +
          `  Neutral  (3★):   ${summary.sentimentBreakdown.neutral}\n` +
          `  Negative (1-2★): ${summary.sentimentBreakdown.negative}`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
      }
    }
  );

  server.tool(
    "get_review_alerts",
    "Urgent reviews ranked by severity.",
    { min_severity: z.number().min(1).max(5).default(2) },
    async ({ min_severity }) => {
      try {
        const all = await adapter.listReviews({ limit: 100 });
        const alerts = getReviewAlerts(all, min_severity);
        audit("get_review_alerts", { count: alerts.length });
        if (alerts.length === 0) {
          return { content: [{ type: "text" as const, text: "No review alerts at the current severity threshold." }] };
        }
        const formatted = alerts
          .map(
            (a) =>
              `🚨 Severity ${a.severity}/5 — ${a.reason}\n` +
              `[${a.review.rating}/5] ${a.review.author}: "${a.review.text.slice(0, 200)}${a.review.text.length > 200 ? "..." : ""}"\n` +
              `Date: ${new Date(a.review.date).toLocaleDateString()} | ID: ${a.review.id}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text" as const, text: `Found ${alerts.length} alerts:\n\n${formatted}` }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
      }
    }
  );

  server.tool(
    "analyze_review_trends",
    "Analyze review trends over time.",
    {
      group_by: z.enum(["week", "month"]).default("month"),
      date_start: z.string().optional(),
      date_end: z.string().optional(),
    },
    async (params) => {
      try {
        const reviews = await adapter.listReviews({
          limit: 500,
          dateRange:
            params.date_start && params.date_end ? { start: params.date_start, end: params.date_end } : undefined,
        });
        const analysis = analyzeReviewTrends(reviews, params.group_by);
        audit("analyze_review_trends", { group_by: params.group_by });
        const themes = analysis.topThemes
          .map((t) => `  ${t.sentiment === "positive" ? "✅" : t.sentiment === "negative" ? "❌" : "➖"} "${t.theme}" — mentioned ${t.count}x`)
          .join("\n");
        const trend = analysis.ratingTrend
          .map((t) => `  ${t.period}: ${"★".repeat(Math.round(t.avgRating))} ${t.avgRating} avg (${t.count} reviews)`)
          .join("\n");
        const text =
          `Review Trend Analysis\nSentiment direction: ${analysis.sentimentShift}\n\n` +
          `Top themes in customer feedback:\n${themes}\n\nRating trend by ${params.group_by}:\n${trend}`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
      }
    }
  );

  server.tool(
    "list_connected_platforms",
    "Show which review platforms are connected and their status.",
    {},
    async () => {
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
            text: `Connected Review Platforms:\n\n${formatted}\n\nManage connections at https://replyloop.dev/dashboard/connections`,
          },
        ],
      };
    }
  );

  return server;
}

// ────────────────────────────────────────────────────────────
// Transport: stdio (local) vs SSE (hosted with API-key auth)
// ────────────────────────────────────────────────────────────

const transportMode = process.argv.includes("--sse") ? "sse" : "stdio";
const hostedMode = process.env.HOSTED_MODE === "true";

if (transportMode === "sse") {
  const app = express();
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: "1mb" }));

  const transports = new Map<string, SSEServerTransport>();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "replyloop", version: VERSION, hosted: hostedMode });
  });

  app.get("/sse", async (req: Request, res: Response) => {
    let ctx: OrgContext | null = null;
    if (hostedMode) {
      const key = extractKey(req);
      if (!key) {
        res.status(401).json({ error: "missing_api_key", hint: "Pass `Authorization: Bearer rlk_...` or `?key=rlk_...`" });
        return;
      }
      ctx = await resolveApiKey(key);
      if (!ctx) {
        res.status(401).json({ error: "invalid_api_key" });
        return;
      }
      logUsage(ctx.organizationId, "mcp.session_opened");
    }
    const adapter = ctx ? await getAdapterForOrg(ctx.organizationId) : demoAdapter;
    const server = buildServer(adapter, ctx);
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => transports.delete(transport.sessionId));
    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, "0.0.0.0", () => {
    console.log(`Replyloop MCP server (SSE) v${VERSION} listening on 0.0.0.0:${port}`);
    console.log(`Mode: ${hostedMode ? "HOSTED (auth required)" : "OPEN (demo adapter)"}`);
  });
} else {
  const server = buildServer(demoAdapter, null);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Replyloop MCP server v${VERSION} running on stdio (demo mode)`);
}
