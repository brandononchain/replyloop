"use client";

import { FadeIn } from "./animations";

const CONVERSATION = [
  { role: "user", text: "Show me all unanswered negative reviews from this week" },
  {
    role: "assistant",
    text: `Found 3 reviews needing attention:\n\n[1/5] James T. — May 11\n"Terrible experience. Waited 45 minutes..."\n↳ ⚠ No response yet\n\n[2/5] David K. — May 9\n"Parking is a nightmare and prices went up..."\n↳ ⚠ No response yet`,
  },
  { role: "user", text: "Draft a response to James — empathetic, offer to make it right" },
  {
    role: "assistant",
    text: `Here's a draft:\n\n"James, thank you for sharing your experience. We're sorry about the long wait — that's not the standard we hold ourselves to. We'd love the chance to make this right. Please reach out directly and we'll ensure your next visit is the experience you deserve."`,
  },
];

export function Hero() {
  return (
    <section style={{ padding: "80px 24px 60px", maxWidth: 1080, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ maxWidth: 640, marginBottom: 64 }}>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            marginBottom: 20,
          }}>
            Your reviews.<br />
            <span style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
              Answered, on a loop.
            </span>
          </h1>
          <p className="sans" style={{
            fontSize: 17, lineHeight: 1.6, color: "var(--text-secondary)",
            marginBottom: 32, maxWidth: 480,
          }}>
            Every review answered, by an agent that sounds like you.
            Replyloop connects Claude to Google, Yelp, Trustpilot, and G2 — read, reply, and spot trends from one chat.
          </p>
          <div className="hero-buttons" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary">Connect to Claude</button>
            <a href="#how-it-works" className="btn-ghost" style={{ textDecoration: "none" }}>
              See how it works
            </a>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          maxWidth: 720,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
        }}>
          <div className="sans" style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 13,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "var(--positive)",
            }} />
            replyloop connected
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {CONVERSATION.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: msg.role === "user" ? "var(--border)" : "var(--bg-secondary)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 2,
                }}>
                  <span className="sans" style={{
                    fontSize: 12, fontWeight: 500, color: "var(--text-secondary)",
                  }}>
                    {msg.role === "user" ? "B" : "R"}
                  </span>
                </div>
                <div className="sans" style={{
                  fontSize: 14, lineHeight: 1.6,
                  color: msg.role === "user" ? "var(--text-primary)" : "#3A3835",
                  whiteSpace: "pre-line",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
