import type { Weather, RaceControlMessage } from "../types"

function flagStyle(flag?: string) {
  switch (flag) {
    case "GREEN": return "bg-emerald-500 text-black"
    case "YELLOW": return "bg-yellow-400 text-black animate-pulse"
    case "RED": return "bg-red-600 text-white animate-pulse"
    case "CHEQUERED": return "bg-white text-black"
    default: return "bg-zinc-800 text-zinc-300"
  }
}
function statusLabel(rc: RaceControlMessage | undefined, fallback="GREEN FLAG") {
  if (!rc) return fallback
  if (rc.flag) return `${rc.flag} FLAG`
  if (rc.category) return rc.category.toUpperCase()
  return rc.message.toUpperCase().slice(0,24)
}

export default function TrackStatus({ weather, raceControl, lap, totalLaps }: { weather: Weather | null, raceControl: RaceControlMessage[], lap: number, totalLaps:number }) {
  const latestFlag = [...raceControl].reverse().find(r=>r.flag) ?? raceControl[raceControl.length-1]
  const flag = latestFlag?.flag ?? "GREEN"
  const sc = raceControl.find(r=>r.message.toLowerCase().includes("safety car"))
  const displayFlag = sc ? (sc.message.includes("VIRTUAL") ? "VIRTUAL SAFETY CAR" : "SAFETY CAR") : statusLabel(latestFlag)

  return (
    <div className="panel rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">TRACK STATUS</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-500">RC {raceControl.length}</span>
      </div>

      <div className={`rounded px-3 py-2 text-center font-display font-bold tracking-widest text-sm border ${flagStyle(flag)} ${flag==="YELLOW" || flag==="RED" ? "border-white/20" : "border-transparent"}`}>
        {displayFlag}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/30 rounded border border-white/5 p-2">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500">LAP</div>
          <div className="font-mono font-bold text-lg leading-none text-white">{lap} <span className="text-zinc-500 text-sm">/ {totalLaps}</span></div>
        </div>
        <div className="bg-black/30 rounded border border-white/5 p-2">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500">TIME</div>
          <div className="font-mono font-bold text-sm text-white">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-2">
          <div className="text-[10px] font-mono text-zinc-500">AIR</div>
          <div className="font-mono font-bold text-white">{weather?.airTemperature != null ? `${weather.airTemperature}°C` : "—"}</div>
        </div>
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-2">
          <div className="text-[10px] font-mono text-zinc-500">TRACK</div>
          <div className="font-mono font-bold text-white">{weather?.trackTemperature != null ? `${weather.trackTemperature}°C` : "—"}</div>
        </div>
        <div className="bg-[#0a0a0b] rounded border border-white/5 p-2">
          <div className="text-[10px] font-mono text-zinc-500">WIND</div>
          <div className="font-mono font-bold text-white">{weather?.windSpeed != null ? `${weather.windSpeed} km/h` : "—"}</div>
        </div>
      </div>

      {weather && (
        <div className="text-[10px] font-mono text-zinc-600 flex justify-between">
          <span>HUM {weather.humidity ?? "—"}%</span>
          <span>P {weather.pressure ?? "—"} hPa</span>
          <span>RAIN {weather.rainfall ? "YES" : "NO"}</span>
        </div>
      )}

      <div className="space-y-1 max-h-20 overflow-auto">
        {raceControl.slice(-3).map((r,i)=>(
          <div key={i} className="text-[11px] font-mono leading-tight px-2 py-1 rounded bg-white/[0.04] border border-white/5 text-zinc-400 truncate">
            {r.message}
          </div>
        ))}
      </div>
    </div>
  )
}
