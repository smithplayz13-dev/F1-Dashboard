import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot, Brush } from "recharts"
import type { Lap } from "../types"
import { formatLapTime } from "../utils/format"

export default function LapGraph({ laps, compareLaps, driverAbbr, compareAbbr, onSelectLap, selectedLap }: {
  laps: Lap[], compareLaps?: Lap[], driverAbbr: string, compareAbbr?: string, onSelectLap?: (n:number)=>void, selectedLap?: number|null
}) {
  const data = laps.filter(l=>l.lapDuration != null && l.lapDuration<200 && !l.isPitOutLap).map(l=>({
    lap: l.lapNumber,
    time: Number(l.lapDuration!.toFixed(3)),
    pit: !!l.isPitOutLap,
  })).sort((a,b)=>a.lap-b.lap)

  const fastest = data.length ? data.reduce((a,b)=>a.time<b.time?a:b) : null
  const compareData = compareLaps?.filter(l=>l.lapDuration != null && l.lapDuration<200).map(l=>({ lap:l.lapNumber, time: Number(l.lapDuration!.toFixed(3)) }))

  const merged = data.map(d=>{
    const c = compareData?.find(x=>x.lap===d.lap)
    return { ...d, compare: c?.time ?? null }
  })

  const hasData = merged.length > 0
  const showBrush = merged.length > 18

  return (
    <div className="panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">LAP TIME TELEMETRY • {driverAbbr} {compareAbbr?`vs ${compareAbbr}`:""}</span>
        <span className="text-[10px] font-mono text-zinc-600">LAP 1 → {data.length} • click point for lap</span>
      </div>

      <div className="h-[180px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top:8,right:12,left:0,bottom:0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="lap" stroke="#52525b" tick={{ fontSize:10, fontFamily:"IBM Plex Mono" }} tickLine={false} axisLine={{ stroke:"rgba(255,255,255,0.08)" }} />
              <YAxis domain={['dataMin - 0.5','dataMax + 0.8']} stroke="#52525b" tick={{ fontSize:10, fontFamily:"IBM Plex Mono" }} tickFormatter={v=>`${v.toFixed(1)}`} tickLine={false} axisLine={false} width={42} />
              <Tooltip
                contentStyle={{ background:"#141417", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontFamily:"IBM Plex Mono", fontSize:12 }}
                labelStyle={{ color:"#a1a1aa" }}
                formatter={(value:any, name:any)=>[value!=null?`${Number(value).toFixed(3)}s`:"—", name==="time"?driverAbbr:compareAbbr??"compare"]}
                labelFormatter={l=>`Lap ${l}`}
              />
              <Line type="monotone" dataKey="time" stroke="#e10600" strokeWidth={1.8} dot={false} activeDot={{ r:4, fill:"#fff", stroke:"#e10600" }} isAnimationActive={false} connectNulls />
              {compareData && <Line type="monotone" dataKey="compare" stroke="#60a5fa" strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false} connectNulls />}
              {fastest && <ReferenceDot x={fastest.lap} y={fastest.time} r={4} fill="#facc15" stroke="#000" strokeWidth={1} />}
              {selectedLap != null && <ReferenceDot x={selectedLap} y={merged.find(m=>m.lap===selectedLap)?.time} r={6} fill="#fff" stroke="#e10600" strokeWidth={2} />}
              {showBrush && <Brush dataKey="lap" height={18} stroke="#52525b" fill="#0a0a0b" tickFormatter={()=>""} />}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-600">No lap data for this driver/session</div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-[11px] font-mono flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#e10600]" /> {driverAbbr}</span>
        {compareAbbr && <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#60a5fa] border-dashed border-t" /> {compareAbbr}</span>}
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#facc15] border border-black" /> Fastest {fastest ? formatLapTime(fastest.time) : "—"}</span>
        {selectedLap!=null && <span className="px-1.5 py-0.5 rounded bg-white text-black font-bold">LAP {selectedLap}</span>}
        <span className="ml-auto text-zinc-600 hidden sm:inline">Drag brush to view older laps • Click point</span>
      </div>

      {/* fallback click list for precise older-lap navigation when brush is not enough */}
      {onSelectLap && data.length>0 && (
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {data.map(d=>(
            <button
              key={d.lap}
              onClick={()=>onSelectLap(d.lap)}
              className={`shrink-0 w-7 h-7 rounded text-[11px] font-mono font-bold border ${selectedLap===d.lap ? "bg-white text-black border-white" : d.pit ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"}`}
              title={`Lap ${d.lap} ${formatLapTime(d.time)}${d.pit?" PIT":""}`}
            >{d.lap}</button>
          ))}
        </div>
      )}
    </div>
  )
}
