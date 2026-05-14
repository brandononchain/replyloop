# echoback.

> Reputation management connector for Claude. Own every word they say about you.

Echoback is an MCP server that gives Claude read/write access to your review platforms. Read reviews, respond to them, analyze trends, and get alerts — all from a single conversation.

## Quick Start

### Connect to Claude (SSE mode)

1. Deploy this server (Railway, Render, or any host)
2. In Claude: **Settings → Connectors → Add Custom Connector**
3. Paste the server URL: `https://your-deploy-url.com/sse`
4. Start asking Claude about your reviews

### Run locally (stdio mode)

```bash
npm install
npx tsx src/server.ts
```

### Run locally (SSE mode)

```bash
npm install
npx tsx src/server.ts --sse
# Server runs on http://localhost:3001
# Health check: http://localhost:3001/health
# SSE endpoint: http://localhost:3001/sse
```

## Tools

| Tool | Description |
|------|-------------|
| `list_reviews` | List reviews with filters (rating, date, response status) |
| `get_review` | Get full details of a single review |
| `respond_to_review` | Post a response to a review on the platform |
| `get_reputation_summary` | Overview: avg rating, distribution, response rate, sentiment |
| `get_review_alerts` | Negative reviews ranked by severity needing attention |
| `analyze_review_trends` | Themes, rating trends, sentiment direction over time |
| `list_connected_platforms` | Show which platforms are connected and their status |

## Demo Mode

By default, the server runs with realistic mock data (12 reviews across 2 locations). Set `DEMO_MODE=false` and configure Google OAuth credentials for live data.

## Environment Variables

```env
# Google Business Profile OAuth (for live mode)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Server
PORT=3001
DEMO_MODE=true
```

## Supported Platforms

- [x] Google Business Profile (MVP)
- [ ] Trustpilot
- [ ] Yelp
- [ ] G2
- [ ] Apple App Store
- [ ] Google Play Store

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

```bash
railway login
railway init
railway up
```

## Architecture

```
src/
├── server.ts              # MCP server entry, all 7 tools
├── platforms/
│   ├── types.ts           # Shared Review, Summary, Alert interfaces
│   ├── demo.ts            # Mock data adapter for testing
│   └── google.ts          # Google Business Profile API adapter
└── analysis/
    └── sentiment.ts       # Keyword extraction, trend analysis, alerts
```

## License

MIT
