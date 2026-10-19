import { useEffect, useRef } from "react";
import { onScroll } from "animejs";
import { prefersReducedMotion } from "../lib/landingAnime";
import { SCROLL_TRACK } from "../lib/tracks";
import { TopDownCar } from "./CarMark";

const CARS = [
  { code: "VER", color: "#41d9f5", off: 0 },
  { code: "NOR", color: "#ff8000", off: 0.03 },
  { code: "LEC", color: "#ff5a4d", off: 0.07 },
  { code: "PIA", color: "#ff8000", off: 0.12 },
  { code: "RUS", color: "#2be37c", off: 0.18 },
];

function tireFor(lap: number): { short: string; color: string; name: string } {
  if (lap < 19) return { short: "M", color: "#f5c518", name: "MEDIUM" };
  if (lap < 43) return { short: "H", color: "#e8e2d6", name: "HARD" };
  return { short: "S", color: "#ff5a4d", name: "SOFT" };
}

/** Scroll = race progression. Scrub LAP 1 → 57; everything derives from one progress value.
 *  Fully reversible — scrolling up rewinds the race. */
export default function ScrollRace() {
  const outerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const carRefs = useRef<(SVGGElement | null)[]>([]);
  const lapRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const leaderRef = useRef<HTMLSpanElement>(null);
  const gapRef = useRef<HTMLSpanElement>(null);
  const tireRef = useRef<HTMLSpanElement>(null);
  const tireBarRef = useRef<HTMLDivElement>(null);
  const pitRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    // Path length is in SVG user units — constant for a static d. Measuring it
    // once (instead of 5× getTotalLength per scroll event) removes the jank.
    let pathLen = 0;
    try {
      pathLen = pathRef.current?.getTotalLength() ?? 0;
    } catch { pathLen = 0; }

    const render = (p: number) => {
      const lap = Math.min(57, 1 + Math.floor(p * 57));
      const tire = tireFor(lap);
      const inPitWindow = (lap >= 17 && lap <= 21) || (lap >= 41 && lap <= 45);
      const phase = lap <= 1 ? "FORMATION" : inPitWindow ? "PIT WINDOW" : lap >= 55 ? "FINAL LAPS" : "RACING";
      const leadSwap = lap >= 27;
      if (lapRef.current) lapRef.current.textContent = `${lap}`;
      if (phaseRef.current) {
        phaseRef.current.textContent = phase;
        phaseRef.current.style.color = phase === "PIT WINDOW" ? "#f5c518" : phase === "FINAL LAPS" ? "#ff5a4d" : "#2be37c";
      }
      if (leaderRef.current) leaderRef.current.textContent = leadSwap ? "NOR" : "VER";
      if (gapRef.current) gapRef.current.textContent = `+${(1.842 - p * 1.9).toFixed(3)}`;
      if (tireRef.current) {
        tireRef.current.textContent = `${tire.short} · ${tire.name}`;
        tireRef.current.style.color = tire.color;
        tireRef.current.style.borderColor = `${tire.color}55`;
      }
      if (tireBarRef.current) tireBarRef.current.style.width = `${Math.max(4, 100 - ((lap % 19) / 19) * 100)}%`;
      if (pitRef.current) pitRef.current.style.opacity = inPitWindow ? "1" : "0.15";
      if (progRef.current) progRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      // cars ride the mini circuit at lap-derived offsets (cached length, one pass)
      const path = pathRef.current;
      if (path && pathLen > 0) {
        try {
          for (let i = 0; i < CARS.length; i++) {
            const g = carRefs.current[i];
            if (!g) continue;
            const t = (p * 2.2 + CARS[i].off) % 1;
            const p0 = path.getPointAtLength(t * pathLen);
            const p1 = path.getPointAtLength(Math.min(t + 0.004, 1) * pathLen);
            const ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
            g.setAttribute("transform", `translate(${p0.x.toFixed(1)} ${p0.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
          }
        } catch { /* dots stay */ }
      }
    };

    if (prefersReducedMotion()) {
      render(0.72);
      return;
    }

    // Both scroll drivers coalesce into a single render per animation frame —
    // scroll bursts can no longer queue up geometry work.
    let latest = 0;
    let rafId = 0;
    const requestRender = (p: number) => {
      latest = p;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        render(latest);
      });
    };

    render(0);
    const cleanups: (() => void)[] = [];
    try {
      const obs = onScroll({
        target: outer,
        onUpdate: (self: any) => {
          const p = Math.min(Math.max(typeof self?.progress === "number" ? self.progress : 0, 0), 1);
          requestRender(p);
        },
      } as never) as unknown as { revert?: () => void };
      cleanups.push(() => {
        try { obs?.revert?.(); } catch { /* noop */ }
      });
    } catch { /* native driver below covers it */ }
    const onScrollNative = () => {
      const r = outer.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      requestRender(Math.min(Math.max(-r.top / Math.max(total, 1), 0), 1));
    };
    onScrollNative();
    window.addEventListener("scroll", onScrollNative, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScrollNative));
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      for (const c of cleanups) {
        try { c(); } catch { /* noop */ }
      }
    };
  }, []);

  return (
    <div ref={outerRef} id="strategy" className="relative" style={{ height: "340vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8">
          <p className="lp-tech">scroll to scrub the race · fully reversible</p>
          <div className="mt-4 grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
            <div>
              <div className="lp-tech">lap</div>
              <div className="lp-display font-bold text-[#f4f1ea]" style={{ fontSize: "clamp(6rem, 16vw, 15rem)", lineHeight: 0.9 }}>
                <span ref={lapRef}>1</span>
              </div>
              <div className="lp-mono mt-2 text-sm tracking-[0.2em] text-[#6e6a61]">/ 57 · <span ref={phaseRef} className="font-bold text-[#2be37c]">RACING</span></div>
              <div ref={progRef} className="mt-4 h-[3px] w-56 origin-left rounded-full bg-[#ff2e1f] md:w-72" style={{ transform: "scaleX(0)" }} aria-hidden />
            </div>

            <div className="relative">
              <svg viewBox="0 0 960 280" className="block w-full" role="img" aria-label="Mini circuit with five cars advancing as you scroll">
                <path d={SCROLL_TRACK} fill="none" stroke="rgba(244,241,234,0.12)" strokeWidth="14" strokeLinecap="round" />
                <path ref={pathRef} d={SCROLL_TRACK} fill="none" stroke="transparent" strokeWidth="14" />
                <path d={SCROLL_TRACK} fill="none" stroke="rgba(244,241,234,0.3)" strokeWidth="1.4" strokeDasharray="8 10" />
                {CARS.map((c, i) => (
                  <g key={c.code} ref={(el) => { carRefs.current[i] = el; }} transform="translate(-100 -100)" aria-hidden>
                    <g transform="scale(0.62) rotate(90)">
                      <TopDownCar color={c.color} accent={c.color} />
                    </g>
                    <text y="-24" textAnchor="middle" fill={c.color} fontSize="13" fontWeight="700" fontFamily="JetBrains Mono, monospace">{c.code}</text>
                  </g>
                ))}
              </svg>
              <div ref={pitRef} className="lp-mono absolute right-[8%] top-0 border border-[#f5c518] px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] text-[#f5c518]" style={{ opacity: 0.15 }} aria-hidden>
                ◉ PIT CREW READY
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-8 lg:grid-cols-1 lg:gap-5">
              <div>
                <dt className="lp-tech">leader</dt>
                <dd className="lp-display mt-1 text-4xl font-bold text-[#f4f1ea]"><span ref={leaderRef}>VER</span></dd>
                <dd className="lp-mono mt-1 text-sm text-[#a39e93]">gap <span ref={gapRef}>+1.842</span></dd>
              </div>
              <div>
                <dt className="lp-tech">compound</dt>
                <dd className="mt-2">
                  <span ref={tireRef} className="lp-mono inline-block border px-3 py-1 text-sm font-bold tracking-[0.14em]" style={{ color: "#f5c518", borderColor: "#f5c51855" }}>M · MEDIUM</span>
                </dd>
                <dd className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-[rgba(244,241,234,0.1)]" aria-hidden>
                  <div ref={tireBarRef} className="h-full rounded-full bg-[#f5c518]" style={{ width: "100%" }} />
                </dd>
              </div>
              <div className="lp-mono hidden text-[11px] leading-loose tracking-[0.14em] text-[#6e6a61] lg:block" aria-hidden>
                L19 · HARD<br />L43 · SOFT<br />UNDER­CUT ARMED
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
