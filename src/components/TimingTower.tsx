import TimingRow from "./TimingRow"
import type { TimingRowData } from "../types"

export default function TimingTower({ rows, selected, onSelect }: { rows: TimingRowData[], selected: number | null, onSelect: (n:number)=>void }) {
  // fastest excludes pit laps and nulls, ties share fastest
  const fastest = (()=> {
    const valid = rows.filter(r=>r.bestLap?.lapDuration != null && r.bestLap.lapDuration>0 && !r.bestLap.isPitOutLap).map(r=>r.bestLap!.lapDuration!)
    if (!valid.length) return null
    return Math.min(...valid)
  })()

  return (
    <div className="panel rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-[#0f0f12]/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">TIMING TOWER</span>
          <span className="text-[11px] font-mono text-zinc-600">• {rows.length} DRIVERS</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono tracking-widest text-zinc-600">
          <span>GAP</span><span>LAST</span><span>BEST</span><span>TYRE</span>
        </div>
      </div>

      <div className="grid grid-cols-[28px_46px_1fr_72px_86px_86px_86px] xl:grid-cols-[36px_52px_1fr_90px_96px_96px_110px] gap-1 px-2 py-1.5 bg-[#0a0a0b] border-b border-white/5 text-[10px] font-mono tracking-widest text-zinc-600">
        <span className="pl-2">POS</span><span className="text-center">CHG</span><span>DRIVER</span><span className="text-right pr-2">GAP</span><span className="text-right pr-2">LAST</span><span className="text-right pr-2 hidden sm:block">BEST</span><span className="text-right pr-1">TYRE</span>
      </div>

      <div className="overflow-auto max-h-[520px] lg:max-h-[560px] scrollbar-thin">
        {rows.map(r=>(
          <TimingRow key={r.driver.driverNumber} row={r} selected={selected===r.driver.driverNumber} onSelect={()=>onSelect(r.driver.driverNumber)} isFastest={fastest!=null && r.bestLap?.lapDuration!=null && Math.abs(r.bestLap.lapDuration - fastest)<0.001} />
        ))}
        {!rows.length && (
          <div className="p-10 text-center text-sm font-mono text-zinc-500">No timing data — try another year/session or DEMO</div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-600">Team strip • Gap • Tyre age</span>
        <span className="text-zinc-500 hidden sm:inline">Click driver for telemetry →</span>
      </div>
    </div>
  )
}
