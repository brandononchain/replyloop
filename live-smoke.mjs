import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const url = new URL(process.env.URL ?? "https://replyloop-production.up.railway.app/sse");
console.log(`Connecting to ${url}\n`);

const client = new Client({ name: "replyloop-smoke", version: "0.0.1" }, { capabilities: {} });
await client.connect(new SSEClientTransport(url));

const tools = await client.listTools();
console.log("Discovered tools:", tools.tools.map((t) => t.name).join(", "));

console.log("\n--- get_reputation_summary ---");
const summary = await client.callTool({ name: "get_reputation_summary", arguments: {} });
console.log(summary.content[0].text);

console.log("\n--- get_review_alerts (severity>=3) ---");
const alerts = await client.callTool({ name: "get_review_alerts", arguments: { min_severity: 3 } });
console.log(alerts.content[0].text.slice(0, 600));

console.log("\n--- list_reviews (limit=2) ---");
const list = await client.callTool({ name: "list_reviews", arguments: { limit: 2 } });
console.log(list.content[0].text);

console.log("\n--- respond_to_review (rev_002) ---");
const respond = await client.callTool({
  name: "respond_to_review",
  arguments: {
    review_id: "rev_002",
    response_text: "We're so sorry about your visit. Please email care@example.com so we can make this right.",
  },
});
console.log(respond.content[0].text);

await client.close();
console.log("\nAll tools responded. Server is healthy for Claude.");
process.exit(0);
