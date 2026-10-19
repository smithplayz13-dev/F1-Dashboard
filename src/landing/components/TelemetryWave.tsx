import { useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { samplePath } from "../lib/tracks";
import { TopDownCar } from "./CarMark";

const LAP_MS = 12000;
const SPEED = [12, 22, 41, 63, 84, 97, 100, 96, 78, 52, 34, 28, 36, 58, 82, 99, 100, 92, 70, 44, 30, 26, 40, 66, 90, 100, 97, 80, 55, 36, 24, 30, 52, 74, 92, 100];
const THR = [100, 100, 100, 100, 100, 100, 92, 40, 0, 0, 15, 60, 100, 100, 100, 100, 100, 70, 10, 0, 0, 45, 100, 100, 100, 100, 95, 50, 5, 0, 20, 80, 100, 100, 100, 100];
const GEARS = [3, 4, 5, 6, 7, 8, 8, 6, 4, 3, 3, 4, 5, 6, 7, 8, 8, 7, 5, 4, 3, 4, 5, 6, 7, 8, 8, 6, 4, 3, 3, 4, 5, 6, 7, 8];
const CORNERS = [
  { id: "T1", t: 0.06 }, { id: "T3", t: 0.27 }, { id: "T6", t: 0.47 }, { id: "T10", t: 0.68 }, { id: "T14", t: 0.88 },
];
const MINI = "M 20 70 C 120 70 130 20 220 20 C 310 20 300 70 390 70 C 480 70 490 18 580 18";

function trace(values: number[], w: number, y0: number, amp: number) {
  const step = w / (values.length - 1);
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(y0 - (v / 100) * amp).toFixed(1)}`).join(" ");
}

/** READ THE LAP — one looping timeline drives playhead, readouts, corner flags and a mini-track car. */
export default function TelemetryWave() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const playRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const miniPathRef = useRef<SVGPathElement>(null);
  const miniCarRef = useRef<SVGGElement>(null);
  const cornerRefs = useRef<(SVGTextElement | null)[]>([]);
  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const rpmRef = useRef<HTMLSpanElement>(null);
  const thrRef = useRef<HTMLSpanElement>(null);
  const brkBadgeRef = useRef<HTMLSpanElement>(null);
  const jobsRef = useRef<{ pause: () => void; play: () => void }[]>([]);
  const [hoverT, setHoverT] = useState<number | null>(null);

  const W = 1200;

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const render = (t: number) => {
      const idx = Math.min(SPEED.length - 1, Math.floor(t * SPEED.length));
      const speed = Math.round(88 + SPEED[idx] * 2.44);
      const braking = THR[idx] < 20;
      const rpm = Math.round(9800 + (GEARS[idx] / 8) * 1900 + (SPEED[idx] / 100) * 900);
      if (playRef.current) playRef.current.setAttribute("x1", `${t * W}`);
      if (playRef.current) playRef.current.setAttribute("x2", `${t * W}`);
      if (dotRef.current) dotRef.current.setAttribute("cx", `${t * W}`);
      if (speedRef.current) speedRef.current.textContent = `${speed}`;
      if (gearRef.current) gearRef.current.textContent = `${GEARS[idx]}`;
      if (rpmRef.current) rpmRef.current.textContent = rpm.toLocaleString("en-US");
      if (thrRef.current) thrRef.current.textContent = `${THR[idx]}%`;
      if (brkBadgeRef.current) {
        brkBadgeRef.current.style.opacity = braking ? "1" : "0.2";
        brkBadgeRef.current.style.background = braking ? "#ff2e1f" : "transparent";
      }
      cornerRefs.current.forEach((c, i) => {
        if (!c) return;
        const hot = Math.abs(t - CORNERS[i].t) < 0.03;
        c.style.fill = hot ? "#f4f1ea" : "#6e6a61";
        c.style.fontWeight = hot ? "700" : "400";
      });
      const mp = miniPathRef.current;
      const mc = miniCarRef.current;
      if (mp && mc) {
        const s = samplePath(mp, t);
        mc.setAttribute("transform", `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle.toFixed(1)})`);
      }
    };

    if (prefersReducedMotion()) {
      render(0.42);
      return;
    }
    render(0.001);

    const state = { t: 0.001 };
    let tl: { pause: () => void; play: () => void } | null = null;
    try {
      // the timeline itself loops; the child is one 12s playhead pass
      tl = createTimeline({ loop: true, defaults: { ease: "linear" } }) as unknown as {
        add: (t: unknown, p: unknown) => unknown;
        pause: () => void;
        play: () => void;
      } as unknown as { pause: () => void; play: () => void };
      (tl as unknown as { add: (t: unknown, p: unknown) => void }).add(state as never, {
        t: [0.001, 1],
        duration: LAP_MS,
        onUpdate: () => render(state.t),
      } as never);
      jobsRef.current = [tl];
    } catch { /* static frame placed */ }

    return () => {
      try { tl?.pause(); } catch { /* noop */ }
      jobsRef.current = [];
    };
  }, []);

  useEffect(() => lpOnVisible(sectionRef.current, (v) => {
    for (const j of jobsRef.current) {
      try {
        if (v) j.play();
        else j.pause();
      } catch { /* noop */ }
    }
  }, 0.02), []);

  const lanes = [
    { label: "SPEED", color: "#41d9f5", d: trace(SPEED, W, 108, 92), y: 118 },
    { label: "THROTTLE", color: "#2be37c", d: trace(THR, W, 208, 62), y: 218 },
    { label: "BRAKE", color: "#ff2e1f", d: trace(THR.map((v) => 100 - v), W, 298, 52), y: 308 },
    { label: "RPM", color: "#b06bff", d: trace(SPEED.map((v) => 30 + v * 0.7), W, 388, 52), y: 398 },
  ];

  return (
    <section ref={sectionRef} id="telemetry" aria-labelledby="tw-title" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="05"
          title={<span id="tw-title">Read the lap.</span>}
          lede="Four channels, one playhead. Speed, throttle, brake and RPM stay locked together while corner flags light up and a car rides the mini-track below."
          codeTitle="playhead.js"
          code={<><span className="lp-tok-fn">createTimeline</span>()<br />{"  "}.<span className="lp-tok-fn">add</span>(playhead, {"{"} x: <span className="lp-tok-num">1200</span> {"}"});</>}
        />

        <div className="mt-8 grid gap-6 border-t border-[rgba(244,241,234,0.1)] pt-6 md:grid-cols-[auto_1fr_auto] md:items-end">
          <div className="flex gap-8">
            <div>
              <div className="lp-tech">speed</div>
              <div className="lp-display text-5xl font-bold text-[#f4f1ea] md:text-6xl"><span ref={speedRef}>117</span></div>
            </div>
            <div>
              <div className="lp-tech">gear</div>
              <div className="lp-display text-5xl font-bold text-[#f4f1ea] md:text-6xl"><span ref={gearRef}>3</span></div>
            </div>
          </div>
          <div className="lp-mono hidden text-[11px] tracking-[0.2em] text-[#6e6a61] md:block" aria-hidden>
            HOVER THE WAVE FOR THE EXACT SAMPLE
          </div>
          <div className="flex items-center gap-4">
            <span className="lp-mono text-sm text-[#a39e93]"><span ref={rpmRef}>10,420</span> RPM</span>
            <span className="lp-mono text-sm text-[#2be37c]">THR <span ref={thrRef}>100%</span></span>
            <span ref={brkBadgeRef} className="lp-mono border border-[#ff2e1f] px-2 py-0.5 text-[11px] font-bold tracking-[0.18em] text-white" style={{ opacity: 0.2 }}>BRAKE</span>
          </div>
        </div>

        <div className="relative mt-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} 420`}
            className="block w-full cursor-crosshair"
            role="img"
            aria-label="Telemetry waveform with moving playhead"
            onMouseMove={(e) => {
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              setHoverT(Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1));
            }}
            onMouseLeave={() => setHoverT(null)}
          >
            {lanes.map((l) => (
              <g key={l.label} aria-hidden>
                <text x="0" y={l.y - 78} fill="#6e6a61" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="3">{l.label}</text>
                <path d={l.d} fill="none" stroke={l.color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 5px ${l.color}55)` }} />
              </g>
            ))}
            {CORNERS.map((c, i) => (
              <text
                key={c.id}
                ref={(el) => { cornerRefs.current[i] = el; }}
                x={c.t * W}
                y="18"
                textAnchor="middle"
                fill="#6e6a61"
                fontSize="13"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="2"
                aria-hidden
              >
                {c.id}
              </text>
            ))}
            <line ref={playRef} x1="0" x2="0" y1="24" y2="412" stroke="#f4f1ea" strokeWidth="1.2" opacity="0.85" />
            <circle ref={dotRef} cx="0" cy="60" r="5" fill="#f4f1ea" />
            {hoverT != null && (
              <line x1={hoverT * W} x2={hoverT * W} y1="24" y2="412" stroke="#41d9f5" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
            )}
          </svg>
        </div>

        {/* mini track synced to the same progress */}
        <div className="mt-2 border-t border-[rgba(244,241,234,0.1)] pt-4">
          <svg viewBox="0 0 600 90" className="block w-full" role="img" aria-label="Mini track with car synced to the playhead">
            <path d={MINI} fill="none" stroke="rgba(244,241,234,0.14)" strokeWidth="10" strokeLinecap="round" />
            <path ref={miniPathRef} d={MINI} fill="none" stroke="transparent" strokeWidth="10" />
            <g ref={miniCarRef} transform="translate(-100 -100)" aria-hidden>
              <g transform="scale(0.55) rotate(90)">
                <TopDownCar />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
