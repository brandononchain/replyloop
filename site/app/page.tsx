import { Nav } from "./components/nav";
import { Hero } from "./components/hero";
import { Stats, HowItWorks, UseCases, Platforms, Pricing, CTA, Footer } from "./components/sections";

export default function Home() {
  return (
    <main>
      <style>{`
        .btn-primary {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 15px;
          background: #1A1A1A;
          color: #FAF9F7;
          border: none;
          padding: 12px 28px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary:hover { background: #333; transform: translateY(-1px); }
        .btn-ghost {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 15px;
          background: transparent;
          color: #1A1A1A;
          border: 1px solid #E8E5DE;
          padding: 12px 28px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-ghost:hover { border-color: #D4D0C8; background: #F5F3EF; }
        .card {
          background: #FFFFFF;
          border: 1px solid #E8E5DE;
          border-radius: 12px;
          padding: 32px;
          transition: border-color 0.2s ease;
        }
        .card:hover { border-color: #D4D0C8; }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .hero-buttons {
            flex-direction: column !important;
            width: 100%;
          }
          .hero-buttons .btn-primary,
          .hero-buttons .btn-ghost {
            width: 100%;
            text-align: center;
            padding: 14px 28px;
          }
          .card { padding: 24px; }
        }
      `}</style>
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <UseCases />
      <Platforms />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
