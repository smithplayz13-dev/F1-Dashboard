import { Activity, Radio, Clock, Expand, Database } from "lucide-react"
import { timeAgo } from "../utils/format"
import type { Session } from "../types"

interface Props {
  session: Session | null
  status: string
  isLive: boolean
  lastUpdated: string | null
  totalLaps?: number
  currentLap?: number
  sessions: Session[]
  selectedKey?: number
  onSelectSession: (k:number)=>void
  dataSourceMode: string
  setDataSourceMode: (m:any)=>void
  onBroadcast: ()=>void
  isBroadcast: boolean
}

export default function Header({ session, status, isLive, lastUpdated, totalLaps=57, currentLap=42, sessions, selectedKey, onSelectSession, dataSourceMode, setDataSourceMode, onBroadcast, isBroadcast }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#e10600] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-[15px] tracking-widest leading-none">F1 LIVE TIMING</div>
              <div className="text-[10px] tracking-[0.2em] text-zinc-500 font-mono">RACE CONTROL</div>
            </div>
          </div>
          <div className="hidden lg:block h-8 w-px bg-white/10" />
          <div className="hidden md:block min-w-0">
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <span className="truncate">{session ? `${session.year} • ${session.location} — ${session.circuitShortName}` : "NO SESSION"}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest border ${status==="live" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : status==="ended" ? "border-zinc-700 text-zinc-400" : "border-amber-500/30 text-amber-400"}`}>
                {status==="live" ? "LIVE" : status==="ended" ? "SESSION ENDED" : status.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 truncate">
              {session?.sessionName ?? "—"} • {session ? new Date(session.dateStart).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">LAP</span>
            <span className="bg-white text-black px-2 py-1 rounded font-bold text-sm leading-none">{currentLap} / {totalLaps}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className={isLive ? "text-emerald-400" : "text-zinc-500"}>{lastUpdated ? timeAgo(lastUpdated) : "—"}</span>
            {isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulseSoft" />}
          </div>

          <select value={selectedKey ?? ""} onChange={e=>onSelectSession(Number(e.target.value))} className="hidden xl:block bg-[#141417] border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 max-w-[220px]">
            {sessions.slice(0,30).map(s=>(
              <option key={s.sessionKey} value={s.sessionKey}>{s.circuitShortName} — {s.sessionName} ({s.year})</option>
            ))}
            {!sessions.length && <option>Loading sessions…</option>}
          </select>

          <div className="hidden md:flex items-center gap-1 bg-[#141417] border border-white/10 rounded p-0.5">
            {([
              ["auto","AUTO"],
              ["openf1","OPENF1"],
              ["demo","DEMO"],
            ] as const).map(([v,label])=>(
              <button key={v} onClick={()=>setDataSourceMode(v)} className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-widest ${dataSourceMode===v ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}>{label}</button>
            ))}
            <Database className="w-3 h-3 ml-1 mr-1 text-zinc-600" />
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-mono font-bold tracking-widest ${isLive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-white/10 text-zinc-400"}`}>
            <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "LIVE" : "REPLAY"}
            <span className={`w-1.5 h-1.5 rounded-full ml-1 ${isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
          </div>

          <button onClick={onBroadcast} className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono font-bold tracking-widest ${isBroadcast ? "bg-white text-black border-white" : "bg-transparent border-white/15 text-zinc-300 hover:bg-white/10"}`}>
            <Expand className="w-3.5 h-3.5" /> {isBroadcast ? "EXIT" : "BROADCAST"}
            <span className="hidden lg:inline ml-1 text-[10px] opacity-60">[F]</span>
          </button>
        </div>
      </div>

      {/* mobile session line */}
      <div className="md:hidden px-4 pb-2 flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-500 truncate">{session?.circuitShortName ?? "—"} • {session?.sessionName}</span>
        <span className="text-zinc-400">{currentLap}/{totalLaps} • {lastUpdated ? timeAgo(lastUpdated) : ""}</span>
      </div>
    </header>
  )
}
