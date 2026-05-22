"use client";

import { useState } from "react";
import Link from "next/link";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .nav-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: var(--text-primary);
        }
        .nav-mobile-overlay {
          display: none;
        }
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .nav-hamburger { display: flex; flex-direction: column; gap: 5px; }
          .nav-hamburger span {
            width: 20px; height: 1.5px;
            background: var(--text-primary);
            transition: all 0.2s ease;
          }
          .nav-mobile-overlay {
            display: flex;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--bg-primary);
            z-index: 100;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px;
          }
          .nav-mobile-overlay a,
          .nav-mobile-overlay button {
            width: 100%;
            max-width: 280px;
            text-align: center;
          }
        }
      `}</style>

      <nav className="sans" style={{
        padding: "20px 24px",
        maxWidth: 1080,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        zIndex: 50,
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

        {/* Desktop nav */}
        <div className="nav-links">
          <Link href="/privacy" className="btn-ghost" style={{ padding: "8px 20px", fontSize: 14, textDecoration: "none" }}>
            Privacy
          </Link>
          <a href="https://github.com/brandononchain/echoback" target="_blank" rel="noopener"
            className="btn-ghost" style={{ padding: "8px 20px", fontSize: 14, textDecoration: "none" }}>
            Docs
          </a>
          <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 14 }}>
            Connect to Claude
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setOpen(true)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div className="nav-mobile-overlay">
          <button
            onClick={() => setOpen(false)}
            style={{
              position: "absolute", top: 20, right: 24,
              background: "none", border: "none", fontSize: 28,
              color: "var(--text-primary)", cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Close menu"
          >
            ×
          </button>
          <Link href="/privacy" className="btn-ghost"
            onClick={() => setOpen(false)}
            style={{ padding: "14px 28px", fontSize: 16, textDecoration: "none" }}>
            Privacy
          </Link>
          <a href="https://github.com/brandononchain/echoback" target="_blank" rel="noopener"
            className="btn-ghost"
            style={{ padding: "14px 28px", fontSize: 16, textDecoration: "none" }}>
            Docs
          </a>
          <button className="btn-primary" style={{ padding: "14px 28px", fontSize: 16 }}>
            Connect to Claude
          </button>
        </div>
      )}
    </>
  );
}
