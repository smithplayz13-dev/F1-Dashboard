import { useEffect, useRef } from "react";
import { Activity, Radio, Clock, Expand, Database } from "lucide-react";
import { timeAgo } from "../utils/format";
import { entrance, magnetic, tickPop } from "../lib/anime";
import type { Session } from "../types";

interface Props {
  session: Session | null;
  status: string;
  isLive: boolean;
  lastUpdated: string | null;
  totalLaps?: number;
  currentLap?: number;
  sessions: Session[];
  selectedKey?: number;
  onSelectSession: (k: number) => void;
  selectedYear: number;
  onSelectYear: (y: number) => void;
  dataSourceMode: string;
  setDataSourceMode: (m: any) => void;
  onBroadcast: () => void;
  isBroadcast: boolean;
}

export default function Header(props: Props) {
  const {
    session, status, isLive, lastUpdated, totalLaps = 57, currentLap = 42,
    sessions, selectedKey, onSelectSession, selectedYear, onSelectYear,
    dataSourceMode, setDataSourceMode, onBroadcast, isBroadcast,
  } = props;
  const years = [2026, 2025, 2024, 2023];
  const filtered = sessions.filter((s) => s.year === selectedYear);
  const show = filtered.length ? filtered : sessions;

  const rootRef = useRef<HTMLElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const magnetRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (rootRef.current) entrance(rootRef.current.querySelectorAll("[data-head]") as any);
    const cleanups = magnetRefs.current.filter(Boolean).map((el) => magnetic(el as HTMLElement, 0.18));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if (lapRef.current) tickPop(lapRef.current);
  }, [currentLap]);

  return (
    <header ref={rootRef} className="sticky top-3 z-40 px-4 lg:px-6">
      {/* floating glass pill nav — gpt-taste premium nav */}
      <div className="glass-pill rounded-2xl px-4 lg:px-5 py-3 flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-4 min-w-0" data-head>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff2e2e] to-[#a60400] flex items-center justify-center shadow-[0_0_28px_rgba(225,6,0,0.5)]">
              <Activity className="w-5 h-5 text-white" />
              {isLive && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0e0e13] animate-pulse" />}
            </div>
            <div>
              <div className="font-display font-bold text-[16px] tracking-[0.14em] leading-none text-white">
                F1 <span className="text-[#ff4d4d]">RACE CONTROL</span>
              </div>
              <div className="text-[10px] tracking-[0.28em] text-zinc-500 font-mono mt-1">
                LIVE TIMING · PIT WALL
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-9 w-px bg-white/10" />

          <div className="hidden md:block min-w-0 max-w-[340px]">
            <div className="text-xs font-mono text-zinc-300 flex items-center gap-2 truncate">
              <span className="truncate font-semibold">
                {session ? `${session.year} · ${session.location}` : "No session"}
              </span>
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-widest border ${
                  status === "live"
                    ? "border-emerald-400/30 text-emerald-300 bg-emerald-400/10"
                    : status === "ended"
                      ? "border-white/10 text-zinc-400 bg-white/5"
                      : "border-amber-400/30 text-amber-300 bg-amber-400/10"
                }`}
              >
                {status === "live" ? "● LIVE" : status === "ended" ? "ENDED" : status.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
              {session?.sessionName ?? "—"} · {session?.circuitShortName ?? "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" data-head>
          <div className="hidden sm:flex items-center gap-2 pl-3 pr-1 py-1 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500">LAP</span>
            <span ref={lapRef} className="inline-block bg-white text-black px-2.5 py-1 rounded-lg font-display font-bold text-sm leading-none tabular-nums">
              {currentLap}<span className="text-zinc-500 font-mono text-[11px]">/{totalLaps}</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono px-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className={isLive ? "text-emerald-300" : "text-zinc-500"}>
              {lastUpdated ? timeAgo(lastUpdated) : "—"}
            </span>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => onSelectYear(Number(e.target.value))}
            className="hidden md:block bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-300 hover:bg-white/10 transition"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-zinc-900">{y}</option>
            ))}
          </select>

          <select
            value={selectedKey ?? ""}
            onChange={(e) => onSelectSession(Number(e.target.value))}
            className="hidden xl:block bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-300 max-w-[220px] hover:bg-white/10 transition"
          >
            {show.slice(0, 60).map((s) => (
              <option key={s.sessionKey} value={s.sessionKey} className="bg-zinc-900">
                {s.circuitShortName} — {s.sessionName}
              </option>
            ))}
            {!show.length && <option className="bg-zinc-900">Loading…</option>}
          </select>

          <div className="hidden md:flex items-center gap-0.5 bg-white/[0.04] border border-white/10 rounded-lg p-0.5">
            {([["auto", "AUTO"], ["openf1", "OPENF1"], ["demo", "DEMO"]] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setDataSourceMode(v)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-widest transition ${
                  dataSourceMode === v ? "bg-white text-black shadow" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
            <Database className="w-3 h-3 mx-1.5 text-zinc-600" />
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono font-bold tracking-widest ${
              isLive
                ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                : "bg-white/[0.04] border-white/10 text-zinc-400"
            }`}
          >
            <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "LIVE" : "REPLAY"}
          </div>

          <button
            ref={(el) => { magnetRefs.current[0] = el; }}
            onClick={onBroadcast}
            className={`mag-btn hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-widest ${
              isBroadcast ? "bg-white text-black border-white" : "bg-[#e10600] border-[#e10600] text-white shadow-[0_8px_24px_rgba(225,6,0,0.4)]"
            }`}
          >
            <Expand className="w-3.5 h-3.5" /> {isBroadcast ? "EXIT" : "AIR"}
          </button>
        </div>
      </div>

      <div className="md:hidden mt-2 glass-pill rounded-xl px-4 py-2 flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-400 truncate">{session?.circuitShortName ?? "—"} · {session?.sessionName}</span>
        <span className="text-white font-bold tabular-nums">{currentLap}/{totalLaps}</span>
      </div>
    </header>
  );
}
