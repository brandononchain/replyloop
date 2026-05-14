import Link from "next/link";

export function Nav() {
  return (
    <nav className="sans" style={{
      padding: "20px 24px",
      maxWidth: 1080,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit" }}>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
          echoback
        </span>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
          display: "inline-block", marginTop: 2,
        }} />
      </Link>
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/privacy" className="btn-ghost" style={{ padding: "8px 20px", fontSize: 14, textDecoration: "none" }}>
          Privacy
        </Link>
        <a
          href="https://github.com/brandononchain/echoback"
          target="_blank"
          rel="noopener"
          className="btn-ghost"
          style={{ padding: "8px 20px", fontSize: 14, textDecoration: "none" }}
        >
          Docs
        </a>
        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 14 }}>
          Connect to Claude
        </button>
      </div>
    </nav>
  );
}
