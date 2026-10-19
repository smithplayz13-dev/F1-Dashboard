import { useEffect, useRef } from "react";
import { animate, createDraggable, spring, type Draggable } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion } from "../lib/landingAnime";

const DETENTS = [0, 0.25, 0.5, 0.75, 1];
const SNAP_EASE = () => spring({ stiffness: 180, damping: 13 });

/** Draggable driver battle: grab the delta handle, fling it, feel it snap.
 *  Real Draggable + spring physics; keyboard users get an equivalent slider. */
export default function DragBattle() {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Draggable | null>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);
  const whoRef = useRef<HTMLSpanElement>(null);
  const verBarRef = useRef<HTMLDivElement>(null);
  const norBarRef = useRef<HTMLDivElement>(null);
  const verTopRef = useRef<HTMLSpanElement>(null);
  const norTopRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const handle = handleRef.current;
    if (!track || !handle) return;

    const maxX = () => Math.max(track.clientWidth - handle.clientWidth, 1);
    const snaps = () => DETENTS.map((d) => d * maxX());

    const sync = (x: number) => {
      const t = Math.min(Math.max(x / maxX(), 0), 1);
      const delta = (t - 0.5) * 0.8;
      const verAhead = delta <= 0;
      if (deltaRef.current) {
        deltaRef.current.textContent = `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`;
        deltaRef.current.style.color = verAhead ? "#2be37c" : "#ff8a7a";
      }
      if (whoRef.current) {
        whoRef.current.textContent = verAhead ? "VER AHEAD" : "NOR AHEAD";
        whoRef.current.style.color = verAhead ? "#2be37c" : "#ff8a7a";
      }
      // playful derived comparison: position shifts corner-entry vs top-speed balance
      const verEntry = Math.round(52 + (0.5 - t) * 36);
      const norTop = Math.round(322 + (t - 0.5) * 22);
      if (verBarRef.current) verBarRef.current.style.width = `${verEntry}%`;
      if (norBarRef.current) norBarRef.current.style.width = `${100 - verEntry}%`;
      if (verTopRef.current) verTopRef.current.textContent = `${Math.round(331 - (t - 0.5) * 20)} KM/H`;
      if (norTopRef.current) norTopRef.current.textContent = `${norTop} KM/H`;
      handle.setAttribute("aria-valuenow", `${Math.round(delta * 1000)}`);
    };

    if (prefersReducedMotion()) {
      handle.style.transform = `translateX(${0.5 * maxX()}px)`;
      sync(0.5 * maxX());
      return;
    }

    sync(0.5 * maxX());
    let drag: Draggable | null = null;
    try {
      drag = createDraggable(handle as never, {
        container: track as never,
        x: { snap: snaps() } as never,
        y: false as never,
        releaseEase: SNAP_EASE() as never,
        onDrag: (self: any) => sync(self?.x ?? 0),
        onUpdate: (self: any) => sync(self?.x ?? 0),
        onSnap: () => {
          try {
            animate(handle as never, { scale: [1.25, 1], duration: 400, ease: "outBack(2)" as never });
          } catch { /* noop */ }
        },
      } as never);
      dragRef.current = drag;
    } catch {
      // fallback: handle stays centered and static
    }

    const onResize = () => {
      try { drag?.refresh(); } catch { /* noop */ }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      try { drag?.revert?.(); } catch { /* noop */ }
      dragRef.current = null;
    };
  }, []);

  /* keyboard equivalent: arrows hop between detents with a spring */
  const nudge = (dir: 1 | -1) => {
    const track = trackRef.current;
    const handle = handleRef.current;
    if (!track || !handle || prefersReducedMotion()) return;
    const cur = parseFloat((handle.style.transform.match(/translateX\(([-\d.]+)px\)/) ?? [])[1] ?? "0");
    const m = track.clientWidth - handle.clientWidth;
    const t = Math.min(Math.max(cur / Math.max(m, 1) + dir * 0.25, 0), 1);
    const snapped = Math.round(t * 4) / 4;
    try {
      const drag = dragRef.current;
      animate(handle as never, {
        x: snapped * m,
        duration: 700,
        ease: SNAP_EASE() as never,
        onUpdate: () => {
          try { drag?.update?.(); } catch { /* noop */ }
        },
      } as never);
    } catch { /* noop */ }
  };

  return (
    <section aria-labelledby="db-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="06"
          title={<span id="db-title">Grab the delta.</span>}
          lede="A real draggable with spring physics. Fling the handle, feel it snap into a detent, and watch the comparison rebalance. Fully keyboard-operable."
          codeTitle="draggable.js"
          code={<><span className="lp-tok-fn">createDraggable</span>(<span className="lp-tok-str">'.delta'</span>, {"{"}<br />{"  "}releaseEase: <span className="lp-tok-fn">spring</span>(),<br />{"}"});</>}
        />

        <div className="mt-12 select-none">
          <div className="flex items-baseline justify-between">
            <span className="lp-display text-2xl font-bold text-[#f4f1ea] md:text-4xl">VER</span>
            <span className="text-center">
              <span ref={deltaRef} className="lp-mono block text-4xl font-bold tabular-nums text-[#2be37c] md:text-6xl">-0.000</span>
              <span ref={whoRef} className="lp-mono mt-1 block text-[11px] font-bold tracking-[0.24em] text-[#2be37c]">VER AHEAD</span>
            </span>
            <span className="lp-display text-2xl font-bold text-[#f4f1ea] md:text-4xl">NOR</span>
          </div>

          <div ref={trackRef} className="relative mt-8 h-20">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[rgba(244,241,234,0.2)]" aria-hidden />
            {DETENTS.map((d) => (
              <span key={d} className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-[rgba(244,241,234,0.35)]" style={{ left: `${d * 100}%` }} aria-hidden />
            ))}
            <div
              ref={handleRef}
              className="lp-handle absolute top-1/2 left-0 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#ff2e1f] bg-[#131210] shadow-[0_0_28px_rgba(255,46,31,0.45)]"
              role="slider"
              tabIndex={0}
              aria-label="Lap delta between Verstappen and Norris, in thousandths of a second"
              aria-valuemin={-400}
              aria-valuemax={400}
              aria-valuenow={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
                if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
              }}
            >
              <span className="lp-mono text-[10px] font-bold text-[#f4f1ea]">Δ</span>
            </div>
          </div>
          <p className="lp-tech mt-3">drag · fling · arrow keys work too</p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="lp-tech">corner entry · ver share</span>
                <span className="lp-mono text-sm text-[#a39e93]"><span ref={verTopRef}>331 KM/H</span> top</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(244,241,234,0.08)]">
                <div ref={verBarRef} className="h-full rounded-full bg-[#41d9f5]" style={{ width: "52%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="lp-tech">straight line · nor share</span>
                <span className="lp-mono text-sm text-[#a39e93]"><span ref={norTopRef}>322 KM/H</span> top</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(244,241,234,0.08)]">
                <div ref={norBarRef} className="ml-auto h-full rounded-full bg-[#ff8000]" style={{ width: "48%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
