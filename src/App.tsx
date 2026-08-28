import { useState, useEffect, useMemo, useRef } from "react"
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
import { buildTimingRows, buildTimingRowsAtLap } from "./services/raceData"
import { formatLapTime } from "./utils/format"
import ReplayBar from "./components/ReplayBar"
import HistoricalBar from "./components/HistoricalBar"
import { backend } from "./services/backend"

export default function App() {
  const { sessionData, sessions, loading, error, selectedSessionKey, setSelectedSessionKey, selectedYear, setSelectedYear, load, dataSourceMode, setDataSourceMode } = useRaceData()
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null)
  const [compareDriver, setCompareDriver] = useState<number | null>(null)
  const [selectedLapNumber, setSelectedLapNumber] = useState<number | null>(null)
  const [view, setView] = useState<ViewTab>("TIMING")
  const [broadcast, setBroadcast] = useState(false)
  const [replayLap, setReplayLap] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [replaySpeed, setReplaySpeed] = useState(1)
  const [dataMode, setDataMode] = useState<"LIVE"|"HISTORICAL"|"DEMO">("LIVE")
  const [hist, setHist] = useState({year:2024, gp:"Italian Grand Prix", session:"R"})
  const [histLaps, setHistLaps] = useState<any[]|null>(null)
  const [backendOk, setBackendOk] = useState<boolean|null>(null)
  const prevPosRef = useRef<Map<number,number>>(new Map())

  useEffect(()=>{
    const h = (e: KeyboardEvent)=> {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key.toLowerCase()==="f") setBroadcast(v=>!v)
    }
    window.addEventListener("keydown", h); return ()=>window.removeEventListener("keydown",h)
  }, [])

  useEffect(()=>{ backend.health().then(h=>setBackendOk(!!h)).catch(()=>setBackendOk(false)) }, [])
  useEffect(()=>{
    if (dataMode==="DEMO") setDataSourceMode("demo")
    else if (dataMode==="LIVE") setDataSourceMode("auto")
    else setDataSourceMode("auto")
  }, [dataMode, setDataSourceMode])

  useEffect(()=>{
    if (dataMode!=="HISTORICAL") { setHistLaps(null); return }
    setHistLaps(null)
    backend.getFastF1Laps(hist.year, hist.gp, hist.session).then(setHistLaps).catch(()=>setHistLaps([]))
  }, [dataMode, hist.year, hist.gp, hist.session])

  const currentLap = useMemo(()=>{
    if (!sessionData?.laps.length) return 1
    return Math.max(...sessionData.laps.map(l=>l.lapNumber), 1)
  }, [sessionData])

  const totalLaps = useMemo(()=>{
    if (!sessionData?.laps.length) return 57
    const max = Math.max(...sessionData.laps.map(l=>l.lapNumber))
    return Math.max(max, 57)
  }, [sessionData])

  // replayLap is the lap we are viewing in replay mode; defaults to currentLap (live)
  const effectiveReplayLap = replayLap ?? currentLap

  const timingRows = useMemo(()=>{
    if (!sessionData) return []
    // if replayLap is set and not at live, show historical snapshot
    const useReplay = replayLap != null && replayLap !== currentLap && !sessionData.isLive
    const rows = useReplay
      ? buildTimingRowsAtLap({
          drivers: sessionData.drivers,
          positions: sessionData.positions,
          intervals: sessionData.intervals,
          laps: sessionData.laps,
          stints: sessionData.stints,
          prevPositions: prevPosRef.current,
          replayLap: effectiveReplayLap,
        })
      : buildTimingRows({
          drivers: sessionData.drivers,
          positions: sessionData.positions,
          intervals: sessionData.intervals,
          laps: sessionData.laps,
          stints: sessionData.stints,
          prevPositions: prevPosRef.current,
          currentLap,
        })
    const m = new Map<number,number>()
    for (const r of rows) if (r.position!==99) m.set(r.driver.driverNumber, r.position)
    prevPosRef.current = m
    return rows
  }, [sessionData, currentLap, replayLap, effectiveReplayLap])

  const selectedRow = timingRows.find(r=>r.driver.driverNumber===selectedDriver) ?? timingRows[0] ?? null
  const compareRow = timingRows.find(r=>r.driver.driverNumber===compareDriver) ?? null
  const fastest = useMemo(()=> {
    const valid = timingRows.filter(r=>r.bestLap?.lapDuration!=null && r.bestLap.lapDuration>0 && !r.bestLap.isPitOutLap).map(r=>r.bestLap!.lapDuration!)
    if (!valid.length) return null
    const min = Math.min(...valid)
    return timingRows.find(r=> r.bestLap?.lapDuration!=null && Math.abs(r.bestLap.lapDuration - min)<0.001) ?? null
  }, [timingRows])

  const sessionFastest = useMemo(()=>{
    const valid = (sessionData?.laps ?? []).filter(l=>l.lapDuration!=null && l.lapDuration>0 && !l.isPitOutLap)
    if (!valid.length) return null
    return valid.sort((a,b)=>(a.lapDuration! - b.lapDuration!))[0]
  }, [sessionData])

  // auto-select driver without effect cascade: derive during render
  const effectiveSelectedDriver = selectedDriver ?? timingRows[0]?.driver.driverNumber ?? null
  useEffect(()=>{
    if (selectedDriver==null && timingRows.length) setSelectedDriver(timingRows[0].driver.driverNumber)
  }, [timingRows, selectedDriver])

  useEffect(()=>{
    if (!sessionData || effectiveSelectedDriver==null) return
    const laps = sessionData.laps.filter(l=>l.driverNumber===effectiveSelectedDriver && l.lapDuration!=null && l.lapDuration>0).sort((a,b)=>a.lapNumber-b.lapNumber)
    if (laps.length && (selectedLapNumber==null || !laps.some(l=>l.lapNumber===selectedLapNumber))) {
      setSelectedLapNumber(laps[laps.length-1].lapNumber)
    }
  }, [effectiveSelectedDriver, sessionData, selectedLapNumber])

  // when session changes, reset replay to live
  useEffect(()=>{
    if (sessionData?.session) {
      setReplayLap(null)
      setIsPlaying(false)
    }
  }, [sessionData?.session?.sessionKey])

  // sync selectedLapNumber with replayLap for unified lap-to-lap switching
  useEffect(()=>{
    if (selectedLapNumber != null && selectedLapNumber !== effectiveReplayLap && !sessionData?.isLive) {
      setReplayLap(selectedLapNumber)
    }
  }, [selectedLapNumber, effectiveReplayLap, sessionData?.isLive])

  // keyboard arrows for lap stepping
  useEffect(()=>{
    const h2 = (e: KeyboardEvent)=>{
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key==="ArrowLeft") setReplayLap(v=> Math.max(1, (v ?? currentLap)-1))
      if (e.key==="ArrowRight") setReplayLap(v=> Math.min(totalLaps, (v ?? currentLap)+1))
    }
    window.addEventListener("keydown", h2); return ()=> window.removeEventListener("keydown",h2)
  }, [currentLap, totalLaps])

  // auto-play
  useEffect(()=>{
    if (!isPlaying) return
    const id = setInterval(()=> {
      setReplayLap(v=>{
        const cur = v ?? currentLap
        if (cur >= totalLaps) { setIsPlaying(false); return cur }
        return cur+1
      })
    }, 1000 / replaySpeed)
    return ()=> clearInterval(id)
  }, [isPlaying, replaySpeed, currentLap, totalLaps])

  const lapsForDriver = useMemo(()=>{
    if (!sessionData || effectiveSelectedDriver==null) return []
    return sessionData.laps.filter(l=>l.driverNumber===effectiveSelectedDriver).sort((a,b)=>a.lapNumber-b.lapNumber)
  }, [sessionData, effectiveSelectedDriver])

  const currentLapData = useMemo(()=>{
    if (!selectedLapNumber) return selectedRow?.lastLap ?? null
    return lapsForDriver.find(l=>l.lapNumber===selectedLapNumber) ?? selectedRow?.lastLap ?? null
  }, [selectedLapNumber, lapsForDriver, selectedRow])

  if (loading && !sessionData) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-8">
        <div className="w-full max-w-md panel rounded-lg p-8 text-center">
          <div className="text-xs font-mono tracking-[0.2em] text-zinc-500">CONNECTING TO RACE CONTROL...</div>
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 bg-[#e10600] animate-pulse" />
          </div>
          <div className="mt-3 text-xs font-mono text-zinc-600">OpenF1 • 2023→2026 • Polling 5s</div>
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
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        dataSourceMode={dataSourceMode}
        setDataSourceMode={setDataSourceMode}
        onBroadcast={()=>setBroadcast(v=>!v)}
        isBroadcast={broadcast}
      />

      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0b]/50">
        <RaceControls active={view} onChange={setView} />
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10"><span className="w-2 h-2 rounded-full bg-[#e10600]"/> FASTEST LAP {fastest ? `${fastest.driver.abbreviation} ${formatLapTime(fastest.bestLap?.lapDuration)}` : "—"}</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-500">DRS <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">ENABLED</span></span>
          {backendOk===false && <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold tracking-widest text-[10px]">BACKEND OFFLINE — OpenF1 direct</span>}
          {backendOk && <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold tracking-widest text-[10px]">BACKEND ● FastF1 ready</span>}
          {sessionData?.dataSource==="demo" && <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold tracking-widest text-[10px]">DEMO MODE</span>}
          {sessionData?.status==="offline" && <span className="px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold tracking-widest text-[10px]">OFFLINE • DEMO FALLBACK</span>}
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f0f12] border border-white/10">
          {(["LIVE","HISTORICAL","DEMO"] as const).map(m=>(
            <button key={m} onClick={()=>setDataMode(m)} className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-widest ${dataMode===m?"bg-white text-black":"text-zinc-500 hover:text-zinc-300"}`}>{m}</button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-zinc-600 self-center hidden sm:inline">OpenF1 → live heartbeat • FastF1 → deep analysis brain • Normalized API</span>
      </div>

      {dataMode==="HISTORICAL" && (
        <div className="px-4 lg:px-6 pt-3 space-y-2">
          <HistoricalBar year={hist.year} gp={hist.gp} session={hist.session} onChange={setHist} />
          {histLaps && (
            <div className="panel rounded-lg p-3">
              <div className="text-[11px] font-mono tracking-widest text-zinc-500">FastF1 HISTORICAL LAPS • {hist.gp} {hist.session} {hist.year}</div>
              <div className="mt-1 text-[11px] font-mono text-zinc-500">
                {Array.isArray(histLaps) && histLaps.length ? `${histLaps.length} laps via FastF1 cache (normalized)` : (histLaps as any).length===0 ? "No laps — try another GP/session or run pip install fastf1 + backend" : "Loading…"}
                {Array.isArray(histLaps) && histLaps.length>0 && (
                  <span> • Fastest {(histLaps as any[]).filter((l:any)=>l.lap_time).sort((a:any,b:any)=>a.lap_time-b.lap_time)[0]?.lap_time?.toFixed(3)}s • <button onClick={()=>navigator.clipboard.writeText(JSON.stringify((histLaps as any[]).slice(0,2),null,2))} className="underline hover:text-zinc-300">copy 2</button> • <button onClick={()=>{
                    const rows = histLaps as any[]
                    if(!rows.length) return
                    const csv = "driver,lap,time\n" + rows.map((l:any)=> l.driver_number + "," + l.lap_number + "," + l.lap_time).join("\n")
                    const blob=new Blob([csv],{type:"text/csv"})
                    const url=URL.createObjectURL(blob)
                    const a=document.createElement("a")
                    a.href=url
                    a.download= hist.gp + "-" + hist.session + "-" + hist.year + ".csv"
                    a.click()
                  }} className="underline hover:text-zinc-300">CSV</button></span>
                )}
              </div>
              {Array.isArray(histLaps) && histLaps.length>0 && (
                <div className="mt-2 max-h-40 overflow-auto text-[11px] font-mono">
                  <div className="grid grid-cols-5 gap-2 text-zinc-600 border-b border-white/5 pb-1 sticky top-0 bg-[#141417]"><span>Driver</span><span>Lap</span><span>Time</span><span>Sectors</span><span>Tyre</span></div>
                  {histLaps.slice(0,30).map((l:any,i:number)=>(
                    <div key={i} className="grid grid-cols-5 gap-2 py-0.5 border-b border-white/[0.03] text-zinc-400"><span>{l.driver_number}</span><span>{l.lap_number}</span><span>{l.lap_time?`${Math.floor(l.lap_time/60)}:${(l.lap_time%60).toFixed(3).padStart(6,"0")}`:"—"}</span><span>{[l.sector_1,l.sector_2,l.sector_3].filter(Boolean).map((s:any)=>s.toFixed(2)).join(" / ")||"—"}</span><span>{l.compound||"—"} {l.tyre_age!=null?`·${l.tyre_age}`:""}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Replay bar — fully view old races lap-by-lap */}
      <div className="px-4 lg:px-6 pt-3">
        <ReplayBar
          currentLap={currentLap}
          totalLaps={totalLaps}
          replayLap={effectiveReplayLap}
          onScrub={(lap)=>{ setReplayLap(lap); setSelectedLapNumber(lap) }}
          isPlaying={isPlaying}
          onPlayPause={()=>setIsPlaying(v=>!v)}
          speed={replaySpeed}
          onSpeedChange={setReplaySpeed}
        />
      </div>

      <main className={`px-4 lg:px-6 py-4 lg:py-6 max-w-[1920px] mx-auto ${broadcast ? "max-w-none" : ""}`}>
        {view==="TIMING" && (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <div className="col-span-12 lg:col-span-8 xl:col-span-8">
              <TimingTower rows={timingRows} selected={effectiveSelectedDriver} onSelect={(n)=>{
                if (compareDriver!=null) {
                  if (n===compareDriver) setCompareDriver(null)
                  else if (n===effectiveSelectedDriver) setCompareDriver(null)
                  else setCompareDriver(n)
                } else setSelectedDriver(n)
              }} />
            </div>

            <div className="col-span-12 lg:col-span-4 xl:col-span-4 space-y-4">
              <TrackStatus weather={sessionData?.weather ?? null} raceControl={sessionData?.raceControl ?? []} lap={currentLap} totalLaps={totalLaps} />
              {selectedRow && (
                <LapDelta
                  driverAbbr={selectedRow.driver.abbreviation}
                  laps={lapsForDriver}
                  current={currentLapData}
                  best={selectedRow.bestLap}
                  sessionBest={sessionFastest}
                  selectedLapNumber={selectedLapNumber}
                  onSelectLap={setSelectedLapNumber}
                  sectorDeltas={currentLapData && selectedRow.bestLap ? [
                    Number(((currentLapData.durationSector1 ?? 0) - (selectedRow.bestLap.durationSector1 ?? 0)).toFixed(3)),
                    Number(((currentLapData.durationSector2 ?? 0) - (selectedRow.bestLap.durationSector2 ?? 0)).toFixed(3)),
                    Number(((currentLapData.durationSector3 ?? 0) - (selectedRow.bestLap.durationSector3 ?? 0)).toFixed(3)),
                  ] : undefined}
                />
              )}
            </div>

            <div className="col-span-12 grid grid-cols-12 gap-4 lg:gap-6">
              <div className="col-span-12 lg:col-span-7">
                <LapGraph
                  laps={sessionData?.laps.filter(l=>l.driverNumber===effectiveSelectedDriver) ?? []}
                  compareLaps={compareDriver ? sessionData?.laps.filter(l=>l.driverNumber===compareDriver) : undefined}
                  driverAbbr={selectedRow?.driver.abbreviation ?? "—"}
                  compareAbbr={compareRow?.driver.abbreviation}
                  selectedLap={selectedLapNumber}
                  onSelectLap={setSelectedLapNumber}
                />
              </div>
              <div className="col-span-12 lg:col-span-5">
                {compareRow && selectedRow ? (
                  <Comparison a={selectedRow} b={compareRow} onClose={()=>setCompareDriver(null)} />
                ) : (
                  <DriverDetail row={selectedRow} onClose={()=>setSelectedDriver(timingRows[0]?.driver.driverNumber ?? null)} onCompare={()=>{
                    const other = timingRows.find(r=>r.driver.driverNumber!==effectiveSelectedDriver)
                    if (other) setCompareDriver(other.driver.driverNumber)
                  }} />
                )}
              </div>
            </div>

            <div className="col-span-12">
              <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={effectiveSelectedDriver} />
            </div>
          </div>
        )}

        {view==="TELEMETRY" && (
          <div className="space-y-4">
            <div className="panel rounded-lg p-2 flex gap-1.5 overflow-x-auto">
              {timingRows.map(r=>(
                <button key={r.driver.driverNumber} onClick={()=>setSelectedDriver(r.driver.driverNumber)} className={`shrink-0 px-2.5 py-1.5 rounded text-xs font-mono font-bold border flex items-center gap-1.5 ${effectiveSelectedDriver===r.driver.driverNumber ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"}`}>
                  <span className="w-2 h-2 rounded-full" style={{background:r.driver.teamColor}} />{r.driver.abbreviation} <span className="text-[10px] opacity-60">P{r.position===99?"—":r.position}</span>
                </button>
              ))}
              {!timingRows.length && <span className="text-xs font-mono text-zinc-600 px-2">No drivers</span>}
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <LapGraph laps={sessionData?.laps.filter(l=>l.driverNumber===effectiveSelectedDriver) ?? []} driverAbbr={selectedRow?.driver.abbreviation ?? "—"} selectedLap={selectedLapNumber} onSelectLap={setSelectedLapNumber} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <DriverDetail row={selectedRow ? {...selectedRow, lastLap: currentLapData, bestLap: selectedRow.bestLap } : null} onClose={()=>setCompareDriver(null)} />
                <div className="panel rounded-lg p-4 mt-4">
                  <div className="text-xs font-mono tracking-widest text-zinc-500">TELEMETRY STREAM</div>
                  <div className="text-xs font-mono text-zinc-600 mt-2">Browse laps via graph or delta picker. Older laps are accessible via brush/list. OpenF1 car_data polled separately when live. Select driver above — tower is in TIMING tab.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view==="STRATEGY" && (
          <div className="space-y-6">
            <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={effectiveSelectedDriver} />
            <div className="panel rounded-lg p-4">
              <div className="text-xs font-mono tracking-widest text-zinc-500">PIT WINDOW</div>
              <div className="mt-2 text-sm font-mono text-zinc-300">Strategy view shows stint boundaries and compounds. Click any stint for details. Pit detection via lap_duration spikes and is_pit_out_lap flag.</div>
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
