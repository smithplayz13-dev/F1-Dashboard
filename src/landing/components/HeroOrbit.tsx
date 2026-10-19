import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, createTimeline, stagger, createMotionPath, createDrawable, createTimer } from "animejs";
import { DASHBOARD_HASH } from "../route";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { TopDownCar } from "./CarMark";

const CX = 320;
const CY = 320;
const R_ORBIT = 208;
const R_SECTOR = 252;
const R_TICK = 296;
const TICKS = 72;
const LAP_MS = 12000;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

const SECTORS = [
  { color: "#b06bff", label: "S1" },
  { color: "#2be37c", label: "S2" },
  { color: "#f5c518", label: "S3" },
];

export default function HeroOrbit() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);
  const sectorRefs = useRef<(SVGPathElement | null)[]>([]);
  const trailRef = useRef<SVGPathElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const loopsRef = useRef<{ pause: () => void; play: () => void }[]>([]);

  /* entrance choreography — layout effect so from-values land before paint */
  useLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;
    let tl: { revert?: () => void } | null = null;
    try {
      tl = createTimeline({ defaults: { ease: "outExpo" } }) as unknown as { revert?: () => void };
      const t = tl as unknown as {
        add: (targets: unknown, params: unknown, position?: unknown) => unknown;
      };
      t.add("[data-hero-line]", { opacity: [0, 1], y: [70, 0], skewX: [6, 0], duration: 1100, delay: stagger(120) }, 0);
      t.add("[data-hero-fade]", { opacity: [0, 1], y: [18, 0], duration: 800, delay: stagger(90) }, 350);
      try {
        const orbitDraw = root.querySelector("[data-orbit-draw]");
        if (orbitDraw) {
          t.add(createDrawable(orbitDraw as never) as never, { draw: ["0 0", "0 1"], duration: 1800, ease: "inOutExpo" } as never, 200);
        }
      } catch { /* orbit stays drawn */ }
      t.add("[data-orbit-tick]", { opacity: [0, 1], scale: [0, 1], duration: 500, delay: stagger(6, { from: "center" }) }, 500);
      t.add("[data-orbit-sector]", { opacity: [0, 1], duration: 800, delay: stagger(160) }, 900);
    } catch { /* visible by default */ }
    return () => {
      try { tl?.revert?.(); } catch { /* noop */ }
    };
  }, []);

  /* orbit loops: car + trail + satellites share one period so they stay in formation */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const orbit = root.querySelector("[data-orbit-path]");
    if (!orbit) return;

    const place = (t: number) => {
      const speed = Math.round(282 + Math.sin(t * Math.PI * 4) * 48);
      const gear = Math.min(8, Math.max(3, Math.round((speed - 175) / 23)));
      const sector = Math.floor(t * 3) % 3;
      const delta = -0.24 + t * 0.14 + Math.sin(t * Math.PI * 6) * 0.03;
      const ms = Math.floor(417 + Math.sin(t * Math.PI * 8) * 46);
      // trail arc follows the car: path starts at 9 o'clock, sweeps clockwise via 12
      const deg = (270 + t * 360) % 360;
      if (trailRef.current) {
        try {
          trailRef.current.setAttribute("d", arc(CX, CY, R_ORBIT, deg - 64, deg));
        } catch { /* noop */ }
      }
      if (speedRef.current) speedRef.current.textContent = `${speed}`;
      if (gearRef.current) gearRef.current.textContent = `${gear}`;
      if (lapRef.current) lapRef.current.textContent = `${43 + Math.floor(performance.now() / LAP_MS) % 15}`;
      if (timeRef.current) timeRef.current.textContent = `1:28.${String(Math.max(0, ms)).padStart(3, "0")}`;
      if (deltaRef.current) {
        deltaRef.current.textContent = `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`;
        deltaRef.current.style.color = delta <= 0 ? "#2be37c" : "#ff8a7a";
      }
      const active = Math.round((speed / 340) * TICKS);
      for (let i = 0; i < TICKS; i++) {
        const el = tickRefs.current[i];
        if (!el) continue;
        const on = i < active;
        el.style.stroke = on ? "#41d9f5" : "rgba(244,241,234,0.16)";
        el.style.opacity = on ? "1" : "0.5";
      }
      sectorRefs.current.forEach((s, i) => {
        if (!s) return;
        s.style.stroke = SECTORS[i].color;
        s.style.opacity = i === sector ? "1" : "0.28";
        s.style.strokeWidth = i === sector ? "10" : "5";
      });
    };

    if (prefersReducedMotion()) {
      const draw = root.querySelector("[data-orbit-draw]");
      try {
        (draw as SVGPathElement | null)?.style.setProperty("stroke-dasharray", "none");
      } catch { /* noop */ }
      place(0.62);
      return;
    }

    place(0.02);
    const loops: { pause: () => void; play: () => void }[] = [];
    try {
      const car = root.querySelector("[data-orbit-car]");
      const sats = Array.from(root.querySelectorAll("[data-orbit-sat]"));
      if (car) {
        loops.push(
          animate(car as never, {
            ...(createMotionPath(orbit as never) as object),
            duration: LAP_MS,
            loop: true,
            ease: "linear",
          } as never) as unknown as { pause: () => void; play: () => void }
        );
      }
      sats.forEach((s, i) => {
        loops.push(
          animate(s as never, {
            ...(createMotionPath(orbit as never, (i + 1) / (sats.length + 1)) as object),
            duration: LAP_MS,
            loop: true,
            ease: "linear",
          } as never) as unknown as { pause: () => void; play: () => void }
        );
      });
      // telemetry pulse — throttled inside: numbers refresh ~12x/sec
      let last = 0;
      const timer = createTimer({
        duration: LAP_MS,
        loop: true,
        ease: "linear",
        onUpdate: (self: any) => {
          const now = performance.now();
          if (now - last < 85) return;
          last = now;
          const t = (self.currentTime % LAP_MS) / LAP_MS;
          place(t);
        },
      } as never) as unknown as { pause: () => void; play: () => void };
      loops.push(timer);
    } catch { /* static frame already placed */ }
    loopsRef.current = loops;
    return () => {
      for (const l of loops) {
        try { l.pause(); } catch { /* noop */ }
      }
      loopsRef.current = [];
    };
  }, []);

  /* pause everything offscreen */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    return lpOnVisible(root, (v) => {
      for (const l of loopsRef.current) {
        try {
          if (v) l.play();
          else l.pause();
        } catch { /* noop */ }
      }
    }, 0.02);
  }, []);

  /* pointer parallax on the grid — a few pixels only */
  useEffect(() => {
    const root = sectionRef.current;
    const grid = gridRef.current;
    if (!root || !grid || prefersReducedMotion()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 14;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 14;
        grid.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
    };
    root.addEventListener("pointermove", onMove);
    return () => {
      root.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div ref={gridRef} className="lp-grid-bg absolute -inset-8" aria-hidden />
      <div className="lp-noise absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-16 pt-28 md:px-8 md:pt-36">
        <p data-hero-fade className="lp-tech">a motion experiment · live race data inside</p>
        <h1 id="hero-title" className="lp-display lp-giant mt-6 font-bold uppercase text-[#f4f1ea]">
          <span data-hero-line className="block">The race.</span>
          <span data-hero-line className="block text-[#57534a]">In motion.</span>
        </h1>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <p data-hero-fade className="max-w-md text-base leading-relaxed text-[#a39e93] md:text-lg">
            Live timing, telemetry, race control and strategy — in one Formula racing dashboard.
          </p>
          <div data-hero-fade className="flex items-center gap-8">
            <a href={DASHBOARD_HASH} className="lp-cta">
              OPEN DASHBOARD <span className="lp-cta-arrow" aria-hidden>→</span>
            </a>
            <span className="lp-tech hidden sm:inline">scroll · 10 experiments</span>
          </div>
        </div>

        {/* orbit experiment */}
        <div data-hero-fade className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
          <dl className="grid grid-cols-2 gap-px overflow-hidden border-y border-[rgba(244,241,234,0.1)]">
            {[
              { k: "SPEED", v: <span ref={speedRef}>312</span>, u: "KM/H" },
              { k: "GEAR", v: <span ref={gearRef}>8</span>, u: "/ 8" },
            ].map((s) => (
              <div key={s.k} className="py-5 pr-6">
                <dt className="lp-tech">{s.k}</dt>
                <dd className="lp-display mt-2 text-5xl font-bold text-[#f4f1ea] md:text-6xl">
                  {s.v} <span className="text-base font-medium text-[#6e6a61]">{s.u}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="relative mx-auto w-full max-w-[640px]">
            <svg viewBox="0 0 640 640" className="block w-full" role="img" aria-label="Circular racing visualization: a car orbits sector arcs while RPM ticks and lap delta react">
              {/* tick ring */}
              <g aria-hidden>
                {Array.from({ length: TICKS }).map((_, i) => {
                  const a = (i / TICKS) * 360;
                  const p1 = polar(CX, CY, R_TICK, a);
                  const p2 = polar(CX, CY, R_TICK - (i % 6 === 0 ? 18 : 10), a);
                  return (
                    <line
                      key={i}
                      data-orbit-tick
                      ref={(el) => { tickRefs.current[i] = el; }}
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke="rgba(244,241,234,0.16)"
                      strokeWidth={i % 6 === 0 ? 2.4 : 1.2}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    />
                  );
                })}
              </g>
              {/* sector arcs */}
              <g aria-hidden>
                {SECTORS.map((s, i) => (
                  <path
                    key={s.label}
                    data-orbit-sector
                    ref={(el) => { sectorRefs.current[i] = el; }}
                    d={arc(CX, CY, R_SECTOR, i * 120 - 4, (i + 1) * 120 + 4)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.28"
                  />
                ))}
              </g>
              {/* orbit + trail */}
              <circle cx={CX} cy={CY} r={R_ORBIT} fill="none" stroke="rgba(244,241,234,0.14)" strokeWidth="1.5" />
              <path
                data-orbit-path
                d={`M ${CX - R_ORBIT} ${CY} A ${R_ORBIT} ${R_ORBIT} 0 1 1 ${CX + R_ORBIT} ${CY} A ${R_ORBIT} ${R_ORBIT} 0 1 1 ${CX - R_ORBIT} ${CY}`}
                fill="none"
                stroke="none"
              />
              <path data-orbit-draw d={`M ${CX - R_ORBIT} ${CY} A ${R_ORBIT} ${R_ORBIT} 0 1 1 ${CX + R_ORBIT} ${CY} A ${R_ORBIT} ${R_ORBIT} 0 1 1 ${CX - R_ORBIT} ${CY}`} fill="none" stroke="rgba(244,241,234,0.35)" strokeWidth="1.5" pathLength={1} strokeDasharray="0 1" />
              <path ref={trailRef} d={arc(CX, CY, R_ORBIT, 130, 194)} fill="none" stroke="#ff2e1f" strokeWidth="4" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,46,31,0.8))" }} aria-hidden />
              {/* satellites */}
              <g data-orbit-sat aria-hidden>
                <circle r="6" fill="#ff8000" style={{ filter: "drop-shadow(0 0 8px #ff8000)" }} />
              </g>
              <g data-orbit-sat aria-hidden>
                <circle r="6" fill="#ff5a4d" style={{ filter: "drop-shadow(0 0 8px #ff5a4d)" }} />
              </g>
              {/* hero car */}
              <g data-orbit-car transform="translate(-400 -400)" aria-hidden>
                <g transform="rotate(90)">
                  <TopDownCar />
                </g>
              </g>
              {/* sector tags */}
              <g className="lp-mono" fontSize="13" letterSpacing="3" aria-hidden>
                <text x={CX} y={CY - R_SECTOR - 14} textAnchor="middle" fill="#b06bff">S1</text>
                <text x={CX + R_SECTOR + 30} y={CY + 60} textAnchor="middle" fill="#2be37c">S2</text>
                <text x={CX - R_SECTOR - 30} y={CY + 60} textAnchor="middle" fill="#f5c518">S3</text>
              </g>
            </svg>

            {/* center readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="lp-tech">lap <span ref={lapRef} className="text-[#f4f1ea]">43</span>/57</span>
              <span ref={timeRef} className="lp-display lp-mono mt-2 text-4xl font-bold text-[#f4f1ea] md:text-5xl">1:28.417</span>
              <span ref={deltaRef} className="lp-mono mt-2 text-2xl font-bold text-[#2be37c]">-0.182</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
