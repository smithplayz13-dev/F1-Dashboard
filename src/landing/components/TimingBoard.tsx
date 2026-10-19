import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible, lpTweenNumber } from "../lib/landingAnime";

type Driver = { code: string; team: string; color: string; gap: number; tire: string; tireColor: string };

const ROWS: Driver[] = [
  { code: "VER", team: "Red Bull", color: "#41d9f5", gap: 0, tire: "M", tireColor: "#f5c518" },
  { code: "NOR", team: "McLaren", color: "#ff8000", gap: 1.842, tire: "M", tireColor: "#f5c518" },
  { code: "LEC", team: "Ferrari", color: "#ff5a4d", gap: 5.219, tire: "H", tireColor: "#e8e2d6" },
  { code: "PIA", team: "McLaren", color: "#ff8000", gap: 7.084, tire: "M", tireColor: "#f5c518" },
  { code: "RUS", team: "Mercedes", color: "#2be37c", gap: 9.312, tire: "H", tireColor: "#e8e2d6" },
  { code: "HAM", team: "Ferrari", color: "#ff5a4d", gap: 11.406, tire: "H", tireColor: "#e8e2d6" },
  { code: "ALO", team: "Aston Martin", color: "#2be37c", gap: 14.022, tire: "S", tireColor: "#ff5a4d" },
  { code: "TSU", team: "RB", color: "#41d9f5", gap: 15.891, tire: "S", tireColor: "#ff5a4d" },
];

/** Staggered timing board: rows cascade in, then P1/P2 physically trade places (FLIP)
 *  while every delta re-interpolates. A stagger demo, not a table. */
export default function TimingBoard() {
  const [order, setOrder] = useState<Driver[]>(ROWS);
  const [lap, setLap] = useState(34);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const visibleRef = useRef(false);
  const enteredRef = useRef(false);

  useEffect(() => lpOnVisible(sectionRef.current, (v) => (visibleRef.current = v), 0.05), []);

  /* cascade entrance */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root || prefersReducedMotion()) return;
    let job: { revert?: () => void } | null = null;
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting || enteredRef.current) continue;
        enteredRef.current = true;
        io.disconnect();
        try {
          job = animate("[data-tb-row]" as never, {
            opacity: [0, 1],
            translateY: [34, 0],
            skewX: [4, 0],
            duration: 700,
            delay: stagger(70) as never,
            ease: "outExpo" as never,
          } as never) as unknown as { revert?: () => void };
        } catch { /* visible by default */ }
      }
    }, { threshold: 0.25 });
    io.observe(root);
    return () => {
      io.disconnect();
      try { job?.revert?.(); } catch { /* noop */ }
    };
  }, []);

  /* the overtake loop */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      const container = listRef.current;
      if (!visibleRef.current || !enteredRef.current || !container) return;
      // measure
      const kids = Array.from(container.children);
      const first = new Map<string, number>();
      kids.forEach((k) => first.set((k as HTMLElement).dataset.code ?? "", k.getBoundingClientRect().top));
      const oldGaps = new Map<string, number>();
      kids.forEach((k) => {
        const el = k as HTMLElement;
        oldGaps.set(el.dataset.code ?? "", parseFloat(el.querySelector("[data-gap]")?.textContent?.replace("+", "") ?? "0"));
      });
      // swap leader gaps so the board stays believable
      setOrder((prev) => {
        const next = [...prev];
        const g = next[0].gap;
        next[0] = { ...next[0], gap: next[1].gap };
        next[1] = { ...next[1], gap: g };
        [next[0], next[1]] = [next[1], next[0]];
        return next;
      });
      setLap((l) => (l >= 57 ? 34 : l + 1));
      // invert + play, then re-interpolate every delta
      requestAnimationFrame(() => {
        Array.from(container.children).forEach((child) => {
          const el = child as HTMLElement;
          const code = el.dataset.code ?? "";
          const dy = (first.get(code) ?? 0) - el.getBoundingClientRect().top;
          if (Math.abs(dy) > 1) {
            try {
              animate(el as never, { translateY: [dy, 0], duration: 650, ease: "outExpo" as never });
            } catch { /* noop */ }
          }
          const gapEl = el.querySelector("[data-gap]");
          if (gapEl) {
            // data-next already holds the NEW gap from the re-render — tween old → new
            requestAnimationFrame(() => {
              const txt = (gapEl as HTMLElement).dataset.next;
              if (txt == null) return;
              if (parseFloat(txt) === 0) {
                // the new leader shows an em dash, never 0.000
                (gapEl as HTMLElement).textContent = "—";
                return;
              }
              lpTweenNumber(gapEl as HTMLElement, oldGaps.get(code) ?? 0, parseFloat(txt), {
                duration: 650,
                decimals: 3,
                prefix: "+",
              });
            });
          }
        });
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section ref={sectionRef} id="timing" aria-labelledby="tb-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="04"
          title={<span id="tb-title">Every millisecond matters.</span>}
          lede="Eight rows cascade in on a stagger — then the lead actually changes hands. Rows physically rearrange while deltas re-interpolate."
          codeTitle="stagger.js"
          code={<><span className="lp-tok-fn">animate</span>(<span className="lp-tok-str">'.row'</span>, {"{"}<br />{"  "}y: [<span className="lp-tok-num">34</span>, <span className="lp-tok-num">0</span>],<br />{"  "}delay: <span className="lp-tok-fn">stagger</span>(<span className="lp-tok-num">70</span>),<br />{"}"});</>}
        />

        <div className="mt-12 flex items-baseline justify-between border-b border-[rgba(244,241,234,0.14)] pb-4">
          <span className="lp-tech">timing tower · live demo</span>
          <span className="lp-mono text-sm tracking-[0.2em] text-[#a39e93]">LAP <span className="font-bold text-[#f4f1ea]">{lap}</span>/57</span>
        </div>
        <div ref={listRef} role="list" aria-label="Timing board demonstration">
          {order.map((d, i) => (
            <div
              key={d.code}
              data-code={d.code}
              data-tb-row
              role="listitem"
              className="grid grid-cols-[52px_1fr_auto] items-baseline gap-4 border-b border-[rgba(244,241,234,0.08)] py-3 md:grid-cols-[90px_1fr_120px_200px] md:py-4"
            >
              <span className={`lp-mono text-lg font-bold md:text-xl ${i < 2 ? "text-[#f4f1ea]" : "text-[#6e6a61]"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="h-5 w-1 shrink-0 self-center rounded-full" style={{ background: d.color }} aria-hidden />
                <span className="lp-display truncate text-2xl font-bold tracking-tight text-[#f4f1ea] md:text-4xl">{d.code}</span>
                <span className="hidden truncate text-sm text-[#6e6a61] lg:inline">{d.team}</span>
                <span className="lp-mono ml-1 hidden text-[11px] sm:inline" style={{ color: d.tireColor }}>{d.tire}</span>
                {i === 0 && (
                  <span className="lp-mono border border-[rgba(43,227,124,0.4)] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] text-[#2be37c]">LEADER</span>
                )}
              </span>
              <span className="lp-mono hidden text-right text-sm text-[#6e6a61] md:block">1:28.{400 + i * 97}</span>
              <span
                data-gap
                data-next={i === 0 ? "0" : d.gap.toFixed(3)}
                className={`lp-mono text-right text-xl font-bold tabular-nums md:text-3xl ${i === 0 ? "text-[#f4f1ea]" : "text-[#a39e93]"}`}
              >
                {i === 0 ? "—" : `+${d.gap.toFixed(3)}`}
              </span>
            </div>
          ))}
        </div>
        <p className="lp-tech mt-4">lead swaps every 6s · rows flip · deltas tween</p>
      </div>
    </section>
  );
}
