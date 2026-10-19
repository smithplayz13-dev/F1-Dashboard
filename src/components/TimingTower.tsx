import { useEffect, useRef } from "react";
import TimingRow from "./TimingRow";
import SkewTitle from "./SkewTitle";
import { entrance } from "../lib/anime";
import type { TimingRowData } from "../types";

export default function TimingTower({
  rows,
  selected,
  onSelect,
  isLive,
}: {
  rows: TimingRowData[];
  selected: number | null;
  onSelect: (n: number) => void;
  isLive?: boolean;
}) {
  const fastest = (() => {
    const valid = rows
      .filter((r) => r.bestLap?.lapDuration != null && r.bestLap.lapDuration > 0 && !r.bestLap.isPitOutLap)
      .map((r) => r.bestLap!.lapDuration!);
    if (!valid.length) return null;
    return Math.min(...valid);
  })();

  const listRef = useRef<HTMLDivElement>(null);
  const filledOnce = useRef(false);

  // staggered row entrance — first fill only, never re-hides rows
  useEffect(() => {
    if (!listRef.current || !rows.length || filledOnce.current) return;
    filledOnce.current = true;
    entrance(Array.from(listRef.current.children), 120);
  }, [rows.length]);

  return (
    <div className="panel panel-hover rounded-2xl overflow-hidden flex flex-col" data-scroll>
      <div className={`px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] ${isLive ? "speedline" : ""}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-[#e10600] animate-pulse shadow-[0_0_10px_rgba(225,6,0,0.9)]" : "bg-zinc-600"}`} />
          <SkewTitle text="TIMING TOWER" className="text-[12px] font-mono font-bold tracking-[0.24em] text-zinc-200" />
          <span className="text-[11px] font-mono text-zinc-500 tabular-nums">· {rows.length}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono tracking-[0.18em] text-zinc-500">
          <span>GAP</span>
          <span>LAST</span>
          <span>BEST</span>
          <span>TYRE</span>
        </div>
      </div>

      <div className="grid grid-cols-[28px_46px_1fr_72px_86px_86px_86px] xl:grid-cols-[36px_52px_1fr_90px_96px_96px_110px] gap-1 px-2 py-2 bg-black/40 border-b border-white/[0.06] text-[10px] font-mono tracking-[0.2em] text-zinc-600">
        <span className="pl-2">POS</span>
        <span className="text-center">Δ</span>
        <span>DRIVER</span>
        <span className="text-right pr-2">GAP</span>
        <span className="text-right pr-2">LAST</span>
        <span className="text-right pr-2 hidden sm:block">BEST</span>
        <span className="text-right pr-1">TYRE</span>
      </div>

      <div ref={listRef} className="overflow-auto max-h-[520px] lg:max-h-[560px]">
        {rows.map((r) => (
          <TimingRow
            key={r.driver.driverNumber}
            row={r}
            selected={selected === r.driver.driverNumber}
            onSelect={() => onSelect(r.driver.driverNumber)}
            isFastest={
              fastest != null &&
              r.bestLap?.lapDuration != null &&
              Math.abs(r.bestLap.lapDuration - fastest) < 0.001
            }
          />
        ))}
        {!rows.length && (
          <div className="p-10 text-center text-sm font-mono text-zinc-500">
            No timing data — try another session or demo mode
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono bg-white/[0.015]">
        <span className="text-zinc-600">Team strip · Gap · Tyre age</span>
        <span className="text-zinc-500 hidden sm:inline">Select a driver for telemetry</span>
      </div>
    </div>
  );
}
