import type { PlanTier } from "@/lib/supabase/types";

export interface PlanLimits {
  tier: PlanTier;
  label: string;
  priceMonthly: number; // USD
  priceYearly: number;
  seats: number;
  locations: number;
  historyDays: number;
  routingRules: number;
  apiKeys: number;
  features: string[];
  stripePriceMonthly?: string;
  stripePriceYearly?: string;
  cta: string;
  highlight?: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    tier: "free",
    label: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    seats: 1,
    locations: 1,
    historyDays: 30,
    routingRules: 0,
    apiKeys: 1,
    features: ["1 location", "1 seat", "Demo data + 1 live connection", "30-day review history", "Manual responses only"],
    cta: "Start free",
  },
  starter: {
    tier: "starter",
    label: "Starter",
    priceMonthly: 19,
    priceYearly: 190,
    seats: 1,
    locations: 3,
    historyDays: 90,
    routingRules: 3,
    apiKeys: 3,
    features: ["3 locations", "1 seat", "All review platforms", "90-day history", "3 routing rules", "Email alerts"],
    stripePriceMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "price_1TemXPK8tV1sdQaCz29UsinL",
    stripePriceYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "price_1TemXPK8tV1sdQaCOxENryTB",
    cta: "Start free trial",
  },
  pro: {
    tier: "pro",
    label: "Pro",
    priceMonthly: 79,
    priceYearly: 790,
    seats: 5,
    locations: 25,
    historyDays: 365,
    routingRules: 25,
    apiKeys: 10,
    features: ["25 locations", "5 seats", "All platforms", "1 year history", "25 routing rules", "Audit log", "Slack + email alerts"],
    stripePriceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_1TemXOK8tV1sdQaCM8brpiho",
    stripePriceYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "price_1TemXNK8tV1sdQaCg69PmLgs",
    cta: "Start free trial",
    highlight: true,
  },
  team: {
    tier: "team",
    label: "Team",
    priceMonthly: 249,
    priceYearly: 2490,
    seats: 25,
    locations: 250,
    historyDays: 1095,
    routingRules: 250,
    apiKeys: 50,
    features: [
      "250 locations",
      "25 seats",
      "RBAC (owner / admin / responder / viewer)",
      "Advanced routing & SLA escalation",
      "3-year history",
      "Audit log + SSO (coming soon)",
      "Priority support",
    ],
    stripePriceMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "price_1TemXNK8tV1sdQaCbBlbxnm2",
    stripePriceYearly: process.env.STRIPE_PRICE_TEAM_YEARLY ?? "price_1TemXLK8tV1sdQaCR69Vzbp5",
    cta: "Start free trial",
  },
  enterprise: {
    tier: "enterprise",
    label: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    seats: 999,
    locations: 9999,
    historyDays: 3650,
    routingRules: 9999,
    apiKeys: 999,
    features: ["Unlimited everything", "SSO / SAML", "Custom DPA", "Dedicated success manager", "Custom SLAs"],
    cta: "Contact sales",
  },
};

export function getPlan(tier: PlanTier | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? "free"];
}

export function planAllows(tier: PlanTier, feature: keyof PlanLimits, value: number): boolean {
  const plan = getPlan(tier);
  const limit = plan[feature];
  return typeof limit === "number" ? value <= limit : true;
}
