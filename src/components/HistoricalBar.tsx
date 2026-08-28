import { useEffect, useState } from "react"
import { backend } from "../services/backend"

export default function HistoricalBar({ year, gp, session, onChange }: {
  year:number,gp:string,session:string,onChange:(v:{year:number,gp:string,session:string})=>void
}) {
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    setLoading(true); setError(null)
    backend.getSchedule(year).then(setSchedule).catch(e=>setError(String(e))).finally(()=>setLoading(false))
  }, [year])

  return (
    <div className="panel rounded-lg px-3 py-3 flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">HISTORICAL • FastF1</span>
      {error && <span className="text-xs font-mono text-red-400">{error} — need FastF1 + pip install fastf1</span>}
      {loading && <span className="text-xs font-mono text-zinc-500">Loading {year} schedule…</span>}
      <select value={year} onChange={e=>onChange({year:Number(e.target.value),gp,session})} className="bg-[#0a0a0b] border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300">
        {[2024,2023,2022,2021].map(y=> <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={gp} onChange={e=>onChange({year,gp:e.target.value,session})} className="bg-[#0a0a0b] border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 min-w-[180px]">
        {schedule.map(s=> <option key={s.event_name} value={s.event_name}>{s.event_name} — {s.location}</option>)}
        {!schedule.length && !loading && <option value={gp}>{gp || "Select GP"}</option>}
      </select>
      <select value={session} onChange={e=>onChange({year,gp,session:e.target.value})} className="bg-[#0a0a0b] border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300">
        <option value="R">Race</option><option value="Q">Qualifying</option><option value="S">Sprint</option><option value="FP1">FP1</option><option value="FP2">FP2</option><option value="FP3">FP3</option>
      </select>
      <span className="text-[11px] font-mono text-zinc-600 hidden lg:inline">FastF1 cache enabled • telemetry on demand</span>
    </div>
  )
}
