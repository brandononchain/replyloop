import { NextResponse, type NextRequest } from "next/server";
import { requireStripe } from "@/lib/billing/stripe";
import { getOrgForUser } from "@/lib/api/orgs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { organization_id?: string };
  if (!body.organization_id) {
    return NextResponse.json({ error: "organization_id_required" }, { status: 400 });
  }

  const membership = await getOrgForUser(body.organization_id, "owner");
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!membership.organization.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  const stripe = requireStripe();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  const portal = await stripe.billingPortal.sessions.create({
    customer: membership.organization.stripe_customer_id,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
