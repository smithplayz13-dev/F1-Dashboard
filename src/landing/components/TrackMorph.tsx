import { useEffect, useRef } from "react";
import { createTimeline, morphTo } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { CIRCUIT_A, CIRCUIT_B, CIRCUIT_C, samplePath } from "../lib/tracks";
import { TopDownCar } from "./CarMark";

const CIRCUITS = [
  { d: CIRCUIT_A, name: "VELTURA PARK", turns: 14, km: "5.412" },
  { d: CIRCUIT_B, name: "COSTA VERDE", turns: 12, km: "5.103" },
  { d: CIRCUIT_C, name: "NORDRING", turns: 16, km: "5.891" },
];
const SEG_MS = 3000; // morph 2.2s + hold 0.8s

/** One circuit morphs into another while the car stays glued to the live path. */
export default function TrackMorph() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const loopsRef = useRef<{ pause: () => void; play: () => void }[]>([]);

  useEffect(() => {
    const root = sectionRef.current;
    const path = pathRef.current;
    const car = carRef.current;
    if (!root || !path || !car) return;

    const targets = Array.from(root.querySelectorAll("[data-morph-target]")) as SVGPathElement[];

    const place = (t: number, label: string, meta: string) => {
      const s = samplePath(path, t);
      car.setAttribute("transform", `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle.toFixed(1)})`);
      if (nameRef.current) nameRef.current.textContent = label;
      if (metaRef.current) metaRef.current.textContent = meta;
    };

    if (prefersReducedMotion()) {
      try {
        path.setAttribute("d", CIRCUIT_B);
      } catch { /* noop */ }
      place(0.4, CIRCUITS[1].name, `${CIRCUITS[1].turns} TURNS · ${CIRCUITS[1].km} KM`);
      return;
    }

    place(0.02, CIRCUITS[0].name, `${CIRCUITS[0].turns} TURNS · ${CIRCUITS[0].km} KM`);
    const loops: { pause: () => void; play: () => void }[] = [];
    try {
      // morph loop: A→B→C→A, 3s per circuit (opacity holds keep timeline time)
      const tl = createTimeline({ defaults: { ease: "inOutExpo" }, loop: true }) as unknown as {
        add: (t: unknown, p: unknown) => unknown;
        pause: () => void;
        play: () => void;
      };
      const hold = { opacity: [1, 1], duration: 800, ease: "linear" };
      tl.add(path as never, { d: morphTo(targets[0] as never), duration: 2200 } as never);
      tl.add(path as never, { ...hold } as never);
      tl.add(path as never, { d: morphTo(targets[1] as never), duration: 2200 } as never);
      tl.add(path as never, { ...hold } as never);
      tl.add(path as never, { d: morphTo(targets[2] as never), duration: 2200 } as never);
      tl.add(path as never, { ...hold } as never);
      loops.push(tl);

      // car + label ride the same 9s cycle — elapsed accumulates so
      // pausing offscreen never teleports the car on resume
      let raf = 0;
      let alive = true;
      let elapsed = 0;
      let prev = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        const dt = Math.min(now - prev, 100);
        prev = now;
        elapsed += dt;
        const ci = Math.floor((elapsed % (SEG_MS * 3)) / SEG_MS) % 3;
        // car laps continuously, independent of the morph
        const t = (elapsed / 16000) % 1;
        place(t, CIRCUITS[ci].name, `${CIRCUITS[ci].turns} TURNS · ${CIRCUITS[ci].km} KM`);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      loops.push({
        pause: () => { alive = false; cancelAnimationFrame(raf); },
        play: () => {
          if (alive) return;
          alive = true;
          prev = performance.now();
          raf = requestAnimationFrame(tick);
        },
      });
    } catch { /* static frame placed */ }
    loopsRef.current = loops;
    return () => {
      for (const l of loops) {
        try { l.pause(); } catch { /* noop */ }
      }
      loopsRef.current = [];
    };
  }, []);

  useEffect(() => lpOnVisible(sectionRef.current, (v) => {
    for (const l of loopsRef.current) {
      try {
        if (v) l.play();
        else l.pause();
      } catch { /* noop */ }
    }
  }, 0.02), []);

  return (
    <section aria-labelledby="tm-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="08"
          title={<span id="tm-title">One track becomes another.</span>}
          lede="Shape morphing across three fictional Formula-grade circuits. The car never leaves the racing line — it rides the live path while it transforms."
          codeTitle="morph.js"
          code={<><span className="lp-tok-fn">animate</span>(<span className="lp-tok-str">'.track-a'</span>, {"{"}<br />{"  "}d: <span className="lp-tok-fn">morphTo</span>(<span className="lp-tok-str">'.track-b'</span>),<br />{"}"});</>}
        />

        <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <span ref={nameRef} className="lp-display text-3xl font-bold tracking-tight text-[#f4f1ea] md:text-5xl">VELTURA PARK</span>
          <span ref={metaRef} className="lp-mono text-sm tracking-[0.2em] text-[#6e6a61]">14 TURNS · 5.412 KM</span>
        </div>

        <svg viewBox="0 0 1180 500" className="mt-4 block w-full" role="img" aria-label="Circuit morphing between three layouts with a car attached">
          <path d={CIRCUIT_A} fill="none" stroke="rgba(244,241,234,0.08)" strokeWidth="26" strokeLinecap="round" aria-hidden />
          <path ref={pathRef} d={CIRCUIT_A} fill="none" stroke="#e8e2d6" strokeWidth="2.5" />
          <path d={CIRCUIT_A} fill="none" stroke="rgba(244,241,234,0.25)" strokeWidth="1" strokeDasharray="8 10" aria-hidden />
          {/* morph targets (invisible geometry) */}
          <path data-morph-target d={CIRCUIT_B} fill="none" stroke="none" aria-hidden />
          <path data-morph-target d={CIRCUIT_C} fill="none" stroke="none" aria-hidden />
          <path data-morph-target d={CIRCUIT_A} fill="none" stroke="none" aria-hidden />
          <g ref={carRef} transform="translate(-200 -200)" aria-hidden>
            <g transform="scale(1.15) rotate(90)">
              <TopDownCar accent="#ff2e1f" />
            </g>
          </g>
        </svg>
        <p className="lp-tech mt-4">morphTo · 2.2s · car samples the live path every frame</p>
      </div>
    </section>
  );
}
