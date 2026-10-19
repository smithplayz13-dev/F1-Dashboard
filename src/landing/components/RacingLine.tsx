import { useEffect, useRef, useState } from "react";
import { animate, createTimeline, stagger, createMotionPath, createDrawable, createTimer } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { RACING_LINE, pointsAlong, samplePath } from "../lib/tracks";
import { SideCar } from "./CarMark";

const LAP_MS = 14000;
const CORNER_IDS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
const BRAKE_ZONES: [number, number][] = [[0.2, 0.3], [0.48, 0.56], [0.74, 0.8]];

export default function RacingLine() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [corners, setCorners] = useState<{ x: number; y: number }[]>([]);
  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const thrRef = useRef<HTMLDivElement>(null);
  const brkRef = useRef<HTMLDivElement>(null);
  const thrValRef = useRef<HTMLSpanElement>(null);
  const brkValRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<SVGTSpanElement>(null);
  const loopsRef = useRef<{ pause: () => void; play: () => void }[]>([]);

  /* corner markers from real path geometry */
  useEffect(() => {
    setCorners(pointsAlong(pathRef.current, CORNER_IDS.length, 0.06));
  }, []);

  /* draw-on choreography, then the car starts lapping */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      // finished static composition: drawn line, sectors, corners, parked car
      try {
        const draw = root.querySelector("[data-rl-draw]") as SVGPathElement | null;
        if (draw) {
          draw.style.strokeDasharray = "none";
          const s = samplePath(draw, 0.4);
          const car = root.querySelector("[data-rl-car]");
          car?.setAttribute("transform", `translate(${s.x} ${s.y}) rotate(${s.angle})`);
        }
        root.querySelectorAll("[data-rl-sector]").forEach((el) => ((el as SVGPathElement).style.opacity = "1"));
        root.querySelectorAll("[data-rl-corner]").forEach((el) => ((el as SVGGElement).style.opacity = "1"));
      } catch { /* noop */ }
      return;
    }
    const jobs: { pause?: () => void; play?: () => void; revert?: () => void }[] = [];
    const loops: { pause: () => void; play: () => void }[] = [];
    let started = false;
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting || started) continue;
        started = true;
        io.disconnect();
        try {
          const tl = createTimeline({ defaults: { ease: "inOutExpo" } }) as unknown as {
            add: (t: unknown, p: unknown, pos?: unknown) => unknown;
          };
          const drawTarget = root.querySelector("[data-rl-draw]");
          if (drawTarget) {
            tl.add(createDrawable(drawTarget as never) as never, {
              draw: ["0 0", "0 1"],
              duration: 1600,
            } as never, 0);
          }
          tl.add("[data-rl-sector]", { opacity: [0, 1], duration: 700, delay: stagger(180), ease: "outExpo" }, 900);
          tl.add("[data-rl-drs]", { opacity: [0, 0.65], duration: 600, ease: "outExpo" }, 1400);
          tl.add("[data-rl-corner]", { opacity: [0, 1], scale: [0, 1], duration: 450, delay: stagger(90), ease: "outBack(1.6)" }, 1200);
          jobs.push({
            pause: () => { try { (tl as unknown as { pause: () => void }).pause(); } catch { /* noop */ } },
            revert: () => { try { (tl as unknown as { revert?: () => void }).revert?.(); } catch { /* noop */ } },
          });
          startCar();
        } catch {
          startCar();
        }
      }
    }, { threshold: 0.3 });
    io.observe(root);

    function startCar() {
      const path = pathRef.current;
      const car = root!.querySelector("[data-rl-car]");
      if (!path || !car) return;
      try {
        loops.push(
          animate(car as never, {
            ...(createMotionPath(path as never) as object),
            duration: LAP_MS,
            loop: true,
            ease: "linear",
          } as never) as unknown as { pause: () => void; play: () => void }
        );
        let last = 0;
        const timer = createTimer({
          duration: LAP_MS,
          loop: true,
          ease: "linear",
          onUpdate: (self: any) => {
            const now = performance.now();
            if (now - last < 90) return;
            last = now;
            const t = (self.currentTime % LAP_MS) / LAP_MS;
            const braking = BRAKE_ZONES.some(([a, b]) => t >= a && t <= b);
            const wave = Math.sin(t * Math.PI * 4);
            const speed = Math.round(braking ? 148 + wave * 22 : 268 + wave * 52);
            const gear = Math.min(8, Math.max(2, Math.round((speed - 120) / 26)));
            const thr = braking ? 4 : 100;
            const brk = braking ? 96 : 0;
            if (speedRef.current) speedRef.current.textContent = `${speed}`;
            if (gearRef.current) gearRef.current.textContent = `${gear}`;
            if (thrRef.current) thrRef.current.style.width = `${thr}%`;
            if (brkRef.current) brkRef.current.style.width = `${brk}%`;
            if (thrValRef.current) thrValRef.current.textContent = `${thr}%`;
            if (brkValRef.current) brkValRef.current.textContent = `${brk}%`;
            if (trapRef.current) {
              const hot = t > 0.68 && t < 0.76;
              trapRef.current.style.color = hot ? "#41d9f5" : "#6e6a61";
            }
          },
        } as never) as unknown as { pause: () => void; play: () => void };
        loops.push(timer);
        loopsRef.current = loops;
      } catch { /* static fallback */ }
    }

    return () => {
      io.disconnect();
      for (const j of jobs) {
        try { j.pause?.(); } catch { /* noop */ }
      }
      for (const l of loops) {
        try { l.pause(); } catch { /* noop */ }
      }
    };
  }, []);

  /* reduced motion: everything drawn, car parked mid-path */
  useEffect(() => {
    if (!prefersReducedMotion()) return;
    if (speedRef.current) speedRef.current.textContent = "312";
    if (gearRef.current) gearRef.current.textContent = "8";
  }, []);

  /* pause offscreen */
  useEffect(() => lpOnVisible(sectionRef.current, (v) => {
    for (const l of loopsRef.current) {
      try {
        if (v) l.play();
        else l.pause();
      } catch { /* noop */ }
    }
  }, 0.02), []);

  return (
    <section ref={sectionRef} id="track" aria-labelledby="rl-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="02"
          title={<span id="rl-title">Follow the racing line.</span>}
          lede="One SVG path. A car that genuinely follows it — rotation locked to the tangent. Corners, sectors and DRS zones stage themselves in."
          codeTitle="motion-path.js"
          code={<><span className="lp-tok-kw">animate</span>(<span className="lp-tok-str">'.car'</span>, {"{"}<br />{"  "}...<span className="lp-tok-fn">createMotionPath</span>(<span className="lp-tok-str">'.circuit'</span>),<br />{"}"});</>}
        />

        <div className="relative mt-4">
          <svg viewBox="0 0 1210 360" className="block w-full" role="img" aria-label="Abstract circuit that draws itself while a car laps it">
            <path d={RACING_LINE} fill="none" stroke="rgba(244,241,234,0.1)" strokeWidth="16" strokeLinecap="round" />
            <path ref={pathRef} d={RACING_LINE} fill="none" stroke="transparent" strokeWidth="16" />
            <path data-rl-draw d={RACING_LINE} fill="none" stroke="#e8e2d6" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="0 1" />
            {/* sectors */}
            <path data-rl-sector d={RACING_LINE} fill="none" stroke="#b06bff" strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray="33 67" strokeDashoffset="0" opacity="0" />
            <path data-rl-sector d={RACING_LINE} fill="none" stroke="#2be37c" strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray="33 67" strokeDashoffset="-33" opacity="0" />
            <path data-rl-sector d={RACING_LINE} fill="none" stroke="#f5c518" strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray="33 67" strokeDashoffset="-66" opacity="0" />
            {/* DRS zone */}
            <path data-rl-drs d="M 828 96 C 905 96 960 96 990 96" fill="none" stroke="#ff2e1f" strokeWidth="7" strokeLinecap="round" strokeDasharray="12 9" opacity="0" />
            <text x="909" y="76" textAnchor="middle" fill="#ff8a7a" fontSize="13" fontFamily="JetBrains Mono, monospace" letterSpacing="3" aria-hidden>DRS</text>
            {/* speed trap */}
            <g aria-hidden>
              <circle cx="700" cy="200" r="5" fill="none" stroke="#41d9f5" strokeWidth="2" />
              <text x="700" y="182" textAnchor="middle" fill="#6e6a61" fontSize="12" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                TRAP <tspan ref={trapRef}>328</tspan>
              </text>
            </g>
            {/* corners appear sequentially */}
            {corners.map((c, i) => (
              <g key={CORNER_IDS[i]} data-rl-corner opacity="0" aria-hidden style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                <circle cx={c.x} cy={c.y - 30} r="11" fill="#131210" stroke="rgba(244,241,234,0.35)" strokeWidth="1" />
                <text x={c.x} y={c.y - 26} textAnchor="middle" fill="#e8e2d6" fontSize="10" fontFamily="JetBrains Mono, monospace">{CORNER_IDS[i]}</text>
              </g>
            ))}
            {/* the car */}
            <g data-rl-car transform="translate(-300 -300)" aria-hidden>
              <SideCar />
            </g>
          </svg>

          {/* telemetry strip */}
          <div className="mt-6 grid grid-cols-2 gap-8 border-t border-[rgba(244,241,234,0.1)] pt-6 md:grid-cols-4">
            <div>
              <div className="lp-tech">speed / kmh</div>
              <div className="lp-display mt-1 text-6xl font-bold text-[#f4f1ea] md:text-7xl"><span ref={speedRef}>312</span></div>
            </div>
            <div>
              <div className="lp-tech">gear</div>
              <div className="lp-display mt-1 text-6xl font-bold text-[#f4f1ea] md:text-7xl"><span ref={gearRef}>8</span></div>
            </div>
            <div>
              <div className="lp-tech">throttle · <span ref={thrValRef} className="text-[#2be37c]">100%</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(244,241,234,0.1)]" aria-hidden>
                <div ref={thrRef} className="h-full rounded-full bg-[#2be37c]" style={{ width: "100%" }} />
              </div>
              <div className="lp-tech mt-4">brake · <span ref={brkValRef} className="text-[#ff5a4d]">0%</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(244,241,234,0.1)]" aria-hidden>
                <div ref={brkRef} className="h-full rounded-full bg-[#ff2e1f]" style={{ width: "0%" }} />
              </div>
            </div>
            <div className="lp-mono hidden text-[11px] leading-loose tracking-[0.14em] text-[#6e6a61] md:block" aria-hidden>
              RACING LINE · 5.412 KM<br />8 TURNS · 2 DRS ZONES<br />SECTORS DRAWN LIVE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
