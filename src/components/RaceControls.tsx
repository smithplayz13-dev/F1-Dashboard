import { useEffect, useRef } from "react";
import { magnetic } from "../lib/anime";

export type ViewTab = "TIMING" | "TELEMETRY" | "STRATEGY";

const TABS: { id: ViewTab; hint: string }[] = [
  { id: "TIMING", hint: "Tower" },
  { id: "TELEMETRY", hint: "Traces" },
  { id: "STRATEGY", hint: "Stints" },
];

export default function RaceControls({ active, onChange }: { active: ViewTab; onChange: (v: ViewTab) => void }) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const cleanups = btnRefs.current.filter(Boolean).map((el) => magnetic(el as HTMLElement, 0.22));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl glass-pill w-fit" role="tablist" aria-label="Views">
      {TABS.map((t, i) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => { btnRefs.current[i] = el; }}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`mag-btn relative px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-[0.18em] transition-all duration-300 ${
              on
                ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.25)]"
                : "text-zinc-500 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {t.id}
            <span className={`hidden sm:inline ml-1.5 text-[10px] font-normal tracking-normal ${on ? "text-zinc-500" : "text-zinc-600"}`}>
              {t.hint}
            </span>
            {on && <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#e10600]" />}
          </button>
        );
      })}
    </div>
  );
}
