import { useEffect, useState } from "react";
import { DASHBOARD_HASH } from "../route";

const LINKS = [
  { id: "timing", label: "LIVE TIMING" },
  { id: "telemetry", label: "TELEMETRY" },
  { id: "track", label: "TRACK" },
  { id: "strategy", label: "STRATEGY" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(244,241,234,0.08)] bg-[rgba(19,18,16,0.72)] backdrop-blur-md">
      <nav aria-label="Landing" className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Back to top">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 18 9 6h2.4L5.4 18H3Z" fill="#f4f1ea" />
            <path d="M10 18 16 6h2.4L12.4 18H10Z" fill="#ff2e1f" />
            <path d="M17 18 20.5 11h1.8L19 18h-2Z" fill="#f4f1ea" opacity="0.5" />
          </svg>
          <span className="lp-mono text-[12px] font-bold tracking-[0.14em] text-[#f4f1ea]">RACE/CONTROL</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="lp-nav-link">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a href={DASHBOARD_HASH} className="lp-mono text-[12px] font-bold tracking-[0.14em] text-[#f4f1ea]">
            OPEN DASHBOARD <span aria-hidden className="text-[#ff5a4d]">↗</span>
          </a>
          <button
            className="p-2 text-[#a39e93] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-[rgba(244,241,234,0.08)] px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)} className="lp-nav-link block py-2.5">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
