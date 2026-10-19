import { useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Radio } from "lucide-react";
import { magnetic, tickPop } from "../lib/anime";

export default function ReplayBar({
  currentLap,
  totalLaps,
  replayLap,
  onScrub,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange,
}: {
  currentLap: number;
  totalLaps: number;
  replayLap: number;
  onScrub: (lap: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}) {
  const pct = totalLaps > 1 ? ((replayLap - 1) / (totalLaps - 1)) * 100 : 0;
  const isLive = replayLap === totalLaps;
  const lapNumRef = useRef<HTMLSpanElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (playRef.current) {
      const off = magnetic(playRef.current, 0.25);
      return off;
    }
  }, []);

  useEffect(() => {
    if (lapNumRef.current) tickPop(lapNumRef.current);
  }, [replayLap]);

  return (
    <div className="panel panel-hover rounded-2xl px-4 py-3.5 space-y-3" data-scroll>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="text-[11px] font-mono font-bold tracking-[0.24em] text-zinc-300">REPLAY DECK</span>
          <span className="hidden sm:inline text-[11px] font-mono text-zinc-600">scrub any lap of the race</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] tracking-widest border tabular-nums ${
              isLive
                ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/25"
                : "bg-amber-400/10 text-amber-300 border-amber-400/25"
            }`}
          >
            {isLive ? (
              <span className="inline-flex items-center gap-1.5"><Radio className="w-3 h-3" /> LIVE EDGE</span>
            ) : (
              <span ref={lapNumRef} className="inline-block">LAP {replayLap}/{totalLaps}</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onScrub(1)} className="mag-btn p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-zinc-300" title="First lap">
          <Rewind className="w-4 h-4" />
        </button>
        <button onClick={() => onScrub(Math.max(1, replayLap - 1))} className="mag-btn p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-zinc-300" title="Prev lap">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          ref={playRef}
          onClick={onPlayPause}
          className={`mag-btn px-5 py-2 rounded-xl font-mono font-bold text-xs tracking-widest flex items-center gap-2 border transition ${
            isPlaying
              ? "bg-[#e10600] text-white border-[#e10600] shadow-[0_8px_28px_rgba(225,6,0,0.45)]"
              : "bg-white text-black border-white"
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "PAUSE" : "PLAY"}
        </button>
        <button onClick={() => onScrub(Math.min(totalLaps, replayLap + 1))} className="mag-btn p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-zinc-300" title="Next lap">
          <SkipForward className="w-4 h-4" />
        </button>
        <button onClick={() => onScrub(totalLaps)} className="mag-btn p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-zinc-300" title="Last lap">
          <FastForward className="w-4 h-4" />
        </button>

        <div className="flex-1 mx-2 min-w-[120px]">
          <input
            type="range"
            min={1}
            max={totalLaps}
            value={replayLap}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="replay-range w-full"
            style={{ ["--fill" as any]: `${pct}%` }}
            aria-label="Replay lap scrubber"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1 tabular-nums">
            <span>L1</span>
            <span>L{Math.floor(totalLaps / 2)}</span>
            <span>L{totalLaps}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border tabular-nums transition ${
                speed === s ? "bg-white text-black border-white" : "bg-transparent border-white/10 text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
        <span className="tabular-nums">
          Live <span className="text-zinc-200 font-bold">{currentLap}</span> · Viewing{" "}
          <span className="text-zinc-200 font-bold">{replayLap}</span> · ← → steps laps
        </span>
        <button
          onClick={() => onScrub(currentLap)}
          className="mag-btn ml-auto px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs hover:bg-[#e10600] hover:border-[#e10600] hover:text-white transition font-bold tracking-widest"
        >
          GO LIVE
        </button>
      </div>
    </div>
  );
}
