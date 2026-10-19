import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import SectionHead from "./SectionHead";
import { prefersReducedMotion, lpOnVisible } from "../lib/landingAnime";
import { CIRCUIT_A, pointsAlong } from "../lib/tracks";

const COLS = 13;
const ROWS_N = 13;
const N = COLS * ROWS_N;
const SIZE = 780;
const GAP = SIZE / COLS;

type Pt = { x: number; y: number };
type Shape = { name: string; color: string; pts: Pt[] };

function buildShapes(grid: Pt[], trackSrc: Pt[]): Shape[] {
  const track: Pt[] =
    trackSrc.length === N
      ? trackSrc.map((p) => ({ x: 40 + (p.x / 1180) * 700, y: 190 + (p.y / 500) * 400 }))
      : grid.map(() => ({ x: 390, y: 390 }));
  const wave = grid.map((g, i) => {
    const col = i % COLS;
    return { x: g.x, y: 390 + Math.sin((col / (COLS - 1)) * Math.PI * 2) * 170 };
  });
  const tri: Pt[] = [{ x: 390, y: 150 }, { x: 170, y: 630 }, { x: 610, y: 630 }];
  const lens = tri.map((a, k) => {
    const b = tri[(k + 1) % 3];
    return Math.hypot(b.x - a.x, b.y - a.y);
  });
  const total = lens[0] + lens[1] + lens[2];
  const delta = grid.map((_, i) => {
    let d = (i / (N - 1)) * total;
    let k = 0;
    while (k < 2 && d > lens[k]) {
      d -= lens[k];
      k++;
    }
    const a = tri[k];
    const b = tri[(k + 1) % 3];
    const f = Math.min(d / lens[k], 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  });
  const off = (pts: Pt[]) => pts.map((p, i) => ({ x: p.x - grid[i].x, y: p.y - grid[i].y }));
  return [
    { name: "GRID", color: "#57534a", pts: grid.map(() => ({ x: 0, y: 0 })) },
    { name: "TRACK", color: "#ff2e1f", pts: off(track) },
    { name: "WAVE", color: "#41d9f5", pts: off(wave) },
    { name: "DELTA", color: "#f5c518", pts: off(delta) },
  ];
}

/** Stagger playground: 169 dots rearrange GRID → TRACK → WAVE → DELTA on a loop. */
export default function DotField() {
  const svgRef = useRef<SVGSVGElement>(null);
  const samplerRef = useRef<SVGPathElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [shapeIdx, setShapeIdx] = useState(0);
  const visibleRef = useRef(true);
  const jobRef = useRef<{ pause?: () => void } | null>(null);

  const grid = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let r = 0; r < ROWS_N; r++) {
      for (let c = 0; c < COLS; c++) {
        pts.push({ x: GAP / 2 + c * GAP, y: GAP / 2 + r * GAP });
      }
    }
    return pts;
  }, []);

  const [shapes, setShapes] = useState<Shape[]>(() => buildShapes(grid, []));
  const shapesRef = useRef(shapes);
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);
  const idxRef = useRef(0);

  /* resolve real circuit samples after mount */
  useEffect(() => {
    const pts = pointsAlong(samplerRef.current, N);
    if (pts.length === N) setShapes(buildShapes(grid, pts));
  }, [grid]);

  const goTo = useCallback((idx: number, instant = false) => {
    const all = shapesRef.current;
    const s = all[((idx % all.length) + all.length) % all.length];
    idxRef.current = all.indexOf(s);
    setShapeIdx(all.indexOf(s));
    const dots = dotRefs.current.filter(Boolean) as SVGCircleElement[];
    if (!dots.length) return;
    for (const d of dots) d.setAttribute("fill", s.color);
    if (instant || prefersReducedMotion()) {
      dots.forEach((d, i) => {
        d.style.transform = `translate(${s.pts[i].x.toFixed(1)}px, ${s.pts[i].y.toFixed(1)}px)`;
      });
      return;
    }
    try {
      try { jobRef.current?.pause?.(); } catch { /* noop */ }
      jobRef.current = animate(dots as never, {
        translateX: ((_el: unknown, i: number) => s.pts[i % s.pts.length].x) as never,
        translateY: ((_el: unknown, i: number) => s.pts[i % s.pts.length].y) as never,
        duration: 950,
        delay: stagger(9, { grid: [COLS, ROWS_N], from: "center" }) as never,
        ease: "inOutExpo" as never,
      } as never) as unknown as { pause?: () => void };
    } catch { /* dots stay */ }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // static final composition: the track
      const id = setTimeout(() => goTo(1, true), 50);
      return () => clearTimeout(id);
    }
    goTo(0, true);
    const id = setInterval(() => {
      if (visibleRef.current) goTo(idxRef.current + 1);
    }, 4200);
    return () => clearInterval(id);
  }, [goTo]);

  useEffect(() => lpOnVisible(svgRef.current, (v) => (visibleRef.current = v), 0.05), []);

  useEffect(() => () => {
    try { jobRef.current?.pause?.(); } catch { /* noop */ }
  }, []);

  return (
    <section aria-labelledby="df-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <SectionHead
          index="07"
          title={<span id="df-title">Dots become data.</span>}
          lede="169 timing samples. One stagger grid. Watch them fall into a circuit, a telemetry wave, then a delta — the same points, rearranged."
          codeTitle="dots.js"
          code={<><span className="lp-tok-fn">animate</span>(<span className="lp-tok-str">'.dot'</span>, {"{"}<br />{"  "}delay: <span className="lp-tok-fn">stagger</span>(<span className="lp-tok-num">9</span>, {"{"} grid: [<span className="lp-tok-num">13</span>, <span className="lp-tok-num">13</span>] {"}"}),<br />{"}"});</>}
        />

        <div className="mt-8 flex flex-wrap gap-6" role="group" aria-label="Choose dot formation">
          {shapes.map((s, i) => (
            <button
              key={s.name}
              onClick={() => goTo(i)}
              className={`lp-shape-btn ${shapeIdx === i ? "active" : ""}`}
              aria-pressed={shapeIdx === i}
            >
              0{i + 1} · {s.name}
            </button>
          ))}
          <span className="lp-tech ml-auto hidden self-center sm:inline">auto-cycles every 4s</span>
        </div>

        <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto mt-4 block w-full max-w-[760px]" role="img" aria-label={`Dot formation currently showing ${shapes[shapeIdx].name}`}>
          <path ref={samplerRef} d={CIRCUIT_A} fill="none" stroke="none" aria-hidden />
          {grid.map((g, i) => (
            <circle
              key={i}
              ref={(el) => { dotRefs.current[i] = el; }}
              cx={g.x}
              cy={g.y}
              r="5"
              fill="#57534a"
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
