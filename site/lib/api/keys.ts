import { randomBytes, createHash } from "node:crypto";

/**
 * Mirror of src/auth/apiKey.ts on the MCP server side. Kept duplicated
 * (and tiny) so the site doesn't import from the server package.
 */

export interface GeneratedKey {
  plaintext: string; // Shown ONCE to the user
  hash: string;     // Stored in api_keys.key_hash
  prefix: string;   // Shown in lists ("rlk_abc123…")
}

export function generateApiKey(): GeneratedKey {
  const raw = randomBytes(18).toString("base64url"); // 24 chars
  const plaintext = `rlk_${raw}`;
  const hash = createHash("sha256").update(plaintext).digest("hex");
  const prefix = plaintext.slice(0, 12);
  return { plaintext, hash, prefix };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
