import { useState } from "react"
import type { Stint, Driver } from "../types"
import { COMPOUND_COLOR } from "../utils/colors"

export default function TireStrategy({ drivers, stints, totalLaps=57, onSelectDriver, selectedDriver }: {
  drivers: Driver[], stints: Stint[], totalLaps:number, onSelectDriver:(n:number)=>void, selectedDriver:number|null
}) {
  const [selectedStint, setSelectedStint] = useState<Stint | null>(null)

  // pick top 6 rows to avoid clutter, selected always visible
  const visibleDrivers = drivers.slice(0, 8)
  // ensure selected in list
  if (selectedDriver && !visibleDrivers.find(d=>d.driverNumber===selectedDriver)) {
    const sd = drivers.find(d=>d.driverNumber===selectedDriver)
    if (sd) visibleDrivers[visibleDrivers.length-1]=sd
  }

  return (
    <div className="panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">TIRE STRATEGY</span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:COMPOUND_COLOR.SOFT}}/> SOFT</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:COMPOUND_COLOR.MEDIUM}}/> MED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:COMPOUND_COLOR.HARD}}/> HARD</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:COMPOUND_COLOR.INTERMEDIATE}}/> INT</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:COMPOUND_COLOR.WET}}/> WET</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* ruler */}
        <div className="flex text-[10px] font-mono text-zinc-600 ml-[56px]">
          {[1, Math.floor(totalLaps/4), Math.floor(totalLaps/2), Math.floor(totalLaps*0.75), totalLaps].map(l=>(
            <span key={l} className="flex-1">{l}</span>
          ))}
        </div>

        {visibleDrivers.map(d=>{
          const ds = stints.filter(s=>s.driverNumber===d.driverNumber).sort((a,b)=>a.stintNumber-b.stintNumber)
          return (
            <div key={d.driverNumber} className={`flex items-center gap-2 rounded px-1 py-1 ${selectedDriver===d.driverNumber ? "bg-white/[0.04] border border-white/10" : ""}`}>
              <button onClick={()=>onSelectDriver(d.driverNumber)} className="w-[48px] text-left font-mono font-bold text-xs text-white shrink-0">{d.abbreviation}</button>
              <div className="flex-1 relative h-6 rounded overflow-hidden bg-[#0a0a0b] border border-white/5 flex">
                {ds.length ? ds.map(s=>{
                  const start = s.lapStart
                  const end = s.lapEnd ?? totalLaps
                  const span = end - start + 1
                  const pct = (span/totalLaps)*100
                  return (
                    <button
                      key={s.stintNumber}
                      onClick={()=>setSelectedStint(s)}
                      className={`relative h-full flex items-center justify-center text-[10px] font-mono font-bold border-r border-black/40 hover:brightness-125 transition ${selectedStint===s?"ring-1 ring-white/30 z-10":""}`}
                      style={{ width:`${pct}%`, background: (COMPOUND_COLOR as any)[s.compound] ?? "#52525b", color: s.compound==="HARD" || s.compound==="MEDIUM" ? "#000":"#fff" }}
                      title={`${s.compound} L${s.lapStart}-${s.lapEnd ?? "→"} `}
                    >
                      <span className="hidden sm:inline truncate px-1">{s.compound.slice(0,4)}</span>
                    </button>
                  )
                }) : (
                  <span className="flex-1 flex items-center justify-center text-[10px] font-mono text-zinc-600">no stint data</span>
                )}
              </div>
              <span className="hidden lg:block w-8 text-right font-mono text-[10px] text-zinc-500">{ds.length} pit</span>
            </div>
          )
        })}
      </div>

      {selectedStint && (
        <div className="mt-3 rounded border border-white/10 bg-[#0a0a0b] p-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest" style={{color:(COMPOUND_COLOR as any)[selectedStint.compound]}}>{selectedStint.compound}</div>
            <div className="text-[11px] font-mono text-zinc-400">Laps {selectedStint.lapStart} → {selectedStint.lapEnd ?? totalLaps} • {((selectedStint.lapEnd ?? totalLaps)-selectedStint.lapStart+1)} laps</div>
          </div>
          <button onClick={()=>setSelectedStint(null)} className="text-xs font-mono px-2 py-1 rounded bg-white text-black font-bold">CLOSE</button>
        </div>
      )}
    </div>
  )
}
