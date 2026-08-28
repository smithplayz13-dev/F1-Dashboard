import type { Lap } from "../types"
import { formatLapTime } from "../utils/format"

type Mode = "Current" | "Previous" | "Best" | "Session Best"

export default function LapDelta({
  driverAbbr,
  laps,
  current,
  best,
  sessionBest,
  sectorDeltas,
  onSelectLap,
  selectedLapNumber,
}: {
  driverAbbr: string
  laps: Lap[]
  current: Lap | null
  best: Lap | null
  sessionBest?: Lap | null
  sectorDeltas?: [number, number, number]
  onSelectLap?: (lapNumber: number) => void
  selectedLapNumber?: number | null
}) {
  const sorted = [...laps].filter(l=>l.lapDuration && l.lapDuration>0).sort((a,b)=>a.lapNumber-b.lapNumber)
  const hasLaps = sorted.length > 0
  const delta = current?.lapDuration && best?.lapDuration ? current.lapDuration - best.lapDuration : null
  const s = sectorDeltas ?? [0.082, -0.143, 0.021]
  const modes: Mode[] = ["Current","Previous","Best","Session Best"]

  // determine active mode label for styling — caller controls current vs previous via props
  const activeMode: Mode = current?.lapNumber === sorted[sorted.length-1]?.lapNumber ? "Current"
    : current?.lapNumber === sorted[sorted.length-2]?.lapNumber ? "Previous"
    : current?.lapDuration === best?.lapDuration ? "Best"
    : current?.lapDuration === sessionBest?.lapDuration ? "Session Best" : "Current"

  return (
    <div className="panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">LAP DELTA • {driverAbbr}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-bold">VS BEST</span>
      </div>

      {/* lap picker — browse older laps */}
      {hasLaps && onSelectLap && (
        <div className="flex items-center gap-1.5 mb-3">
          <button
            disabled={!selectedLapNumber || selectedLapNumber <= sorted[0].lapNumber}
            onClick={()=> onSelectLap(Math.max(sorted[0].lapNumber, (selectedLapNumber ?? sorted[sorted.length-1].lapNumber) -1))}
            className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs font-mono disabled:opacity-30"
          >‹</button>
          <select
            value={current?.lapNumber ?? ""}
            onChange={e=> onSelectLap(Number(e.target.value))}
            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded px-2 py-1 text-xs font-mono text-zinc-200"
          >
            {sorted.map(l=> (
              <option key={l.lapNumber} value={l.lapNumber}>Lap {l.lapNumber} — {formatLapTime(l.lapDuration)} {l.isPitOutLap?"• PIT":""}</option>
            ))}
          </select>
          <button
            disabled={!selectedLapNumber || selectedLapNumber >= sorted[sorted.length-1].lapNumber}
            onClick={()=> onSelectLap(Math.min(sorted[sorted.length-1].lapNumber, (selectedLapNumber ?? sorted[0].lapNumber)+1))}
            className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs font-mono disabled:opacity-30"
          >›</button>
          <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">{sorted.length} laps</span>
        </div>
      )}

      <div className="flex items-end gap-4">
        <div className={`font-mono font-bold text-3xl tracking-tight ${delta==null ? "text-zinc-600" : delta<0 ? "text-emerald-400" : delta>0 ? "text-red-400" : "text-zinc-300"}`}>
          {delta==null ? "—" : `${delta>0?"+":""}${delta.toFixed(3)}`}
        </div>
        <div className="text-xs font-mono text-zinc-500 mb-1">
          Lap {current?.lapNumber ?? "—"} {current ? formatLapTime(current.lapDuration) : "—"} • Best {best ? formatLapTime(best.lapDuration) : "—"}
        </div>
      </div>

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
          const c = Math.abs(d)<0.02 ? "text-zinc-400 border-zinc-700 bg-zinc-800" : d<0 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"
          return (
            <div key={i} className={`rounded border px-2 py-2 text-center ${c}`}>
              <div className="text-[10px] font-mono tracking-widest opacity-70">SECTOR {i+1}</div>
              <div className="font-mono font-bold text-sm">{d>0?"+":""}{d.toFixed(3)}</div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-1.5 mt-3">
        {modes.map(k=>(
          <button
            key={k}
            onClick={()=>{
              if (!hasLaps || !onSelectLap) return
              if (k==="Current") onSelectLap(sorted[sorted.length-1].lapNumber)
              else if (k==="Previous" && sorted.length>=2) onSelectLap(sorted[sorted.length-2].lapNumber)
              else if (k==="Best" && best) onSelectLap(best.lapNumber)
              else if (k==="Session Best" && sessionBest) onSelectLap(sessionBest.lapNumber)
            }}
            className={`flex-1 py-1 rounded text-[11px] font-mono font-bold tracking-widest border ${k===activeMode?"bg-white text-black border-white":"bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300"}`}
          >{k.toUpperCase()}</button>
        ))}
      </div>
    </div>
  )
}
