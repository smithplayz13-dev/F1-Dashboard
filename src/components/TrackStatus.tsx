import { useEffect, useState } from "react";
import SkewTitle from "./SkewTitle";
import type { Weather, RaceControlMessage } from "../types";

function flagStyle(flag?: string) {
  switch (flag) {
    case "GREEN":
      return "bg-emerald-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)]";
    case "YELLOW":
      return "bg-yellow-300 text-black animate-pulse shadow-[0_0_24px_rgba(253,224,71,0.4)]";
    case "RED":
      return "bg-[#e10600] text-white animate-pulse shadow-[0_0_24px_rgba(225,6,0,0.6)]";
    case "CHEQUERED":
      return "bg-white text-black";
    default:
      return "bg-white/[0.05] text-zinc-300 border border-white/10";
  }
}

export default function TrackStatus({
  weather,
  raceControl,
  lap,
  totalLaps,
}: {
  weather: Weather | null;
  raceControl: RaceControlMessage[];
  lap: number;
  totalLaps: number;
}) {
  const [nowStr, setNowStr] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setNowStr(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...raceControl].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const latestFlag = [...sorted].reverse().find((r) => r.flag) ?? sorted[sorted.length - 1];
  const flag = latestFlag?.flag ?? null;
  const latestSC = [...sorted].reverse().find((r) => r.message.toLowerCase().includes("safety car"));
  const displayFlag = latestSC
    ? latestSC.message.toLowerCase().includes("virtual")
      ? "VIRTUAL SAFETY CAR"
      : "SAFETY CAR"
    : latestFlag?.flag
      ? `${latestFlag.flag} FLAG`
      : (latestFlag?.category?.toUpperCase() ?? "TRACK LIVE");

  return (
    <div className="panel panel-hover rounded-2xl p-4 space-y-3" data-scroll>
      <div className="flex items-center justify-between">
        <SkewTitle text="TRACK STATUS" className="text-[11px] font-mono font-bold tracking-[0.24em] text-zinc-300" />
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-500 tabular-nums">
          {raceControl.length} MSG
        </span>
      </div>

      <div className={`rounded-xl px-3 py-2.5 text-center font-display font-bold tracking-[0.18em] text-sm ${flagStyle(flag ?? undefined)}`}>
        {displayFlag}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/40 border border-white/[0.06] p-2.5 group hover:border-white/15 transition overflow-hidden">
          <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-500">LAP</div>
          <div className="font-display font-bold text-xl leading-none text-white tabular-nums mt-1 transition-transform duration-500 group-hover:scale-105 origin-left">
            {lap} <span className="text-zinc-500 text-sm">/ {totalLaps}</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e10600] to-[#ff6b6b] transition-all duration-700"
              style={{ width: `${Math.min(100, (lap / Math.max(1, totalLaps)) * 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl bg-black/40 border border-white/[0.06] p-2.5 hover:border-white/15 transition">
          <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-500">CLOCK</div>
          <div className="font-mono font-bold text-base text-white tabular-nums mt-1">{nowStr}</div>
          <div className="text-[10px] font-mono text-zinc-600 mt-1">Session time</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { k: "AIR", v: weather?.airTemperature != null ? `${weather.airTemperature}°` : "—" },
          { k: "TRACK", v: weather?.trackTemperature != null ? `${weather.trackTemperature}°` : "—" },
          { k: "WIND", v: weather?.windSpeed != null ? `${weather.windSpeed}` : "—" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-black/40 border border-white/[0.06] p-2 hover:bg-white/[0.04] transition group">
            <div className="text-[10px] font-mono tracking-[0.18em] text-zinc-500">{s.k}</div>
            <div className="font-mono font-bold text-white tabular-nums transition-transform duration-500 group-hover:scale-110">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 max-h-24 overflow-auto">
        {sorted.slice(-3).map((r, i) => (
          <div
            key={i}
            className="text-[11px] font-mono leading-snug px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-400 truncate hover:text-zinc-200 hover:border-white/15 transition"
            title={r.message}
          >
            {r.message}
          </div>
        ))}
        {!sorted.length && <div className="text-[11px] font-mono text-zinc-600">No race control messages yet</div>}
      </div>
    </div>
  );
}
