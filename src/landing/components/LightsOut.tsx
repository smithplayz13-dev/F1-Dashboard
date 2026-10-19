import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { SideCar } from "./CarMark";

const LIGHTS = [0, 1, 2, 3, 4];

/** LIGHTS OUT as a single looping timeline: lights → launch → speed run → reset. */
export default function LightsOut() {
  const sectionRef = useRef<HTMLElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const rpmRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLSpanElement>(null);
  const jobsRef = useRef<{ pause: () => void; play: () => void }[]>([]);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      if (outRef.current) {
        outRef.current.textContent = "LIGHTS OUT";
        outRef.current.style.color = "#2be37c";
      }
      root.querySelectorAll("[data-lo-light]").forEach((el) => {
        (el as HTMLElement).style.background = "#ff2e1f";
        (el as HTMLElement).style.opacity = "1";
      });
      if (speedRef.current) speedRef.current.textContent = "312";
      if (rpmRef.current) rpmRef.current.style.width = "88%";
      return;
    }

    const state = { v: 0 };
    let tl: { pause: () => void; play: () => void } | null = null;
    try {
      const t = createTimeline({ loop: true, defaults: { ease: "outExpo" } }) as unknown as {
        add: (target: unknown, params: unknown, pos?: unknown) => unknown;
        pause: () => void;
        play: () => void;
      };
      const paint = (color: string, glow: string) => {
        root.querySelectorAll("[data-lo-light]").forEach((el) => {
          (el as HTMLElement).style.background = color;
          (el as HTMLElement).style.boxShadow = glow;
        });
      };
      // lights on, one by one — color itself is animated so pause stays in sync
      t.add("[data-lo-light]", {
        backgroundColor: ["#1c1b19", "#ff2e1f"],
        opacity: [0.25, 1],
        scale: [0.8, 1],
        duration: 250,
        delay: stagger(380),
        ease: "outQuad",
        onBegin: () => {
          paint("#1c1b19", "inset 0 2px 6px rgba(0,0,0,0.8)");
          if (outRef.current) {
            outRef.current.textContent = "LIGHTS";
            outRef.current.style.color = "#6e6a61";
          }
        },
      }, 0);
      // hold… then all out
      t.add("[data-lo-light]", {
        opacity: [1, 1],
        duration: 700,
        onComplete: () => {
          paint("#1c1b19", "inset 0 2px 6px rgba(0,0,0,0.8)");
          if (outRef.current) {
            outRef.current.textContent = "LIGHTS OUT";
            outRef.current.style.color = "#2be37c";
          }
          try {
            animate(outRef.current as never, { scale: [0.85, 1], duration: 450, ease: "outBack(2)" as never });
          } catch { /* noop */ }
        },
      }, ">+100");
      // launch: car rips down the straight, speed + rpm chase it
      t.add("[data-lo-car]", { x: [-60, 760], duration: 1150, ease: "inQuad" }, "<");
      t.add(state as never, {
        v: [0, 312],
        duration: 1150,
        ease: "inQuad",
        onUpdate: () => {
          if (speedRef.current) speedRef.current.textContent = `${Math.round(state.v)}`;
          if (rpmRef.current) rpmRef.current.style.width = `${Math.min(96, (state.v / 340) * 100)}%`;
        },
      } as never, "<");
      // reset breath before looping
      t.add("[data-lo-car]", { opacity: [1, 0], duration: 250 }, ">-100");
      t.add("[data-lo-car]", { x: [-60], opacity: [0, 1], duration: 400 }, ">+500");
      tl = t;
      jobsRef.current = [t];
    } catch { /* static frame */ }

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
  }, 0.05), []);

  return (
    <section ref={sectionRef} aria-labelledby="lo-title" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="09"
          title={<span id="lo-title">Lights out.</span>}
          lede="A start sequence as one looping timeline — five lights, a launch, and a speed run, all choreographed on the same clock. It never blocks the page; it just runs."
          codeTitle="lights.js"
          code={<><span className="lp-tok-fn">createTimeline</span>({"{"} loop: <span className="lp-tok-kw">true</span> {"}"})<br />{"  "}.<span className="lp-tok-fn">add</span>(<span className="lp-tok-str">'.light'</span>, {"{"} delay: <span className="lp-tok-fn">stagger</span>(<span className="lp-tok-num">380</span>) {"}"})<br />{"  "}.<span className="lp-tok-fn">add</span>(<span className="lp-tok-str">'.car'</span>, {"{"} x: <span className="lp-tok-num">760</span> {"}"}, <span className="lp-tok-str">'&lt;'</span>);</>}
        />

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-3" role="img" aria-label="Five starting lights">
            {LIGHTS.map((i) => (
              <span
                key={i}
                data-lo-light
                className="block h-9 w-9 rounded-full border border-[rgba(244,241,234,0.15)]"
                style={{ background: "#1c1b19", opacity: 0.25 }}
              />
            ))}
          </div>

          <div className="relative hidden overflow-hidden lg:block" aria-hidden>
            <div className="h-px w-full bg-[rgba(244,241,234,0.12)]" />
            <div data-lo-car className="absolute top-1/2 w-[130px] -translate-y-1/2" style={{ left: 0 }}>
              <svg viewBox="0 0 150 36" className="block w-full" aria-hidden>
                <SideCar />
              </svg>
            </div>
          </div>

          <div className="flex items-baseline gap-6">
            <span ref={outRef} className="lp-mono text-sm font-bold tracking-[0.3em] text-[#6e6a61]">LIGHTS</span>
            <span className="lp-display text-6xl font-bold tabular-nums text-[#f4f1ea] md:text-7xl"><span ref={speedRef}>0</span></span>
            <span className="lp-tech">km/h</span>
          </div>
        </div>
        <div ref={rpmRef} className="mt-6 h-1 w-full origin-left rounded-full bg-gradient-to-r from-[#41d9f5] via-[#f5c518] to-[#ff2e1f]" style={{ width: "0%" }} aria-hidden />
      </div>
    </section>
  );
}
