"use client";

import { useState } from "react";
import type { PlanTier } from "@/lib/supabase/types";

interface PlanCard {
  tier: PlanTier;
  label: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlight: boolean;
  hasStripePrice: boolean;
}

export default function BillingClient({
  organizationId,
  currentPlan,
  plans,
  hasCustomer,
}: {
  organizationId: string;
  currentPlan: PlanTier;
  plans: PlanCard[];
  hasCustomer: boolean;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: PlanTier) {
    setBusy(plan);
    setError(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: organizationId, plan, interval }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok || !json.url) {
      setError(json.error || "Checkout failed");
      return;
    }
    window.location.href = json.url;
  }

  async function portal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: organizationId }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok || !json.url) {
      setError(json.error || "Could not open portal");
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div>
      <div className="flex items-center gap-3 sans text-sm mb-6">
        <button
          onClick={() => setInterval("month")}
          className={`px-3 py-1 rounded ${interval === "month" ? "bg-[color:var(--text-primary)] text-[color:var(--bg-primary)]" : "border border-[color:var(--border)]"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("year")}
          className={`px-3 py-1 rounded ${interval === "year" ? "bg-[color:var(--text-primary)] text-[color:var(--bg-primary)]" : "border border-[color:var(--border)]"}`}
        >
          Yearly (2 months free)
        </button>
        {hasCustomer && (
          <button
            onClick={portal}
            disabled={busy === "portal"}
            className="ml-auto text-xs underline text-[color:var(--text-muted)]"
          >
            {busy === "portal" ? "Opening…" : "Manage billing in Stripe →"}
          </button>
        )}
      </div>

      {error && <p className="sans text-sm text-[color:var(--negative)] mb-4">{error}</p>}

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const price = interval === "month" ? p.priceMonthly : p.priceYearly / 12;
          const isCurrent = currentPlan === p.tier;
          return (
            <div
              key={p.tier}
              className={`border rounded p-6 bg-[color:var(--bg-elevated)] ${
                p.highlight ? "border-[color:var(--accent)]" : "border-[color:var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl">{p.label}</h3>
                {isCurrent && (
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--positive)]">current</span>
                )}
              </div>
              <div className="mt-3">
                <span className="text-3xl">${Math.round(price)}</span>
                <span className="sans text-sm text-[color:var(--text-muted)]">/mo</span>
              </div>

              <ul className="sans text-sm text-[color:var(--text-secondary)] space-y-1.5 mt-5">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>

              {!isCurrent && (
                <button
                  onClick={() => checkout(p.tier)}
                  disabled={busy === p.tier || !p.hasStripePrice}
                  className="w-full mt-6 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded sans text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {busy === p.tier ? "Loading…" : p.hasStripePrice ? "Upgrade" : "Coming soon"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
