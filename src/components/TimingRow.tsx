import { memo } from "react"
import { motion } from "framer-motion"
import type { TimingRowData } from "../types"
import { formatLapTime } from "../utils/format"
import { COMPOUND_COLOR, COMPOUND_LABEL } from "../utils/colors"

function TyreBadge({ compound, age }: { compound: string, age?: number | null }) {
  const color = (COMPOUND_COLOR as any)[compound] ?? "#6b7280"
  const label = (COMPOUND_LABEL as any)[compound] ?? compound
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: color }} />
      <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color }}>{label}</span>
      {age != null && <span className="font-mono text-[10px] text-zinc-500">·{age}</span>}
    </span>
  )
}

const TimingRow = memo(function TimingRow({ row, selected, onSelect, isFastest }: { row: TimingRowData, selected: boolean, onSelect: ()=>void, isFastest: boolean }) {
  const posChange = row.positionChange
  const changeLabel = posChange === 0 ? "—" : posChange > 0 ? `↑ ${posChange}` : `↓ ${Math.abs(posChange)}`

  return (
    <motion.div
      layout
      initial={false}
      animate={posChange!==0 ? { backgroundColor: posChange>0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" } : {}}
      transition={{ duration: 0.6 }}
      onClick={onSelect}
      className={`group relative grid grid-cols-[28px_46px_1fr_72px_86px_86px_86px] xl:grid-cols-[36px_52px_1fr_90px_96px_96px_110px] items-center gap-1 px-2 py-[7px] border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer text-xs ${selected ? "bg-white/[0.06] border-l-2 border-l-white !border-b-white/10" : "border-l-2 border-l-transparent"} ${isFastest ? "bg-[#e10600]/[0.06]" : ""}`}
      style={{ borderLeftColor: selected ? row.driver.teamColor : undefined }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: row.driver.teamColor }} />

      <div className="font-mono font-bold text-sm text-white pl-2">{row.position}</div>

      <div className={`font-mono text-[11px] font-bold w-10 text-center rounded py-0.5 ${posChange>0 ? "bg-emerald-500/15 text-emerald-400" : posChange<0 ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-500"}`}>
        {changeLabel}
      </div>

      <div className="min-w-0 flex items-center gap-2">
        <span className="font-display font-bold text-[13px] tracking-wide text-white truncate">{row.driver.abbreviation}</span>
        <span className="hidden xl:inline text-[11px] text-zinc-500 truncate">{row.driver.teamName}</span>
        {row.drs===1 && <span className="hidden sm:inline-flex text-[9px] font-bold tracking-widest px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">DRS</span>}
      </div>

      <div className="font-mono text-xs text-zinc-300 text-right pr-2">
        {row.gapToLeader && row.gapToLeader!=="—" ? (row.position===1 ? "—" : row.gapToLeader) : (row.interval && row.interval!=="—" ? row.interval : "—")}
      </div>

      <div className={`font-mono text-xs text-right pr-2 ${isFastest ? "text-[#ff4d4d] font-bold" : "text-zinc-300"}`}>
        {formatLapTime(row.lastLap?.lapDuration)}
        {isFastest && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-[#e10600] text-white align-middle">FAST</span>}
      </div>

      <div className="font-mono text-xs text-zinc-400 text-right pr-2 hidden sm:block">
        {formatLapTime(row.bestLap?.lapDuration)}
      </div>

      <div className="text-right pr-1">
        <TyreBadge compound={row.compound} age={row.tyreAge} />
      </div>

      {/* tooltip on hover */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
        <div className="bg-[#0f0f12] border border-white/10 rounded px-3 py-2 shadow-xl whitespace-nowrap text-xs font-mono">
          <div className="font-bold text-white">{row.driver.fullName}</div>
          <div className="text-zinc-400">{row.driver.teamName} • P{row.position} • {row.gapToLeader ?? row.interval ?? "—"}</div>
          <div className="text-zinc-500">Last {formatLapTime(row.lastLap?.lapDuration)} • Best {formatLapTime(row.bestLap?.lapDuration)} • {row.compound} {row.tyreAge?`·${row.tyreAge}`:""}</div>
        </div>
      </div>
    </motion.div>
  )
})

export default TimingRow
