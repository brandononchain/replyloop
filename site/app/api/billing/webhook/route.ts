import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { requireStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/billing/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlanStatus, PlanTier } from "@/lib/supabase/types";

export const runtime = "nodejs";

// Stripe needs the raw request body to verify the signature.
async function readRawBody(request: NextRequest): Promise<string> {
  return await request.text();
}

function statusFromStripe(s: Stripe.Subscription.Status): PlanStatus {
  switch (s) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
      return s;
    default:
      return "incomplete";
  }
}

export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }
  const stripe = requireStripe();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const raw = await readRawBody(request);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_signature", message: (err as Error).message },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId =
        (sub.metadata?.organization_id as string | undefined) ??
        (await orgIdFromCustomer(sub.customer as string));
      if (!orgId) break;

      const plan = (sub.metadata?.plan as PlanTier | undefined) ?? "free";
      await supabaseAdmin
        .from("organizations")
        .update({
          plan,
          plan_status: statusFromStripe(sub.status),
          stripe_subscription_id: sub.id,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
        .eq("id", orgId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const orgId = await orgIdFromCustomer(invoice.customer as string);
      if (orgId) {
        await supabaseAdmin
          .from("organizations")
          .update({ plan_status: "past_due" })
          .eq("id", orgId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function orgIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}
