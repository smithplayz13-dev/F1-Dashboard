import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/landingAnime";

/** Continuity thread: a fixed rail mapping page scroll to LAP 1 → 57.
 *  The same race thread runs through every experiment. */
export default function ScrollRail() {
  const dotRef = useRef<HTMLDivElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const total = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const p = Math.min(Math.max(window.scrollY / total, 0), 1);
        if (dotRef.current) dotRef.current.style.top = `${p * 100}%`;
        if (lapRef.current) lapRef.current.textContent = `${1 + Math.floor(p * 56)}`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (prefersReducedMotion()) return null;

  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 xl:flex" aria-hidden>
      <span className="lp-mono text-[9px] tracking-[0.2em] text-[#6e6a61]">LAP</span>
      <span ref={lapRef} className="lp-mono text-sm font-bold text-[#f4f1ea]">1</span>
      <div className="relative h-44 w-px bg-[rgba(244,241,234,0.14)]">
        <div ref={dotRef} className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#ff2e1f] shadow-[0_0_10px_rgba(255,46,31,0.9)]" style={{ top: "0%" }} />
      </div>
      <span className="lp-mono text-[9px] tracking-[0.2em] text-[#6e6a61]">57</span>
    </div>
  );
}
