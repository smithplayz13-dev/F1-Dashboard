import { useEffect, useRef } from "react";

/**
 * Originkit `pulse-grid` — re-imagined as a lightweight 2D canvas.
 * The full three.js version is too heavy for a 5s-poll live timing wall,
 * so this keeps the same idea (a telemetry grid that sparks red/white
 * pulses) at ~1% of the GPU cost. Sits behind the hero strip.
 */
export default function PulseGridBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const CELL = 34;
    type Spark = { x: number; y: number; t: number; hue: "red" | "white" };
    let sparks: Spark[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => {
      if (sparks.length > 26) return;
      if (Math.random() > 0.28) return;
      sparks.push({
        x: Math.floor(Math.random() * (w / CELL)) * CELL,
        y: Math.floor(Math.random() * (h / CELL)) * CELL,
        t: 0,
        hue: Math.random() > 0.72 ? "white" : "red",
      });
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += CELL) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += CELL) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      spawn();
      sparks = sparks.filter((s) => s.t < 1);
      for (const s of sparks) {
        s.t += 0.025;
        const a = Math.max(0, 1 - s.t);
        ctx.fillStyle =
          s.hue === "red" ? `rgba(225,6,0,${0.55 * a})` : `rgba(255,255,255,${0.4 * a})`;
        const grow = 1 + s.t * 2.2;
        ctx.fillRect(s.x - 1, s.y - 1, CELL * grow * 0.28, 2.5);
        ctx.fillRect(s.x - 1, s.y - 1, 2.5, CELL * grow * 0.28);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <canvas ref={ref} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#08080b]" />
    </div>
  );
}
