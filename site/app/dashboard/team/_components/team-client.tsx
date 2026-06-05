"use client";

import { useState } from "react";
import type { OrgRole } from "@/lib/supabase/types";

interface Member {
  user_id: string;
  role: OrgRole;
  created_at: string;
}
interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  expires_at: string;
}

export default function TeamClient({
  organizationId,
  currentRole,
  members,
  invitations,
  planLimit,
}: {
  organizationId: string;
  currentRole: OrgRole;
  members: Member[];
  invitations: Invitation[];
  planLimit: number;
}) {
  const canInvite = currentRole === "owner" || currentRole === "admin";
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("responder");
  const [error, setError] = useState<string | null>(null);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [localInvites, setLocalInvites] = useState<Invitation[]>(invitations);

  const totalSeats = members.length + localInvites.length;
  const limitReached = totalSeats >= planLimit;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/orgs/${organizationId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to invite");
      return;
    }
    setAcceptUrl(json.accept_url);
    setEmailSent(!!json.email_sent);
    setLocalInvites([json.invitation, ...localInvites]);
    setEmail("");
    setInviting(false);
  }

  return (
    <div className="space-y-8">
      {canInvite && !inviting && (
        <button
          disabled={limitReached}
          onClick={() => setInviting(true)}
          className="sans text-sm px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded hover:opacity-90 disabled:opacity-50"
        >
          {limitReached ? `Seat limit reached (${totalSeats} / ${planLimit})` : "Invite member"}
        </button>
      )}

      {inviting && (
        <form onSubmit={invite} className="border border-[color:var(--border)] rounded p-5 space-y-3 bg-[color:var(--bg-elevated)] sans">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded text-sm"
            >
              <option value="viewer">Viewer — read-only access</option>
              <option value="responder">Responder — can respond to reviews</option>
              <option value="admin">Admin — manage settings, keys, members</option>
              {currentRole === "owner" && <option value="owner">Owner — full control + billing</option>}
            </select>
          </label>
          {error && <p className="text-sm text-[color:var(--negative)]">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="text-sm px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded">
              Send invite
            </button>
            <button
              type="button"
              onClick={() => setInviting(false)}
              className="text-sm px-4 py-2 border border-[color:var(--border)] rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {acceptUrl && (
        <div className="border border-[color:var(--accent)] bg-[color:var(--accent-soft)] rounded p-4 sans text-sm">
          <div className="mb-2">
            {emailSent
              ? "Invite sent. They’ll receive an email shortly. You can also share this link directly:"
              : "Invite created. Email delivery isn’t configured — share this link manually:"}
          </div>
          <code className="mono text-xs break-all">{acceptUrl}</code>
        </div>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wider text-[color:var(--text-muted)] sans mb-3">Members</h2>
        <div className="border border-[color:var(--border)] rounded divide-y divide-[color:var(--border)] bg-[color:var(--bg-elevated)]">
          {members.map((m) => (
            <div key={m.user_id} className="px-4 py-3 flex justify-between items-center sans text-sm">
              <span className="mono text-xs">{m.user_id.slice(0, 8)}…</span>
              <span className="text-[color:var(--text-secondary)]">{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      {localInvites.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-[color:var(--text-muted)] sans mb-3">Pending invites</h2>
          <div className="border border-[color:var(--border)] rounded divide-y divide-[color:var(--border)] bg-[color:var(--bg-elevated)]">
            {localInvites.map((i) => (
              <div key={i.id} className="px-4 py-3 flex justify-between items-center sans text-sm">
                <span>{i.email}</span>
                <span className="text-[color:var(--text-secondary)]">{i.role}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
