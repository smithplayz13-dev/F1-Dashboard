import type { Lap } from "../types"
import { formatLapTime } from "../utils/format"

export default function LapDelta({ driverAbbr, current, best, sectorDeltas }: {
  driverAbbr: string,
  current: Lap | null,
  best: Lap | null,
  sectorDeltas?: [number, number, number]
}) {
  const delta = current?.lapDuration && best?.lapDuration ? current.lapDuration - best.lapDuration : null
  const s = sectorDeltas ?? [0.082, -0.143, 0.021]

  return (
    <div className="panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">LAP DELTA • {driverAbbr}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-bold">VS BEST</span>
      </div>

      <div className="flex items-end gap-4">
        <div className={`font-mono font-bold text-3xl tracking-tight ${delta==null ? "text-zinc-600" : delta<0 ? "text-emerald-400" : delta>0 ? "text-red-400" : "text-zinc-300"}`}>
          {delta==null ? "—" : `${delta>0?"+":""}${delta.toFixed(3)}`}
        </div>
        <div className="text-xs font-mono text-zinc-500 mb-1">
          Last {current ? formatLapTime(current.lapDuration) : "—"} • Best {best ? formatLapTime(best.lapDuration) : "—"}
        </div>
      </div>

      {/* delta bar */}
      <div className="relative h-2 rounded-full bg-[#0a0a0b] border border-white/10 overflow-hidden mt-3">
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
        {delta!=null && (
          <div className={`absolute top-0 bottom-0 w-1.5 rounded ${delta<0?"bg-emerald-500":"bg-red-500"}`}
               style={{ left: `calc(50% + ${Math.max(-45, Math.min(45, (delta*-80)))}%)` }} />
        )}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
        <span>-0.5 FAST</span><span>0</span><span>+0.5 SLOW</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {([0,1,2] as const).map(i=> {
          const d = s[i]
          const c = Math.abs(d)<0.001 ? "text-zinc-400 border-zinc-700 bg-zinc-800" : d<0 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"
          return (
            <div key={i} className={`rounded border px-2 py-2 text-center ${c}`}>
              <div className="text-[10px] font-mono tracking-widest opacity-70">SECTOR {i+1}</div>
              <div className="font-mono font-bold text-sm">{d>0?"+":""}{d.toFixed(3)}</div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-1.5 mt-3">
        {["Current","Previous","Best","Session Best"].map((k,idx)=>(
          <button key={k} className={`flex-1 py-1 rounded text-[11px] font-mono font-bold tracking-widest border ${idx===0?"bg-white text-black border-white":"bg-transparent border-white/10 text-zinc-500"}`}>{k.toUpperCase()}</button>
        ))}
      </div>
    </div>
  )
}
