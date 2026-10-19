import { DASHBOARD_HASH } from "../route";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(244,241,234,0.1)]">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 18 9 6h2.4L5.4 18H3Z" fill="#f4f1ea" />
              <path d="M10 18 16 6h2.4L12.4 18H10Z" fill="#ff2e1f" />
              <path d="M17 18 20.5 11h1.8L19 18h-2Z" fill="#f4f1ea" opacity="0.5" />
            </svg>
            <span className="lp-mono text-[12px] font-bold tracking-[0.14em] text-[#f4f1ea]">RACE/CONTROL</span>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[#6e6a61]">
            Timing, telemetry, strategy and driver battles — choreographed with Anime.js.
          </p>
          <a href={DASHBOARD_HASH} className="lp-cta mt-6">
            OPEN DASHBOARD <span className="lp-cta-arrow" aria-hidden>→</span>
          </a>
        </div>
        <nav aria-label="Experiments">
          <h2 className="lp-tech">experiments</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-[#a39e93]">
            {[["top", "Orbit"], ["track", "Racing line"], ["strategy", "Scroll race"], ["timing", "Timing board"], ["telemetry", "Telemetry wave"]].map(([id, l]) => (
              <li key={id}><a href={`#${id}`} className="transition hover:text-[#f4f1ea]">{l}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Inside">
          <h2 className="lp-tech">inside</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-[#a39e93]">
            <li><a href={DASHBOARD_HASH} className="transition hover:text-[#f4f1ea]">Timing tower</a></li>
            <li><a href={DASHBOARD_HASH} className="transition hover:text-[#f4f1ea]">Telemetry traces</a></li>
            <li><a href={DASHBOARD_HASH} className="transition hover:text-[#f4f1ea]">Tire strategy</a></li>
            <li><a href="https://animejs.com" target="_blank" rel="noreferrer" className="transition hover:text-[#f4f1ea]">Motion · Anime.js ↗</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-[rgba(244,241,234,0.08)]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8">
          <p className="lp-mono text-[10px] tracking-[0.16em] text-[#6e6a61]">© 2026 RACE/CONTROL · UNOFFICIAL FAN-MADE CONCEPT</p>
          <p className="lp-mono max-w-xl text-[10px] leading-relaxed tracking-[0.08em] text-[#57534a]">
            NOT AFFILIATED WITH FORMULA 1, THE FIA, OR ANY TEAM. ALL CARS, CIRCUITS AND DRIVER PAIRINGS ARE FICTIONAL OR ILLUSTRATIVE.
          </p>
        </div>
      </div>
    </footer>
  );
}
