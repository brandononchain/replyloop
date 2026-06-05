"use client";

import { useState } from "react";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function KeysClient({
  organizationId,
  initialKeys,
  planLimit,
}: {
  organizationId: string;
  initialKeys: ApiKeyRow[];
  planLimit: number;
}) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["mcp:read", "mcp:respond"]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCount = keys.filter((k) => !k.revoked_at).length;
  const limitReached = activeCount >= planLimit;

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/orgs/${organizationId}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to create key");
      return;
    }
    setNewKey(json.plaintext);
    setKeys([json.key, ...keys]);
    setName("");
    setCreating(false);
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Anything using it will stop working immediately.")) return;
    const res = await fetch(`/api/orgs/${organizationId}/keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys(keys.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
    }
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="border border-[color:var(--accent)] bg-[color:var(--accent-soft)] rounded p-5">
          <div className="text-sm font-medium mb-2">Save this key — it will not be shown again.</div>
          <pre className="mono text-xs bg-[color:var(--bg-elevated)] p-3 rounded overflow-x-auto select-all">
            {newKey}
          </pre>
          <button
            onClick={() => setNewKey(null)}
            className="sans text-xs underline mt-3 text-[color:var(--text-secondary)]"
          >
            I've saved it
          </button>
        </div>
      )}

      {!creating && (
        <button
          disabled={limitReached}
          onClick={() => setCreating(true)}
          className="sans text-sm px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded hover:opacity-90 disabled:opacity-50"
        >
          {limitReached ? `Limit reached (${activeCount} / ${planLimit})` : "Create API key"}
        </button>
      )}

      {creating && (
        <form onSubmit={createKey} className="border border-[color:var(--border)] rounded p-5 space-y-3 bg-[color:var(--bg-elevated)] sans">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Claude Desktop · Brandon"
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded text-sm"
            />
          </label>
          <div>
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Scopes</span>
            <div className="mt-2 flex gap-3 text-sm">
              {["mcp:read", "mcp:respond", "mcp:admin"].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={(e) => {
                      setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s));
                    }}
                  />
                  <code className="mono text-xs">{s}</code>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-[color:var(--negative)]">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="text-sm px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded">
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="text-sm px-4 py-2 border border-[color:var(--border)] rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="w-full sans text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-[color:var(--text-muted)] border-b border-[color:var(--border)]">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Prefix</th>
            <th className="py-2 pr-3">Scopes</th>
            <th className="py-2 pr-3">Last used</th>
            <th className="py-2 pr-3">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-[color:var(--text-muted)]">
                No keys yet.
              </td>
            </tr>
          )}
          {keys.map((k) => (
            <tr key={k.id} className="border-b border-[color:var(--border)]">
              <td className="py-3 pr-3">{k.name}</td>
              <td className="py-3 pr-3 mono text-xs">{k.key_prefix}…</td>
              <td className="py-3 pr-3 mono text-xs">{k.scopes.join(", ")}</td>
              <td className="py-3 pr-3 text-[color:var(--text-muted)]">
                {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "—"}
              </td>
              <td className="py-3 pr-3">
                {k.revoked_at ? (
                  <span className="text-[color:var(--negative)]">revoked</span>
                ) : (
                  <span className="text-[color:var(--positive)]">active</span>
                )}
              </td>
              <td className="py-3 text-right">
                {!k.revoked_at && (
                  <button
                    onClick={() => revoke(k.id)}
                    className="text-xs underline text-[color:var(--text-muted)] hover:text-[color:var(--negative)]"
                  >
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
