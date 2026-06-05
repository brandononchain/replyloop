"use client";

import { useState, useEffect } from "react";
import { FadeIn, AnimatedNumber } from "./animations";

/* ─── Stats ─── */

export function Stats() {
  return (
    <section style={{ padding: "40px 24px 80px", maxWidth: 1080, margin: "0 auto" }}>
      <div className="sans grid-3" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, textAlign: "center",
      }}>
        {[
          { num: 375, label: "connectors in Claude's directory", suffix: "+" },
          { num: 0, label: "for reputation management", suffix: "" },
          { num: 33, label: "million US businesses need this", suffix: "M" },
        ].map((s, i) => (
          <FadeIn key={i} delay={300 + i * 100}>
            <div>
              <div style={{
                fontSize: 42, fontWeight: 400,
                fontFamily: "'Newsreader', serif", letterSpacing: "-0.03em",
              }}>
                <AnimatedNumber target={s.num} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ─── How It Works ─── */

const STEPS = [
  {
    step: "01",
    title: "Add the connector",
    desc: "Paste the Replyloop URL into Claude Settings → Connectors. One field, one click.",
  },
  {
    step: "02",
    title: "Authorize your platforms",
    desc: "Sign into Google, Yelp, or Trustpilot. OAuth handles the rest. Your credentials stay with you.",
  },
  {
    step: "03",
    title: "Start talking",
    desc: "Ask Claude about your reviews. Read them, respond, analyze trends. All in natural language.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "80px 24px", background: "var(--bg-secondary)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn>
          <p className="sans" style={{
            fontSize: 13, fontWeight: 500, color: "var(--accent)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>How it works</p>
          <h2 style={{
            fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 48,
          }}>
            Three steps. Under a minute.
          </h2>
        </FadeIn>

        <div className="grid-3" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
        }}>
          {STEPS.map((s, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="card">
                <span className="mono" style={{
                  fontSize: 13, color: "var(--accent)", display: "block", marginBottom: 16,
                }}>{s.step}</span>
                <h3 className="sans" style={{
                  fontSize: 18, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em",
                }}>
                  {s.title}
                </h3>
                <p className="sans" style={{
                  fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)",
                }}>
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Use Cases ─── */

const PROMPTS = [
  "Show me every unanswered 1-star review from this month",
  "Draft responses to my last 10 Google reviews in my brand voice",
  "What are customers complaining about most this quarter",
  "Which location has the lowest average rating right now",
  "Summarize today's new reviews across all platforms",
];

export function UseCases() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % PROMPTS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn>
          <p className="sans" style={{
            fontSize: 13, fontWeight: 500, color: "var(--accent)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>What you can ask</p>
          <h2 style={{
            fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 48,
          }}>
            Real prompts. Real answers.
          </h2>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PROMPTS.map((prompt, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div
                className="card"
                onClick={() => setActive(i)}
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  borderColor: active === i ? "var(--accent)" : "var(--border)",
                  background: active === i ? "#FFFCF5" : "var(--bg-elevated)",
                  transition: "all 0.3s ease",
                }}
              >
                <span className="mono" style={{
                  fontSize: 14,
                  color: active === i ? "var(--accent)" : "var(--text-secondary)",
                }}>
                  → &quot;{prompt}&quot;
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Platforms ─── */

const PLATFORMS = [
  { name: "Google", active: true },
  { name: "Trustpilot", active: false },
  { name: "Yelp", active: false },
  { name: "G2", active: false },
  { name: "App Store", active: false },
  { name: "Play Store", active: false },
];

export function Platforms() {
  return (
    <section style={{ padding: "80px 24px", background: "var(--bg-secondary)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
        <FadeIn>
          <p className="sans" style={{
            fontSize: 13, fontWeight: 500, color: "var(--accent)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>Supported platforms</p>
          <h2 style={{
            fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 48,
          }}>
            Every review, one place.
          </h2>
        </FadeIn>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {PLATFORMS.map((p, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="sans" style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: p.active ? "var(--bg-elevated)" : "transparent",
                border: `1px solid ${p.active ? "var(--border)" : "var(--border-hover)"}`,
                fontSize: 14,
                fontWeight: 500,
                color: p.active ? "var(--text-primary)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                {p.active && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "var(--positive)",
                  }} />
                )}
                {p.name}
                {!p.active && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>soon</span>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */

const PLANS = [
  {
    name: "Starter",
    price: 29,
    desc: "For single-location businesses",
    features: ["1 platform", "1 location", "Read + respond", "Sentiment summary"],
    popular: false,
  },
  {
    name: "Pro",
    price: 79,
    desc: "For growing businesses",
    features: [
      "All platforms",
      "Unlimited locations",
      "Trend analysis",
      "Review alerts",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Agency",
    price: 199,
    desc: "For teams managing clients",
    features: [
      "Multi-business",
      "White-label responses",
      "Client dashboards",
      "API access",
      "Dedicated support",
    ],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="sans" style={{
              fontSize: 13, fontWeight: 500, color: "var(--accent)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            }}>Pricing</p>
            <h2 style={{
              fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em",
            }}>
              Simple, transparent, fair.
            </h2>
          </div>
        </FadeIn>

        <div className="grid-3" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
        }}>
          {PLANS.map((plan, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="card" style={{
                borderColor: plan.popular ? "var(--accent)" : "var(--border)",
                position: "relative",
              }}>
                {plan.popular && (
                  <span className="sans" style={{
                    position: "absolute", top: -10, right: 20,
                    background: "var(--accent)", color: "#FFFFFF",
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    borderRadius: 999, letterSpacing: "0.03em",
                  }}>POPULAR</span>
                )}
                <h3 className="sans" style={{
                  fontSize: 18, fontWeight: 500, marginBottom: 4,
                }}>
                  {plan.name}
                </h3>
                <p className="sans" style={{
                  fontSize: 13, color: "var(--text-muted)", marginBottom: 20,
                }}>
                  {plan.desc}
                </p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.03em" }}>
                    ${plan.price}
                  </span>
                  <span className="sans" style={{ fontSize: 14, color: "var(--text-muted)" }}>
                    /mo
                  </span>
                </div>
                <ul className="sans" style={{
                  listStyle: "none", display: "flex", flexDirection: "column", gap: 10,
                  marginBottom: 28, padding: 0,
                }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      fontSize: 14, color: "#3A3835",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "var(--accent)", fontSize: 14 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={plan.popular ? "btn-primary" : "btn-ghost"}
                  style={{ width: "100%" }}
                >
                  Get started
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */

export function CTA() {
  return (
    <section style={{ padding: "80px 24px 100px", textAlign: "center" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn>
          <h2 style={{
            fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            Stop ignoring your reviews.
          </h2>
          <p className="sans" style={{
            fontSize: 16, color: "var(--text-secondary)",
            marginBottom: 32, maxWidth: 420, margin: "0 auto 32px",
          }}>
            Connect Replyloop to Claude in under a minute. Your first 14 days are free.
          </p>
          <button className="btn-primary" style={{ fontSize: 16, padding: "14px 36px" }}>
            Connect to Claude
          </button>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Footer ─── */

export function Footer() {
  return (
    <footer className="sans" style={{
      padding: "32px 24px",
      borderTop: "1px solid var(--border)",
      maxWidth: 1080,
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 13,
      color: "var(--text-muted)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>replyloop</span>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <a href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</a>
        <a
          href="https://github.com/brandononchain/replyloop"
          target="_blank"
          rel="noopener"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          GitHub
        </a>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
