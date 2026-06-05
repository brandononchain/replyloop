import { getUserOrgs } from "@/lib/api/orgs";
import { PLAN_LIMITS, getPlan } from "@/lib/billing/plans";
import BillingClient from "./_components/billing-client";

export default async function BillingPage() {
  const orgs = await getUserOrgs();
  const org = orgs[0]?.organization;
  if (!org) return null;

  const currentPlan = getPlan(org.plan);
  const plans = (["starter", "pro", "team"] as const).map((t) => PLAN_LIMITS[t]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl mb-1">Billing</h1>
      <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
        Currently on the <strong>{currentPlan.label}</strong> plan
        {org.trial_ends_at && new Date(org.trial_ends_at) > new Date() && (
          <> · trial ends {new Date(org.trial_ends_at).toLocaleDateString()}</>
        )}
        .
      </p>

      <BillingClient
        organizationId={org.id}
        currentPlan={org.plan}
        plans={plans.map((p) => ({
          tier: p.tier,
          label: p.label,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          features: p.features,
          highlight: p.highlight ?? false,
          hasStripePrice: Boolean(p.stripePriceMonthly),
        }))}
        hasCustomer={Boolean(org.stripe_customer_id)}
      />
    </div>
  );
}
