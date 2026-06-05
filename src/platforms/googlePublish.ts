// Publish a review reply to Google Business Profile using the connection's
// (refreshed) OAuth token. Returns the timestamp Google recorded for the reply.

import { ensureFreshGoogleToken } from "../platforms/googleAuth.js";

interface PostReplyArgs {
  connectionId: string;
  organizationId: string;
  reviewResourceName: string; // accounts/{a}/locations/{l}/reviews/{r}
  responseText: string;
}

interface PostReplyResult {
  success: boolean;
  postedAt: string;
  error?: string;
}

export async function postGoogleReply(args: PostReplyArgs): Promise<PostReplyResult> {
  try {
    const token = await ensureFreshGoogleToken(args.connectionId, args.organizationId);
    const url = `https://mybusiness.googleapis.com/v4/${args.reviewResourceName}/reply`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: args.responseText }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { success: false, postedAt: new Date().toISOString(), error: `Google API ${res.status}: ${body}` };
    }
    const data = (await res.json()) as { updateTime?: string };
    return { success: true, postedAt: data.updateTime ?? new Date().toISOString() };
  } catch (err) {
    return {
      success: false,
      postedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
