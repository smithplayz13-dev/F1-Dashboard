import type { TimingRowData } from "../types"
import { formatLapTime } from "../utils/format"

export default function DriverDetail({ row, onClose, onCompare }: { row: TimingRowData | null, onClose: ()=>void, onCompare?: ()=>void }) {
  if (!row) return (
    <div className="panel rounded-lg p-6 text-center">
      <div className="text-xs font-mono tracking-widest text-zinc-500">SELECTED DRIVER TELEMETRY</div>
      <div className="mt-2 text-sm font-mono text-zinc-600">Click a driver in the timing tower</div>
    </div>
  )
  return (
    <div className="panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-12 rounded" style={{ background: row.driver.teamColor }} />
          <div>
            <div className="font-display font-bold text-lg leading-none text-white">{row.driver.fullName.toUpperCase()}</div>
            <div className="text-xs font-mono text-zinc-500">{row.driver.teamName} • #{row.driver.driverNumber} • {row.driver.abbreviation}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">P{row.position}</span>
              <span className="text-xs font-mono text-zinc-400">GAP {row.gapToLeader ?? row.interval ?? "—"}</span>
              {row.drs===1 && <span className="text-[10px] font-bold tracking-widest px-1 py-0.5 rounded bg-emerald-500 text-black">DRS</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onCompare && <button onClick={onCompare} className="px-3 py-1.5 rounded border border-white/15 text-xs font-mono font-bold tracking-widest hover:bg-white hover:text-black">COMPARE</button>}
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-white/10 border border-white/10 text-xs font-mono hover:bg-white/15">✕</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-3">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500">BEST LAP</div>
          <div className="font-mono font-bold text-white">{formatLapTime(row.bestLap?.lapDuration)}</div>
        </div>
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-3">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500">LAST LAP</div>
          <div className="font-mono font-bold text-white">{formatLapTime(row.lastLap?.lapDuration)}</div>
        </div>
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-3">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500">SPEED</div>
          <div className="font-mono font-bold text-white">{row.speed ? `${row.speed} km/h` : "—"}</div>
          <div className="h-1 mt-1 rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-[#e10600]" style={{ width: `${Math.min(100, ((row.speed ?? 0)/350)*100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          ["S1", row.lastLap?.durationSector1],
          ["S2", row.lastLap?.durationSector2],
          ["S3", row.lastLap?.durationSector3],
        ].map(([label, val])=>(
          <div key={label as string} className="rounded border border-white/5 bg-black/30 p-2 text-center">
            <div className="text-[10px] font-mono text-zinc-500">{label}</div>
            <div className="font-mono font-bold text-sm text-white">{val ? Number(val).toFixed(3) : "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
        <span className="px-2 py-1 rounded border border-white/10 bg-white/[0.04]">TYRE {row.compound} {row.tyreAge!=null?`·${row.tyreAge}`:""}</span>
        <span className="px-2 py-1 rounded border border-white/10 bg-white/[0.04]">STINTS {row.stints.length}</span>
        <span className="ml-auto text-zinc-600">Gear / Throttle / Brake hidden — not in OpenF1 car_data poll</span>
      </div>
    </div>
  )
}
