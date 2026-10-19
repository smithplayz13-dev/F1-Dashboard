import { useEffect, useRef } from "react";
import { createTimeline, stagger, createDrawable } from "animejs";
import SectionHead from "./SectionHead";
import { DASHBOARD_HASH } from "../route";
import { prefersReducedMotion } from "../lib/landingAnime";

const DOTS = 24;
const COLS = 6;

/** FROM NOISE / TO SIGNAL — scattered samples converge into dashboard rows,
 *  then the real product appears. Raw information → organized dashboard. */
export default function DashboardReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const firedRef = useRef(false);

  // deterministic scatter (seeded, no hydration jitter)
  const scatter = Array.from({ length: DOTS }, (_, i) => {
    const x = (i * 137.5) % 360 + 20;
    const y = (i * 89.3) % 240 + 30;
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    return { x, y, tx: 30 + col * 62 - x, ty: 40 + row * 62 - y };
  });

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      // finished static composition: dots aligned, frame drawn, rows visible
      try {
        root.querySelectorAll("[data-rv-dot]").forEach((el, i) => {
          (el as SVGGElement).style.transform =
            `translate(${scatter[i % scatter.length].tx}px, ${scatter[i % scatter.length].ty}px)`;
        });
        const frame = root.querySelector("[data-rv-frame]") as SVGRectElement | null;
        if (frame) frame.style.strokeDasharray = "none";
        root.querySelectorAll("[data-rv-row]").forEach((el) => ((el as SVGLineElement).style.opacity = "1"));
      } catch { /* noop */ }
      return;
    }
    let job: { pause?: () => void; revert?: () => void } | null = null;
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting || firedRef.current) continue;
        firedRef.current = true;
        io.disconnect();
        try {
          const tl = createTimeline({ defaults: { ease: "inOutExpo" } }) as unknown as {
            add: (t: unknown, p: unknown, pos?: unknown) => unknown;
            pause: () => void;
            revert?: () => void;
          };
          tl.add("[data-rv-dot]", {
            translateX: ((_el: unknown, i: number) => scatter[i % scatter.length].tx) as never,
            translateY: ((_el: unknown, i: number) => scatter[i % scatter.length].ty) as never,
            duration: 1100,
            delay: stagger(35, { from: "center" }) as never,
          }, 0);
          const frame = root.querySelector("[data-rv-frame]");
          if (frame) {
            tl.add(createDrawable(frame as never) as never, {
              draw: ["0 0", "0 1"],
              duration: 900,
            } as never, 500);
          }
          tl.add("[data-rv-row]", { opacity: [0, 1], translateX: [-14, 0], duration: 500, delay: stagger(80) }, 900);
          job = tl as unknown as { pause?: () => void; revert?: () => void };
        } catch { /* settled states are the default */ }
      }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => {
      io.disconnect();
      try { job?.pause?.(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="rv-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="10"
          title={<span id="rv-title">From noise, signal.</span>}
          lede="Every experiment on this page converges here: stray samples snap into rows, lines become a frame — and the frame is the real dashboard."
          codeTitle="reveal.js"
          code={<><span className="lp-tok-fn">createTimeline</span>()<br />{"  "}.<span className="lp-tok-fn">add</span>(<span className="lp-tok-str">'.dot'</span>, {"{"} x: rows {"}"})<br />{"  "}.<span className="lp-tok-fn">add</span>(<span className="lp-tok-str">'.frame'</span>, {"{"} draw: <span className="lp-tok-str">'0 1'</span> {"}"});</>}
        />

        <div className="mt-10 grid items-center gap-12 lg:grid-cols-[400px_1fr]">
          {/* convergence demo */}
          <svg viewBox="0 0 400 300" className="w-full" role="img" aria-label="Scattered dots converging into aligned rows inside a drawn frame">
            <rect data-rv-frame x="8" y="8" width="384" height="284" fill="none" stroke="rgba(244,241,234,0.4)" strokeWidth="1.5" pathLength={1} strokeDasharray="0 1" />
            {scatter.map((s, i) => (
              <g key={i} data-rv-dot aria-hidden>
                <circle cx={s.x} cy={s.y} r="4.5" fill={["#ff2e1f", "#41d9f5", "#b06bff", "#2be37c"][i % 4]} opacity="0.9" />
              </g>
            ))}
            {[0, 1, 2, 3].map((r) => (
              <line key={r} data-rv-row x1="24" x2="376" y1={40 + r * 62 + 22} y2={40 + r * 62 + 22} stroke="rgba(244,241,234,0.14)" strokeWidth="1" opacity="0" aria-hidden />
            ))}
          </svg>

          {/* the actual product */}
          <div>
            <h3 className="lp-display text-3xl font-bold uppercase leading-tight text-[#f4f1ea] md:text-5xl">
              All your race data.<br />One place.
            </h3>
            <div className="mt-6 overflow-hidden rounded-lg border border-[rgba(244,241,234,0.14)] bg-[#0b0a09]">
              <div className="flex items-center gap-2 border-b border-[rgba(244,241,234,0.1)] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#3a3733]" aria-hidden />
                <span className="h-2 w-2 rounded-full bg-[#3a3733]" aria-hidden />
                <span className="lp-mono ml-2 text-[10px] tracking-[0.14em] text-[#6e6a61]">racecontrol.local/dashboard</span>
                <span className="lp-mono ml-auto text-[10px] font-bold tracking-[0.18em] text-[#2be37c]">● LIVE</span>
              </div>
              <div className="grid grid-cols-5 gap-4 p-4" aria-hidden>
                <div className="col-span-5 space-y-1.5 md:col-span-3">
                  {["VER — LEADER", "NOR +1.842", "LEC +5.219", "PIA +7.084"].map((r) => (
                    <div key={r} className="lp-mono flex items-center gap-2 text-[11px] text-[#a39e93]">
                      <span className="h-3 w-1 rounded-full bg-[#ff2e1f]" />
                      {r}
                    </div>
                  ))}
                </div>
                <div className="col-span-5 md:col-span-2">
                  <svg viewBox="0 0 200 70" className="w-full">
                    <path d="M0,50 L25,46 L50,48 L75,38 L100,40 L125,30 L150,33 L175,22 L200,25" fill="none" stroke="#41d9f5" strokeWidth="2" />
                    <path d="M0,55 L25,53 L50,54 L75,47 L100,49 L125,42 L150,44 L175,36 L200,38" fill="none" stroke="#ff8000" strokeWidth="1.5" opacity="0.7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-8">
              <a href={DASHBOARD_HASH} className="lp-cta !text-[15px]">
                OPEN DASHBOARD <span className="lp-cta-arrow" aria-hidden>→</span>
              </a>
              <span className="lp-tech">no sign-up · straight to race control</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
