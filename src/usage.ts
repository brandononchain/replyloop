// Usage event logging. Fire-and-forget so MCP latency isn't gated on DB writes.

import { supabase } from "./db/supabase.js";

export type UsageEventType =
  | "mcp.tool_call"
  | "mcp.session_opened"
  | "platform.sync"
  | "response.sent";

export function logUsage(
  organizationId: string,
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {},
  quantity = 1
): void {
  supabase
    .from("usage_events")
    .insert({ organization_id: organizationId, event_type: eventType, quantity, metadata })
    .then(({ error }) => {
      if (error) console.error("[usage] insert failed:", error.message);
    });
}

export function logAudit(
  organizationId: string,
  action: string,
  opts: {
    apiKeyId?: string;
    userId?: string;
    actorKind?: "user" | "api_key" | "system";
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  supabase
    .from("audit_log")
    .insert({
      organization_id: organizationId,
      action,
      actor_kind: opts.actorKind ?? (opts.apiKeyId ? "api_key" : opts.userId ? "user" : "system"),
      api_key_id: opts.apiKeyId ?? null,
      user_id: opts.userId ?? null,
      resource_type: opts.resourceType ?? null,
      resource_id: opts.resourceId ?? null,
      metadata: opts.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.error("[audit] insert failed:", error.message);
    });
}
