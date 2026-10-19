import { useEffect, useRef, useState } from "react";
import { animate, createMotionPath, createDrawable } from "animejs";
import { DASHBOARD_HASH } from "../route";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { CIRCUIT_A, samplePath } from "../lib/tracks";
import { TopDownCar } from "./CarMark";

/** READY TO RACE? — the line draws itself around the words, the car launches,
 *  crosses the finish, and the CTA appears. Hovering the CTA runs another lap. */
export default function FinalRace() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const [ready, setReady] = useState(() => prefersReducedMotion());
  const carAnimRef = useRef<{ pause: () => void; play: () => void; restart: () => void; revert?: () => void } | null>(null);
  const jobsRef = useRef<{ pause: () => void; play: () => void }[]>([]);

  useEffect(() => {
    const root = sectionRef.current;
    const path = pathRef.current;
    const car = carRef.current;
    if (!root || !path || !car) return;
    if (prefersReducedMotion()) {
      // finished static composition: drawn line, parked car, visible CTA
      try {
        path.style.strokeDasharray = "none";
        const s = samplePath(path, 0.55);
        car.setAttribute("transform", `translate(${s.x} ${s.y}) rotate(${s.angle})`);
      } catch { /* noop */ }
      return;
    }

    let draw: { pause?: () => void; revert?: () => void } | null = null;
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        try {
          draw = animate(createDrawable(path as never) as never, {
            draw: ["0 0", "0 1"],
            duration: 2200,
            ease: "inOutExpo",
            onComplete: launch,
          } as never) as unknown as { pause?: () => void; revert?: () => void };
        } catch {
          launch();
        }
      }
    }, { threshold: 0.35 });
    io.observe(root);

    function launch() {
      try {
        const a = animate(car as never, {
          ...(createMotionPath(path as never) as object),
          duration: 5200,
          ease: "inOutQuad",
          onComplete: () => setReady(true),
        } as never) as unknown as { pause: () => void; play: () => void; restart: () => void; revert?: () => void };
        carAnimRef.current = a;
        jobsRef.current = [a];
      } catch {
        setReady(true);
      }
    }

    return () => {
      io.disconnect();
      try { draw?.pause?.(); } catch { /* noop */ }
      try { carAnimRef.current?.pause(); } catch { /* noop */ }
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

  const replay = () => {
    if (prefersReducedMotion()) return;
    try {
      carAnimRef.current?.restart();
    } catch { /* noop */ }
  };

  return (
    <section ref={sectionRef} aria-labelledby="final-title" className="relative overflow-hidden py-32 md:py-48">
      <div className="lp-noise absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1600px] px-4 text-center md:px-8">
        <p className="lp-tech">final experiment · 11 / 11</p>
        <h2 id="final-title" className="lp-display lp-giant mx-auto mt-6 max-w-6xl font-bold uppercase text-[#f4f1ea]">
          Ready<br />to race?
        </h2>

        <div className="relative mx-auto mt-4 max-w-[1100px]">
          <svg viewBox="0 0 1180 500" className="block w-full" role="img" aria-label="Circuit drawing itself around the finale while a car launches onto it">
            <path d={CIRCUIT_A} fill="none" stroke="rgba(244,241,234,0.07)" strokeWidth="24" strokeLinecap="round" aria-hidden />
            <path ref={pathRef} d={CIRCUIT_A} fill="none" stroke="#e8e2d6" strokeWidth="2.5" pathLength={1} strokeDasharray="0 1" />
            {/* finish strip */}
            <g aria-hidden>
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 6 }).map((_, c) => (
                  <rect key={`${r}${c}`} x={478 + c * 9} y={168 + r * 9} width="9" height="9" fill={(r + c) % 2 ? "#0d0c0b" : "#f4f1ea"} opacity="0.9" />
                ))
              )}
              <text x={505} y={156} textAnchor="middle" fill="#6e6a61" fontSize="12" fontFamily="JetBrains Mono, monospace" letterSpacing="4">FINISH</text>
            </g>
            <g ref={carRef} transform="translate(-200 -200)" aria-hidden>
              <g transform="scale(1.2) rotate(90)">
                <TopDownCar accent="#ff2e1f" />
              </g>
            </g>
          </svg>
        </div>

        <div data-final-cta className="transition-all delay-100 duration-700" style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(22px)" }}>
          <a
            href={DASHBOARD_HASH}
            className="lp-cta mx-auto !text-[17px]"
            onMouseEnter={replay}
            onFocus={replay}
          >
            ENTER DASHBOARD <span className="lp-cta-arrow" aria-hidden>→</span>
          </a>
          <p className="lp-tech mt-4">hover to run another lap</p>
        </div>
      </div>
      <div className="lp-chequer mx-auto mt-20 h-8 w-[min(680px,88vw)] opacity-30 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]" aria-hidden />
    </section>
  );
}
