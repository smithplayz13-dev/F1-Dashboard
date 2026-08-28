import { useState, useEffect, useMemo } from "react"
import Header from "./components/Header"
import TimingTower from "./components/TimingTower"
import TrackStatus from "./components/TrackStatus"
import LapDelta from "./components/LapDelta"
import LapGraph from "./components/LapGraph"
import TireStrategy from "./components/TireStrategy"
import DriverDetail from "./components/DriverDetail"
import Comparison from "./components/Comparison"
import RaceControls from "./components/RaceControls"
import type { ViewTab } from "./components/RaceControls"
import { useRaceData } from "./hooks/useRaceData"
import { buildTimingRows } from "./services/raceData"
import { formatLapTime } from "./utils/format"

export default function App() {
  const { sessionData, sessions, loading, error, selectedSessionKey, setSelectedSessionKey, load, dataSourceMode, setDataSourceMode } = useRaceData()
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null)
  const [compareDriver, setCompareDriver] = useState<number | null>(null)
  const [view, setView] = useState<ViewTab>("TIMING")
  const [broadcast, setBroadcast] = useState(false)
  const [totalLaps] = useState(57)

  // keyboard shortcut F for broadcast
  useEffect(()=>{
    const h = (e: KeyboardEvent)=> { if (e.key.toLowerCase()==="f") setBroadcast(v=>!v) }
    window.addEventListener("keydown", h); return ()=>window.removeEventListener("keydown",h)
  }, [])

  const timingRows = useMemo(()=>{
    if (!sessionData) return []
    return buildTimingRows({ drivers: sessionData.drivers, positions: sessionData.positions, intervals: sessionData.intervals, laps: sessionData.laps, stints: sessionData.stints })
  }, [sessionData])

  const currentLap = useMemo(()=>{
    if (!timingRows.length) return 42
    const max = Math.max(...timingRows.map(r=> r.lastLap?.lapNumber ?? 0))
    return max || 42
  }, [timingRows])

  const selectedRow = timingRows.find(r=>r.driver.driverNumber===selectedDriver) ?? null
  const compareRow = timingRows.find(r=>r.driver.driverNumber===compareDriver) ?? null
  const fastest = timingRows.length ? [...timingRows].filter(r=>r.bestLap?.lapDuration).sort((a,b)=>(a.bestLap!.lapDuration!)-(b.bestLap!.lapDuration!))[0] : null

  // auto-select first driver if none
  useEffect(()=>{ if (!selectedDriver && timingRows.length) setSelectedDriver(timingRows[0].driver.driverNumber) }, [timingRows, selectedDriver])

  if (loading && !sessionData) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-8">
        <div className="w-full max-w-md panel rounded-lg p-8 text-center">
          <div className="text-xs font-mono tracking-[0.2em] text-zinc-500">CONNECTING TO RACE CONTROL...</div>
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 bg-[#e10600] animate-pulse" />
          </div>
          <div className="mt-3 text-xs font-mono text-zinc-600">OpenF1 • Ergast fallback • Polling 5s</div>
        </div>
      </div>
    )
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-8">
        <div className="panel rounded-lg p-8 text-center max-w-md">
          <div className="text-sm font-mono font-bold tracking-widest text-red-400">DATA LINK OFFLINE</div>
          <div className="text-xs font-mono text-zinc-500 mt-2">{error}</div>
          <button onClick={()=>load()} className="mt-4 px-4 py-2 rounded bg-white text-black text-xs font-mono font-bold">RETRY</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#070709] bg-grid ${broadcast ? "p-0" : ""}`}>
      <Header
        session={sessionData?.session ?? null}
        status={sessionData?.status ?? "loading"}
        isLive={!!sessionData?.isLive}
        lastUpdated={sessionData?.lastUpdated ?? null}
        totalLaps={totalLaps}
        currentLap={currentLap}
        sessions={sessions}
        selectedKey={selectedSessionKey}
        onSelectSession={(k)=>{ setSelectedSessionKey(k); load(k) }}
        dataSourceMode={dataSourceMode}
        setDataSourceMode={setDataSourceMode}
        onBroadcast={()=>setBroadcast(v=>!v)}
        isBroadcast={broadcast}
      />

      {/* secondary bar */}
      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0b]/50">
        <RaceControls active={view} onChange={setView} />
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10"><span className="w-2 h-2 rounded-full bg-[#e10600]"/> FASTEST LAP {fastest ? `${fastest.driver.abbreviation} ${formatLapTime(fastest.bestLap?.lapDuration)}` : "—"}</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-500">DRS <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">ENABLED</span></span>
          {sessionData?.dataSource==="demo" && <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold tracking-widest text-[10px]">DEMO MODE</span>}
          {sessionData?.status==="offline" && <span className="px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold tracking-widest text-[10px]">OFFLINE • DEMO FALLBACK</span>}
        </div>
      </div>

      <main className={`px-4 lg:px-6 py-4 lg:py-6 max-w-[1920px] mx-auto ${broadcast ? "max-w-none" : ""}`}>
        {view==="TIMING" && (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {/* Timing tower — majority */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-8">
              <TimingTower rows={timingRows} selected={selectedDriver} onSelect={(n)=>{
                if (compareDriver!=null) {
                  // if in compare mode, set second
                  if (n===compareDriver) setCompareDriver(null)
                  else if (n===selectedDriver) {} else setCompareDriver(n)
                } else setSelectedDriver(n)
              }} />
            </div>

            {/* Right column */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-4 space-y-4">
              <TrackStatus weather={sessionData?.weather ?? null} raceControl={sessionData?.raceControl ?? []} lap={currentLap} totalLaps={totalLaps} />
              {selectedRow && (
                <LapDelta
                  driverAbbr={selectedRow.driver.abbreviation}
                  current={selectedRow.lastLap}
                  best={selectedRow.bestLap}
                  sectorDeltas={selectedRow.lastLap && selectedRow.bestLap ? [
                    Number(((selectedRow.lastLap.durationSector1 ?? 0) - (selectedRow.bestLap.durationSector1 ?? 0)).toFixed(3)),
                    Number(((selectedRow.lastLap.durationSector2 ?? 0) - (selectedRow.bestLap.durationSector2 ?? 0)).toFixed(3)),
                    Number(((selectedRow.lastLap.durationSector3 ?? 0) - (selectedRow.bestLap.durationSector3 ?? 0)).toFixed(3)),
                  ] : undefined}
                />
              )}
            </div>

            {/* bottom telemetry + strategy */}
            <div className="col-span-12 grid grid-cols-12 gap-4 lg:gap-6">
              <div className="col-span-12 lg:col-span-7">
                <LapGraph
                  laps={sessionData?.laps.filter(l=>l.driverNumber===selectedDriver) ?? []}
                  compareLaps={compareDriver ? sessionData?.laps.filter(l=>l.driverNumber===compareDriver) : undefined}
                  driverAbbr={selectedRow?.driver.abbreviation ?? "—"}
                  compareAbbr={compareRow?.driver.abbreviation}
                />
              </div>
              <div className="col-span-12 lg:col-span-5">
                {compareRow && selectedRow ? (
                  <Comparison a={selectedRow} b={compareRow} onClose={()=>setCompareDriver(null)} />
                ) : (
                  <DriverDetail row={selectedRow} onClose={()=>setSelectedDriver(timingRows[0]?.driver.driverNumber ?? null)} onCompare={()=>{
                    // pick next driver as compare candidate
                    const other = timingRows.find(r=>r.driver.driverNumber!==selectedDriver)
                    if (other) setCompareDriver(other.driver.driverNumber)
                  }} />
                )}
              </div>
            </div>

            <div className="col-span-12">
              <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={selectedDriver} />
            </div>
          </div>
        )}

        {view==="TELEMETRY" && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <LapGraph laps={sessionData?.laps.filter(l=>l.driverNumber===selectedDriver) ?? []} driverAbbr={selectedRow?.driver.abbreviation ?? "—"} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DriverDetail row={selectedRow} onClose={()=>{}} />
              <div className="panel rounded-lg p-4 mt-4">
                <div className="text-xs font-mono tracking-widest text-zinc-500">TELEMETRY STREAM</div>
                <div className="text-xs font-mono text-zinc-600 mt-2">OpenF1 car_data (speed/rpm/gear/throttle/brake/drs) polled separately. Select driver then expand for live trace. Gracefully hidden when unavailable — currently showing cached speed only.</div>
              </div>
            </div>
          </div>
        )}

        {view==="STRATEGY" && (
          <div className="space-y-6">
            <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={selectedDriver} />
            <div className="panel rounded-lg p-4">
              <div className="text-xs font-mono tracking-widest text-zinc-500">PIT WINDOW</div>
              <div className="mt-2 text-sm font-mono text-zinc-300">Strategy view shows stint boundaries and compounds. Click any stint for details. Pit detection via lap_duration spikes and is_pit_out_lap flag from OpenF1.</div>
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono tracking-widest text-zinc-600">
        <span>RACE CONTROL • OpenF1 API • Poll 5s • Never fakes live as replay</span>
        <span className="hidden sm:inline">© 2026 F1 LIVE TIMING • Broadcast palette • Press F for fullscreen</span>
      </footer>
    </div>
  )
}
