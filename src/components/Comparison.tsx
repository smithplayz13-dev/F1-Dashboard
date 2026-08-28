import type { TimingRowData } from "../types"
import { formatLapTime } from "../utils/format"

export default function Comparison({ a, b, onClose }: { a: TimingRowData, b: TimingRowData, onClose: ()=>void }) {
  const bar = (v: number|null, max: number, color: string) => (
    <div className="h-2 rounded bg-white/10 overflow-hidden flex-1">
      <div className="h-full" style={{ width: `${v ? Math.min(100, (v/max)*100) : 0}%`, background: color }} />
    </div>
  )
  const maxSector = Math.max(a.lastLap?.durationSector1 ?? 0, b.lastLap?.durationSector1 ?? 0, 30)

  return (
    <div className="panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">DRIVER COMPARISON</span>
        <button onClick={onClose} className="px-2 py-1 rounded bg-white text-black text-xs font-mono font-bold">CLOSE</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[a,b].map(r=>(
          <div key={r.driver.driverNumber} className="rounded border border-white/10 bg-[#0a0a0b] p-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-8 rounded" style={{background:r.driver.teamColor}}/>
              <div>
                <div className="font-bold text-sm text-white">{r.driver.abbreviation} • {r.driver.fullName}</div>
                <div className="text-xs font-mono text-zinc-500">{r.driver.teamName} • P{r.position}</div>
              </div>
            </div>
            <div className="mt-2 font-mono font-bold text-white">{formatLapTime(r.lastLap?.lapDuration)}</div>
            <div className="text-xs font-mono text-zinc-500">Best {formatLapTime(r.bestLap?.lapDuration)} • {r.compound} ·{r.tyreAge ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3 mt-4">
        {[
          ["S1", a.lastLap?.durationSector1 ?? null, b.lastLap?.durationSector1 ?? null],
          ["S2", a.lastLap?.durationSector2 ?? null, b.lastLap?.durationSector2 ?? null],
          ["S3", a.lastLap?.durationSector3 ?? null, b.lastLap?.durationSector3 ?? null],
        ].map(([label, av, bv])=>(
          <div key={label as string} className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>{label} {av!=null?Number(av).toFixed(3):"—"}</span>
              <span>{bv!=null?Number(bv).toFixed(3):"—"}</span>
            </div>
            <div className="flex gap-2">
              {bar(av as number, maxSector, a.driver.teamColor)}
              {bar(bv as number, maxSector, b.driver.teamColor)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
        <div className="rounded bg-white/[0.04] border border-white/5 p-2 flex justify-between"><span className="text-zinc-500">Speed</span><span className="text-white">{a.speed ?? "—"} vs {b.speed ?? "—"}</span></div>
        <div className="rounded bg-white/[0.04] border border-white/5 p-2 flex justify-between"><span className="text-zinc-500">Gap</span><span className="text-white">{a.gapToLeader ?? "—"} vs {b.gapToLeader ?? "—"}</span></div>
      </div>
    </div>
  )
}
