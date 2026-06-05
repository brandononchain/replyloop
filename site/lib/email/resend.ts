import "server-only";
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend | null {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _client = new Resend(key);
  return _client;
}

export const RESEND_FROM = process.env.RESEND_FROM || "Replyloop <hello@replyloop.dev>";
