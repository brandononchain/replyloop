import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStripe } from "@/lib/billing/stripe";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { getOrgForUser } from "@/lib/api/orgs";
import type { PlanTier } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    organization_id?: string;
    plan?: PlanTier;
    interval?: "month" | "year";
  };
  if (!body.organization_id || !body.plan) {
    return NextResponse.json({ error: "organization_id_and_plan_required" }, { status: 400 });
  }
  const interval = body.interval ?? "month";

  const membership = await getOrgForUser(body.organization_id, "owner");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const plan = PLAN_LIMITS[body.plan];
  const priceId = interval === "year" ? plan.stripePriceYearly : plan.stripePriceMonthly;
  if (!priceId) {
    return NextResponse.json(
      { error: "price_not_configured", plan: plan.tier, interval },
      { status: 400 }
    );
  }

  const stripe = requireStripe();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  // Reuse or create the Stripe customer for this org
  let customerId = membership.organization.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRes.user.email ?? undefined,
      name: membership.organization.name,
      metadata: { organization_id: membership.organization.id },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", membership.organization.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organization_id: membership.organization.id, plan: plan.tier },
    },
    success_url: `${origin}/dashboard/billing?status=success`,
    cancel_url: `${origin}/dashboard/billing?status=canceled`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
