import { memo, useEffect, useRef } from "react";
import type { TimingRowData } from "../types";
import { formatLapTime } from "../utils/format";
import { COMPOUND_COLOR, COMPOUND_LABEL } from "../utils/colors";
import { animate } from "animejs";

function TyreBadge({ compound, age }: { compound: string; age?: number | null }) {
  const color = (COMPOUND_COLOR as any)[compound] ?? "#6b7280";
  const label = (COMPOUND_LABEL as any)[compound] ?? compound;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        style={{ background: color }}
      />
      <span className="font-mono text-[11px] font-bold tracking-[0.14em]" style={{ color }}>
        {label}
      </span>
      {age != null && Number.isFinite(age) && (
        <span className="font-mono text-[10px] text-zinc-500 tabular-nums">·{age}</span>
      )}
    </span>
  );
}

const TimingRow = memo(function TimingRow({
  row,
  selected,
  onSelect,
  isFastest,
}: {
  row: TimingRowData;
  selected: boolean;
  onSelect: () => void;
  isFastest: boolean;
}) {
  const posChange = row.positionChange;
  const changeLabel = posChange === 0 ? "—" : posChange > 0 ? `▲ ${posChange}` : `▼ ${Math.abs(posChange)}`;
  const ref = useRef<HTMLDivElement>(null);
  const prevPos = useRef(row.position);

  // anime.js position-change flash — answers the action (motion shows what changed)
  useEffect(() => {
    const el = ref.current;
    if (!el || prevPos.current === row.position) {
      prevPos.current = row.position;
      return;
    }
    const up = row.position < prevPos.current;
    prevPos.current = row.position;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    try {
    animate(el as any, {
      backgroundColor: up ? ["rgba(16,185,129,0.22)", "rgba(0,0,0,0)"] : ["rgba(239,68,68,0.22)", "rgba(0,0,0,0)"],
      translateX: [up ? -6 : 6, 0],
      duration: 700,
      ease: "outExpo",
      overwrite: true,
    });
    } catch { /* decorative only */ }
  }, [row.position]);

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`trow group relative grid grid-cols-[28px_46px_1fr_72px_86px_86px_86px] xl:grid-cols-[36px_52px_1fr_90px_96px_96px_110px] items-center gap-1 px-2 py-[8px] border-b border-white/[0.04] hover:bg-white/[0.05] cursor-pointer text-xs rounded-r-lg ${
        selected ? "bg-white/[0.07]" : ""
      } ${isFastest ? "bg-[#e10600]/[0.07]" : ""}`}
      style={{ borderLeft: `2px solid ${selected ? row.driver.teamColor : "transparent"}` }}
    >
      <div
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
        style={{ background: row.driver.teamColor, boxShadow: `0 0 12px ${row.driver.teamColor}66` }}
      />

      <div className="font-display font-bold text-[15px] text-white pl-2 tabular-nums">
        {row.position === 99 ? "—" : row.position}
      </div>

      <div
        className={`font-mono text-[11px] font-bold w-10 text-center rounded-md py-0.5 border ${
          posChange > 0
            ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/20"
            : posChange < 0
              ? "bg-red-500/15 text-red-300 border-red-500/20"
              : "bg-white/[0.04] text-zinc-600 border-white/5"
        }`}
      >
        {changeLabel}
      </div>

      <div className="min-w-0 flex items-center gap-2">
        <span className="font-display font-bold text-[13px] tracking-wide text-white truncate">
          {row.driver.abbreviation}
        </span>
        <span className="hidden xl:inline text-[11px] text-zinc-500 truncate">{row.driver.teamName}</span>
        {row.drs === 1 && (
          <span className="hidden sm:inline-flex text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
            DRS
          </span>
        )}
      </div>

      <div className="font-mono text-xs text-zinc-200 text-right pr-2 tabular-nums">
        {row.gapToLeader && row.gapToLeader !== "—"
          ? row.position === 1
            ? "LEADER"
            : row.gapToLeader
          : row.interval && row.interval !== "—"
            ? row.interval
            : "—"}
      </div>

      <div className={`font-mono text-xs text-right pr-2 tabular-nums ${isFastest ? "text-[#ff6b6b] font-bold" : "text-zinc-300"}`}>
        {formatLapTime(row.lastLap?.lapDuration)}
        {isFastest && (
          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-md bg-[#e10600] text-white align-middle font-bold tracking-wider shadow-[0_0_12px_rgba(225,6,0,0.6)]">
            FAST
          </span>
        )}
      </div>

      <div className="font-mono text-xs text-zinc-400 text-right pr-2 hidden sm:block tabular-nums">
        {formatLapTime(row.bestLap?.lapDuration)}
      </div>

      <div className="text-right pr-1">
        <TyreBadge compound={row.compound} age={row.tyreAge} />
      </div>

      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
        <div className="glass-pill rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap text-xs font-mono">
          <div className="font-bold text-white">{row.driver.fullName}</div>
          <div className="text-zinc-400">
            {row.driver.teamName} · P{row.position === 99 ? "—" : row.position} · {row.gapToLeader ?? row.interval ?? "—"}
          </div>
          <div className="text-zinc-500">
            Last {formatLapTime(row.lastLap?.lapDuration)} · Best {formatLapTime(row.bestLap?.lapDuration)}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TimingRow;
