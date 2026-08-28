import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { backend } from "../services/backend"

type Point = { distance:number, speed?:number, throttle?:number, brake?:number, gear?:number, rpm?:number }

export default function TelemetryTrace({ year, gp, session, driver, lap, compareDriver, compareLap }: {
  year:number,gp:string,session:string,driver:string,lap:number, compareDriver?:string, compareLap?:number
}) {
  const [data, setData] = useState<Point[]|null>(null)
  const [compare, setCompare] = useState<Point[]|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    if (!driver || !lap) return
    setLoading(true); setError(null)
    backend.getTelemetry(year,gp,session,driver,lap).then(d=>{
      if (Array.isArray(d)) setData(d)
      else setError((d as any)?.error || "No telemetry")
    }).catch(e=>setError(String(e))).finally(()=>setLoading(false))
    if (compareDriver && compareLap) {
      backend.getTelemetry(year,gp,session,compareDriver,compareLap).then(d=>{
        if (Array.isArray(d)) setCompare(d)
      }).catch(()=>{})
    } else setCompare(null)
  }, [year,gp,session,driver,lap,compareDriver,compareLap])

  if (loading) return <div className="panel rounded-lg p-4 text-xs font-mono text-zinc-500">Loading telemetry {driver} L{lap}…</div>
  if (error) return <div className="panel rounded-lg p-4"><div className="text-xs font-mono text-amber-400">HISTORICAL DATA UNAVAILABLE</div><div className="text-[11px] font-mono text-zinc-600 mt-1">{error} — try another lap/GP or ensure FastF1 cache</div></div>
  if (!data) return <div className="panel rounded-lg p-4 text-xs font-mono text-zinc-600">Select a lap to load speed/throttle/brake/gear/rpm traces (FastF1 on demand)</div>

  const merged = data.map((p,i)=> ({ distance: p.distance, speed: p.speed, throttle: p.throttle, brake: p.brake ? 100 : 0, gear: p.gear, rpm: p.rpm ? p.rpm/1000 : null, speed2: compare?.[i]?.speed, throttle2: compare?.[i]?.throttle }))

  return (
    <div className="space-y-3">
      {[
        { key:"speed", label:"SPEED km/h", color:"#e10600", color2:"#60a5fa" },
        { key:"throttle", label:"THROTTLE %", color:"#22c55e", color2:"#a3e635" },
        { key:"brake", label:"BRAKE", color:"#facc15", color2:"#f97316" },
        { key:"rpm", label:"RPM x1000", color:"#a78bfa", color2:"#ec4899" },
      ].map(cfg=>(
        <div key={cfg.key} className="panel rounded-lg p-3">
          <div className="text-[11px] font-mono tracking-widest text-zinc-500">{cfg.label} • {driver} L{lap} {compareDriver?`vs ${compareDriver} L${compareLap}`:""}</div>
          <div className="h-[140px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged} margin={{top:5,right:10,left:0,bottom:0}}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="distance" stroke="#52525b" tick={{fontSize:9, fontFamily:"IBM Plex Mono"}} tickFormatter={v=>`${Math.round(v)}m`} />
                <YAxis stroke="#52525b" tick={{fontSize:9}} width={36} />
                <Tooltip contentStyle={{background:"#141417",border:"1px solid rgba(255,255,255,0.1)",fontSize:11}} />
                <Legend wrapperStyle={{fontSize:10, fontFamily:"IBM Plex Mono"}} />
                <Line type="monotone" dataKey={cfg.key} stroke={cfg.color} dot={false} strokeWidth={1.6} name={driver} isAnimationActive={false} />
                {compare && <Line type="monotone" dataKey={cfg.key+"2"} stroke={cfg.color2} dot={false} strokeWidth={1.2} strokeDasharray="4 3" name={compareDriver!} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}
