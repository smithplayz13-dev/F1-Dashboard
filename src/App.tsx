import { useState, useEffect, useMemo, useRef } from "react";
import Header from "./components/Header";
import TimingTower from "./components/TimingTower";
import TrackStatus from "./components/TrackStatus";
import LapDelta from "./components/LapDelta";
import LapGraph from "./components/LapGraph";
import TireStrategy from "./components/TireStrategy";
import DriverDetail from "./components/DriverDetail";
import Comparison from "./components/Comparison";
import RaceControls from "./components/RaceControls";
import type { ViewTab } from "./components/RaceControls";
import { useRaceData } from "./hooks/useRaceData";
import { buildTimingRows, buildTimingRowsAtLap } from "./services/raceData";
import { formatLapTime } from "./utils/format";
import ReplayBar from "./components/ReplayBar";
import HistoricalBar from "./components/HistoricalBar";
import TrackMap from "./components/TrackMap";
import TelemetryTrace from "./components/TelemetryTrace";
import AnimeReveal from "./components/AnimeReveal";
import PulseGridBackground from "./components/PulseGridBackground";
import SkewTitle from "./components/SkewTitle";
import { entrance, scrollReveal } from "./lib/anime";
import { backend } from "./services/backend";
import LandingPage from "./landing/LandingPage";
import { useHashRoute } from "./landing/route";

function Dashboard() {
  const { sessionData, sessions, loading, error, selectedSessionKey, setSelectedSessionKey, selectedYear, setSelectedYear, load, dataSourceMode, setDataSourceMode } = useRaceData();
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [compareDriver, setCompareDriver] = useState<number | null>(null);
  const [selectedLapNumber, setSelectedLapNumber] = useState<number | null>(null);
  const [view, setView] = useState<ViewTab>("TIMING");
  const [broadcast, setBroadcast] = useState(false);
  const [replayLap, setReplayLap] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [dataMode, setDataMode] = useState<"LIVE" | "HISTORICAL" | "DEMO">("LIVE");
  const [hist, setHist] = useState({ year: 2024, gp: "Italian Grand Prix", session: "R" });
  const [histLaps, setHistLaps] = useState<any[] | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const prevPosRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key.toLowerCase() === "f") setBroadcast((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { backend.health().then((h) => setBackendOk(!!h)).catch(() => setBackendOk(false)); }, []);
  useEffect(() => {
    if (dataMode === "DEMO") setDataSourceMode("demo");
    else if (dataMode === "LIVE") setDataSourceMode("auto");
    else setDataSourceMode("auto");
  }, [dataMode, setDataSourceMode]);

  useEffect(() => {
    if (dataMode !== "HISTORICAL") { setHistLaps(null); return; }
    setHistLaps(null);
    backend.getFastF1Laps(hist.year, hist.gp, hist.session).then(setHistLaps).catch(() => setHistLaps([]));
  }, [dataMode, hist.year, hist.gp, hist.session]);

  const currentLap = useMemo(() => {
    if (!sessionData?.laps.length) return 1;
    return Math.max(...sessionData.laps.map((l) => l.lapNumber), 1);
  }, [sessionData]);

  const totalLaps = useMemo(() => {
    if (!sessionData?.laps.length) return 57;
    const max = Math.max(...sessionData.laps.map((l) => l.lapNumber));
    return Math.max(max, 57);
  }, [sessionData]);

  const effectiveReplayLap = replayLap ?? currentLap;

  const timingRows = useMemo(() => {
    if (!sessionData) return [];
    const useReplay = replayLap != null && replayLap !== currentLap && !sessionData.isLive;
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
        });
    const m = new Map<number, number>();
    for (const r of rows) if (r.position !== 99) m.set(r.driver.driverNumber, r.position);
    prevPosRef.current = m;
    return rows;
  }, [sessionData, currentLap, replayLap, effectiveReplayLap]);

  const selectedRow = timingRows.find((r) => r.driver.driverNumber === selectedDriver) ?? timingRows[0] ?? null;
  const compareRow = timingRows.find((r) => r.driver.driverNumber === compareDriver) ?? null;
  const fastest = useMemo(() => {
    const valid = timingRows.filter((r) => r.bestLap?.lapDuration != null && r.bestLap.lapDuration > 0 && !r.bestLap.isPitOutLap).map((r) => r.bestLap!.lapDuration!);
    if (!valid.length) return null;
    const min = Math.min(...valid);
    return timingRows.find((r) => r.bestLap?.lapDuration != null && Math.abs(r.bestLap.lapDuration - min) < 0.001) ?? null;
  }, [timingRows]);

  const sessionFastest = useMemo(() => {
    const valid = (sessionData?.laps ?? []).filter((l) => l.lapDuration != null && l.lapDuration > 0 && !l.isPitOutLap);
    if (!valid.length) return null;
    return valid.sort((a, b) => a.lapDuration! - b.lapDuration!)[0];
  }, [sessionData]);

  const effectiveSelectedDriver = selectedDriver ?? timingRows[0]?.driver.driverNumber ?? null;
  useEffect(() => {
    if (selectedDriver == null && timingRows.length) setSelectedDriver(timingRows[0].driver.driverNumber);
  }, [timingRows, selectedDriver]);

  useEffect(() => {
    if (!sessionData || effectiveSelectedDriver == null) return;
    const laps = sessionData.laps.filter((l) => l.driverNumber === effectiveSelectedDriver && l.lapDuration != null && l.lapDuration > 0).sort((a, b) => a.lapNumber - b.lapNumber);
    if (laps.length && (selectedLapNumber == null || !laps.some((l) => l.lapNumber === selectedLapNumber))) {
      setSelectedLapNumber(laps[laps.length - 1].lapNumber);
    }
  }, [effectiveSelectedDriver, sessionData, selectedLapNumber]);

  useEffect(() => {
    if (sessionData?.session) {
      setReplayLap(null);
      setIsPlaying(false);
    }
  }, [sessionData?.session?.sessionKey]);

  useEffect(() => {
    if (selectedLapNumber != null && selectedLapNumber !== effectiveReplayLap && !sessionData?.isLive) {
      setReplayLap(selectedLapNumber);
    }
  }, [selectedLapNumber, effectiveReplayLap, sessionData?.isLive]);

  useEffect(() => {
    const h2 = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowLeft") setReplayLap((v) => Math.max(1, (v ?? currentLap) - 1));
      if (e.key === "ArrowRight") setReplayLap((v) => Math.min(totalLaps, (v ?? currentLap) + 1));
    };
    window.addEventListener("keydown", h2);
    return () => window.removeEventListener("keydown", h2);
  }, [currentLap, totalLaps]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setReplayLap((v) => {
        const cur = v ?? currentLap;
        if (cur >= totalLaps) { setIsPlaying(false); return cur; }
        return cur + 1;
      });
    }, 1000 / replaySpeed);
    return () => clearInterval(id);
  }, [isPlaying, replaySpeed, currentLap, totalLaps]);

  const lapsForDriver = useMemo(() => {
    if (!sessionData || effectiveSelectedDriver == null) return [];
    return sessionData.laps.filter((l) => l.driverNumber === effectiveSelectedDriver).sort((a, b) => a.lapNumber - b.lapNumber);
  }, [sessionData, effectiveSelectedDriver]);

  const currentLapData = useMemo(() => {
    if (!selectedLapNumber) return selectedRow?.lastLap ?? null;
    return lapsForDriver.find((l) => l.lapNumber === selectedLapNumber) ?? selectedRow?.lastLap ?? null;
  }, [selectedLapNumber, lapsForDriver, selectedRow]);

  // page-load orchestration (once per screen) + scroll reveals for new nodes.
  // All targets are visible by default — motion is enhancement only.
  const hasData = !!sessionData;
  const enteredFor = useRef<string>("");
  useEffect(() => {
    const key = hasData ? "main" : "loading";
    if (enteredFor.current === key) return;
    enteredFor.current = key;
    entrance("[data-entrance]", 60);
  }, [hasData]);
  useEffect(() => {
    scrollReveal("[data-scroll]");
  }, [view, dataMode, hasData]);

  const tickerItems = useMemo(() => {
    const msgs = (sessionData?.raceControl ?? []).slice(-8).map((r) => r.message);
    const base = msgs.length ? msgs : ["Track live", "DRS enabled", "Timing heartbeat 5s", "FastF1 brain ready"];
    return [...base, ...base];
  }, [sessionData]);

  if (loading && !sessionData) {
    return (
      <div className="min-h-screen bg-[#08080b] carbon-sheen flex items-center justify-center p-8">
        <div className="w-full max-w-md panel rounded-2xl p-8 text-center" data-entrance>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff2e2e] to-[#a60400] flex items-center justify-center shadow-[0_0_40px_rgba(225,6,0,0.5)]">
            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
          <SkewTitle text="CONNECTING TO RACE CONTROL" className="block mt-5 text-xs font-mono font-bold tracking-[0.24em] text-zinc-300" />
          <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#e10600] to-[#ff6b6b] animate-pulse" />
          </div>
          <div className="mt-3 text-[11px] font-mono text-zinc-600">OpenF1 · 2023 → 2026 · Polling 5s</div>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-[#08080b] flex items-center justify-center p-8">
        <div className="panel rounded-2xl p-8 text-center max-w-md">
          <div className="text-sm font-mono font-bold tracking-[0.2em] text-red-400">DATA LINK OFFLINE</div>
          <div className="text-xs font-mono text-zinc-500 mt-2">{error}</div>
          <button onClick={() => load()} className="mag-btn mt-5 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-mono font-bold tracking-widest">
            RETRY LINK
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#08080b] text-zinc-100">
      {/* ambient layers */}
      <div className="fixed inset-0 bg-grid pointer-events-none" aria-hidden />
      <div className="fixed inset-0 carbon-sheen pointer-events-none" aria-hidden />

      <div className="relative">
        <Header
          session={sessionData?.session ?? null}
          status={sessionData?.status ?? "loading"}
          isLive={!!sessionData?.isLive}
          lastUpdated={sessionData?.lastUpdated ?? null}
          totalLaps={totalLaps}
          currentLap={currentLap}
          sessions={sessions}
          selectedKey={selectedSessionKey}
          onSelectSession={(k) => { setSelectedSessionKey(k); load(k); }}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          dataSourceMode={dataSourceMode}
          setDataSourceMode={setDataSourceMode}
          onBroadcast={() => setBroadcast((v) => !v)}
          isBroadcast={broadcast}
        />

        {/* cinematic hero strip — wide H1, max 2 lines */}
        {!broadcast && (
          <section className="relative px-4 lg:px-6 pt-6 pb-2 max-w-[1920px] mx-auto">
            <div className="relative panel rounded-3xl overflow-hidden">
              <PulseGridBackground />
              <div className="relative px-6 md:px-10 py-8 md:py-10">
                <h1 className="max-w-6xl w-full font-display font-bold tracking-tight text-white leading-[1.02]" style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.6rem)" }}>
                  <SkewTitle text="Every millisecond of the race," delay={80} />
                  <br />
                  <span className="text-zinc-400">rendered </span>
                  <span className="inline-block w-16 md:w-24 h-8 md:h-10 rounded-full align-middle mx-1 bg-cover bg-center border border-white/20 shadow-[0_0_30px_rgba(225,6,0,0.35)]" style={{ backgroundImage: "url(https://picsum.photos/seed/f1-night/400/160)", filter: "saturate(1.4) contrast(1.15)" }} />
                  <span className="text-[#ff4d4d]"> live.</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm md:text-[15px] text-zinc-400 leading-relaxed" data-entrance>
                  {sessionData?.session
                    ? `${sessionData.session.year} · ${sessionData.session.location} — ${sessionData.session.circuitShortName} · ${sessionData.session.sessionName}`
                    : "Pick a session above. Timing, telemetry and strategy stay in sync lap by lap."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-mono" data-entrance>
                  <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-[#e10600] shadow-[0_0_10px_rgba(225,6,0,0.9)]" />
                    FASTEST {fastest ? `${fastest.driver.abbreviation} ${formatLapTime(fastest.bestLap?.lapDuration)}` : "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-400">
                    DRS <span className="px-1.5 py-0.5 rounded-md bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 text-[10px] font-bold">ENABLED</span>
                  </span>
                  {backendOk === false && <span className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/25 font-bold tracking-widest text-[10px]">BACKEND OFFLINE — OpenF1 direct</span>}
                  {backendOk && <span className="px-2.5 py-1.5 rounded-xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 font-bold tracking-widest text-[10px]">BACKEND ● FastF1 ready</span>}
                  {sessionData?.dataSource === "demo" && <span className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/25 font-bold tracking-widest text-[10px]">DEMO MODE</span>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* race-control marquee ticker */}
        <div className="px-4 lg:px-6 max-w-[1920px] mx-auto">
          <div className="panel rounded-2xl overflow-hidden flex items-center" data-entrance>
            <span className="shrink-0 px-3 py-2 text-[10px] font-mono font-bold tracking-[0.2em] text-white bg-[#e10600]">RACE CONTROL</span>
            <div className="relative flex-1 overflow-hidden py-2">
              <div className="marquee-track gap-8 text-[11px] font-mono text-zinc-400">
                {tickerItems.map((m, i) => (
                  <span key={i} className="flex items-center gap-2 whitespace-nowrap px-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 pt-4 flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
          <RaceControls active={view} onChange={setView} />
          <div className="flex items-center gap-1 p-1 rounded-2xl glass-pill">
            {(["LIVE", "HISTORICAL", "DEMO"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setDataMode(m)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-[0.16em] transition-all ${
                  dataMode === m ? "bg-white text-black shadow" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {dataMode === "HISTORICAL" && (
          <div className="px-4 lg:px-6 pt-3 space-y-2 max-w-[1920px] mx-auto">
            <AnimeReveal>
              <HistoricalBar year={hist.year} gp={hist.gp} session={hist.session} onChange={setHist} />
            </AnimeReveal>
            {histLaps && (
              <div className="panel rounded-2xl p-4" data-scroll>
                <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-zinc-400">
                  FastF1 HISTORICAL LAPS · {hist.gp} {hist.session} {hist.year}
                </div>
                <div className="mt-1 text-[11px] font-mono text-zinc-500">
                  {Array.isArray(histLaps) && histLaps.length
                    ? `${histLaps.length} laps via FastF1 cache`
                    : (histLaps as any).length === 0
                      ? "No laps — try another GP/session"
                      : "Loading…"}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 lg:px-6 pt-4 max-w-[1920px] mx-auto">
          <ReplayBar
            currentLap={currentLap}
            totalLaps={totalLaps}
            replayLap={effectiveReplayLap}
            onScrub={(lap) => { setReplayLap(lap); setSelectedLapNumber(lap); }}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying((v) => !v)}
            speed={replaySpeed}
            onSpeedChange={setReplaySpeed}
          />
        </div>

        <div className={`px-4 lg:px-6 py-5 max-w-[1920px] mx-auto ${broadcast ? "max-w-none" : ""}`}>
          {view === "TIMING" && (
            <div className="grid grid-cols-12 gap-4 lg:gap-5 grid-flow-dense">
              <div className="col-span-12 lg:col-span-8" data-scroll>
                <TimingTower
                  rows={timingRows}
                  isLive={!!sessionData?.isLive}
                  selected={effectiveSelectedDriver}
                  onSelect={(n) => {
                    if (compareDriver != null) {
                      if (n === compareDriver) setCompareDriver(null);
                      else if (n === effectiveSelectedDriver) setCompareDriver(null);
                      else setCompareDriver(n);
                    } else setSelectedDriver(n);
                  }}
                />
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-4">
                <TrackStatus weather={sessionData?.weather ?? null} raceControl={sessionData?.raceControl ?? []} lap={currentLap} totalLaps={totalLaps} />
                <AnimeReveal delay={120}>
                  <TrackMap circuit={sessionData?.session?.circuitShortName ?? "Unknown"} />
                </AnimeReveal>
                {selectedRow && (
                  <AnimeReveal delay={180}>
                    <LapDelta
                      driverAbbr={selectedRow.driver.abbreviation}
                      laps={lapsForDriver}
                      current={currentLapData}
                      best={selectedRow.bestLap}
                      sessionBest={sessionFastest}
                      selectedLapNumber={selectedLapNumber}
                      onSelectLap={setSelectedLapNumber}
                      sectorDeltas={
                        currentLapData && selectedRow.bestLap
                          ? [
                              Number(((currentLapData.durationSector1 ?? 0) - (selectedRow.bestLap.durationSector1 ?? 0)).toFixed(3)),
                              Number(((currentLapData.durationSector2 ?? 0) - (selectedRow.bestLap.durationSector2 ?? 0)).toFixed(3)),
                              Number(((currentLapData.durationSector3 ?? 0) - (selectedRow.bestLap.durationSector3 ?? 0)).toFixed(3)),
                            ]
                          : undefined
                      }
                    />
                  </AnimeReveal>
                )}
              </div>

              <div className="col-span-12 lg:col-span-7" data-scroll>
                <LapGraph
                  laps={sessionData?.laps.filter((l) => l.driverNumber === effectiveSelectedDriver) ?? []}
                  compareLaps={compareDriver ? sessionData?.laps.filter((l) => l.driverNumber === compareDriver) : undefined}
                  driverAbbr={selectedRow?.driver.abbreviation ?? "—"}
                  compareAbbr={compareRow?.driver.abbreviation}
                  selectedLap={selectedLapNumber}
                  onSelectLap={setSelectedLapNumber}
                />
              </div>
              <div className="col-span-12 lg:col-span-5" data-scroll>
                {compareRow && selectedRow ? (
                  <Comparison a={selectedRow} b={compareRow} onClose={() => setCompareDriver(null)} />
                ) : (
                  <DriverDetail
                    row={selectedRow}
                    onClose={() => setSelectedDriver(timingRows[0]?.driver.driverNumber ?? null)}
                    onCompare={() => {
                      const other = timingRows.find((r) => r.driver.driverNumber !== effectiveSelectedDriver);
                      if (other) setCompareDriver(other.driver.driverNumber);
                    }}
                  />
                )}
              </div>

              <div className="col-span-12" data-scroll>
                <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={effectiveSelectedDriver} />
              </div>
            </div>
          )}

          {view === "TELEMETRY" && (
            <div className="space-y-4">
              <div className="panel rounded-2xl p-2 flex gap-1.5 overflow-x-auto" data-entrance>
                {timingRows.map((r) => (
                  <button
                    key={r.driver.driverNumber}
                    onClick={() => setSelectedDriver(r.driver.driverNumber)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition ${
                      effectiveSelectedDriver === r.driver.driverNumber
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: r.driver.teamColor }} />
                    {r.driver.abbreviation} <span className="text-[10px] opacity-60 tabular-nums">P{r.position === 99 ? "—" : r.position}</span>
                  </button>
                ))}
                {!timingRows.length && <span className="text-xs font-mono text-zinc-600 px-2">No drivers</span>}
              </div>
              <div className="grid grid-cols-12 gap-5 grid-flow-dense">
                <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div data-scroll>
                    <LapGraph laps={sessionData?.laps.filter((l) => l.driverNumber === effectiveSelectedDriver) ?? []} driverAbbr={selectedRow?.driver.abbreviation ?? "—"} selectedLap={selectedLapNumber} onSelectLap={setSelectedLapNumber} />
                  </div>
                  {dataMode === "HISTORICAL" && selectedRow && selectedLapNumber && (
                    <TelemetryTrace year={hist.year} gp={hist.gp} session={hist.session} driver={selectedRow.driver.abbreviation} lap={selectedLapNumber} compareDriver={compareRow?.driver.abbreviation} compareLap={compareRow ? selectedLapNumber : undefined} />
                  )}
                  {dataMode !== "HISTORICAL" && (
                    <div className="panel rounded-2xl p-4 text-xs font-mono text-zinc-500">
                      Switch to <span className="text-white font-bold">HISTORICAL</span> to load FastF1 speed / throttle / brake traces
                    </div>
                  )}
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-4">
                  <DriverDetail row={selectedRow ? { ...selectedRow, lastLap: currentLapData, bestLap: selectedRow.bestLap } : null} onClose={() => setCompareDriver(null)} />
                  <TrackMap circuit={sessionData?.session?.circuitShortName ?? "Unknown"} />
                </div>
              </div>
            </div>
          )}

          {view === "STRATEGY" && (
            <div className="space-y-5">
              <div data-scroll>
                <TireStrategy drivers={sessionData?.drivers ?? []} stints={sessionData?.stints ?? []} totalLaps={totalLaps} onSelectDriver={setSelectedDriver} selectedDriver={effectiveSelectedDriver} />
              </div>
              <div className="panel rounded-2xl p-5" data-scroll>
                <SkewTitle text="PIT WINDOW" className="text-xs font-mono font-bold tracking-[0.24em] text-zinc-300" />
                <p className="mt-2 text-sm font-mono text-zinc-400">
                  Stint boundaries and compounds. Select any stint for lap ranges. Pit detection via lap-time spikes and pit-out flags.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="px-4 lg:px-6 pb-8 max-w-[1920px] mx-auto">
          <div className="panel rounded-3xl px-6 py-6 flex flex-wrap items-center gap-4 justify-between overflow-hidden relative" data-scroll>
            <div>
              <div className="font-display font-bold text-xl md:text-2xl tracking-tight text-white">Built for the pit wall, not the couch.</div>
              <div className="text-xs font-mono text-zinc-500 mt-1 tracking-wider">OpenF1 heartbeat · FastF1 brain · Press F for broadcast</div>
            </div>
            <button
              onClick={() => setBroadcast((v) => !v)}
              className="mag-btn px-6 py-3 rounded-2xl bg-[#e10600] text-white text-xs font-mono font-bold tracking-[0.18em] shadow-[0_12px_40px_rgba(225,6,0,0.45)] hover:brightness-110 transition"
            >
              {broadcast ? "EXIT BROADCAST" : "ENTER BROADCAST →"}
            </button>
          </div>
          <div className="pt-4 flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-zinc-600">
            <span>RACE CONTROL · Poll 5s · Replay never fakes live</span>
            <span className="hidden sm:inline">© 2026 F1 LIVE TIMING</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

/**
 * Router: landing page at #/ (default), existing dashboard at #/dashboard.
 * Dashboard code above is untouched — only wrapped.
 */
export default function App() {
  const route = useHashRoute();
  if (route === "dashboard") return <Dashboard />;
  return <LandingPage />;
}
