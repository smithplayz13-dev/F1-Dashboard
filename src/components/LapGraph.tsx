import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from "recharts"
import type { Lap } from "../types"
import { formatLapTime } from "../utils/format"

export default function LapGraph({ laps, compareLaps, driverAbbr, compareAbbr }: {
  laps: Lap[], compareLaps?: Lap[], driverAbbr: string, compareAbbr?: string
}) {
  const data = laps.filter(l=>l.lapDuration && l.lapDuration<200).map(l=>({
    lap: l.lapNumber,
    time: Number(l.lapDuration!.toFixed(3)),
    pit: !!l.isPitOutLap,
  }))

  // fastest
  const fastest = data.length ? data.reduce((a,b)=>a.time<b.time?a:b) : null
  const compareData = compareLaps?.filter(l=>l.lapDuration && l.lapDuration<200).map(l=>({ lap:l.lapNumber, time: Number(l.lapDuration!.toFixed(3)) }))

  // merge for tooltip if compare exists
  const merged = data.map(d=>{
    const c = compareData?.find(x=>x.lap===d.lap)
    return { ...d, compare: c?.time ?? null }
  })

  return (
    <div className="panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">LAP TIME TELEMETRY • {driverAbbr} {compareAbbr?`vs ${compareAbbr}`:""}</span>
        <span className="text-[10px] font-mono text-zinc-600">LAP 1 → {data.length}</span>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top:8,right:12,left:0,bottom:0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="lap" stroke="#52525b" tick={{ fontSize:10, fontFamily:"IBM Plex Mono" }} tickLine={false} axisLine={{ stroke:"rgba(255,255,255,0.08)" }} />
            <YAxis domain={['dataMin - 0.5','dataMax + 0.8']} stroke="#52525b" tick={{ fontSize:10, fontFamily:"IBM Plex Mono" }} tickFormatter={v=>`${v.toFixed(1)}`} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ background:"#141417", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontFamily:"IBM Plex Mono", fontSize:12 }}
              labelStyle={{ color:"#a1a1aa" }}
              formatter={(value:any, name:any)=>[`${Number(value).toFixed(3)}s`, name==="time"?driverAbbr:compareAbbr??"compare"]}
              labelFormatter={l=>`Lap ${l}`}
            />
            <Line type="monotone" dataKey="time" stroke="#e10600" strokeWidth={1.8} dot={false} activeDot={{ r:3, fill:"#fff", stroke:"#e10600" }} isAnimationActive={false} />
            {compareData && <Line type="monotone" dataKey="compare" stroke="#60a5fa" strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false} />}
            {fastest && <ReferenceDot x={fastest.lap} y={fastest.time} r={4} fill="#facc15" stroke="#000" strokeWidth={1} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#e10600]" /> {driverAbbr}</span>
        {compareAbbr && <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#60a5fa] border-dashed border-t" /> {compareAbbr}</span>}
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#facc15] border border-black" /> Fastest {fastest ? formatLapTime(fastest.time) : "—"}</span>
        <span className="ml-auto text-zinc-600 hidden sm:inline">Hover for times • Pit laps highlighted</span>
      </div>
    </div>
  )
}
