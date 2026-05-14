import { Nav } from "../components/nav";
import { Footer } from "../components/sections";

export default function Privacy() {
  return (
    <main>
      <style>{`
        .btn-primary {
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 15px;
          background: #1A1A1A; color: #FAF9F7; border: none; padding: 12px 28px;
          border-radius: 999px; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-primary:hover { background: #333; }
        .btn-ghost {
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 15px;
          background: transparent; color: #1A1A1A; border: 1px solid #E8E5DE;
          padding: 12px 28px; border-radius: 999px; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-ghost:hover { border-color: #D4D0C8; background: #F5F3EF; }
      `}</style>
      <Nav />
      <section className="sans" style={{
        maxWidth: 640, margin: "0 auto", padding: "60px 24px 100px",
        fontSize: 15, lineHeight: 1.8, color: "#3A3835",
      }}>
        <h1 style={{
          fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 400,
          letterSpacing: "-0.02em", marginBottom: 8, color: "#1A1A1A",
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#9B9590", marginBottom: 40 }}>Last updated: May 14, 2026</p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          What Echoback does
        </h2>
        <p style={{ marginBottom: 16 }}>
          Echoback is an MCP connector that gives Claude access to your review platform accounts (Google Business Profile, Yelp, Trustpilot, G2, and others). It reads and writes review data on your behalf when you interact with Claude.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Data we access
        </h2>
        <p style={{ marginBottom: 16 }}>
          When you connect a review platform, Echoback accesses your business reviews, ratings, reviewer names (as displayed publicly on the platform), and your existing responses. We only access data necessary to provide the service.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Data we store
        </h2>
        <p style={{ marginBottom: 16 }}>
          We store your OAuth refresh tokens (encrypted at rest) to maintain platform connections. We do not store your review content, customer data, or conversation history with Claude. Review data is fetched in real-time and passed through to Claude during your session.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Data we never collect
        </h2>
        <p style={{ marginBottom: 16 }}>
          We never collect passwords, payment information, personal health information, or any data unrelated to your review platforms. We do not sell, share, or monetize your data in any way.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Third-party services
        </h2>
        <p style={{ marginBottom: 16 }}>
          Echoback connects to review platforms via their official APIs (Google Business Profile API, Yelp Fusion API, Trustpilot Business API, G2 API). Your data is subject to each platform's own privacy policies. Echoback operates as an MCP server within Anthropic's Claude ecosystem.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Disconnecting
        </h2>
        <p style={{ marginBottom: 16 }}>
          You can disconnect Echoback at any time through Claude Settings → Connectors. Upon disconnection, we delete all stored tokens associated with your account within 24 hours.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 32, marginBottom: 8, color: "#1A1A1A" }}>
          Contact
        </h2>
        <p style={{ marginBottom: 16 }}>
          Questions about this policy? Reach out at privacy@echoback.dev.
        </p>
      </section>
      <Footer />
    </main>
  );
}
