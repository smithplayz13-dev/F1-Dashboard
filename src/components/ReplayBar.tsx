import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from "lucide-react"

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
  currentLap: number
  totalLaps: number
  replayLap: number
  onScrub: (lap:number)=>void
  isPlaying: boolean
  onPlayPause: ()=>void
  speed: number
  onSpeedChange: (s:number)=>void
}) {
  const pct = totalLaps>1 ? ((replayLap-1)/(totalLaps-1))*100 : 0
  const isLive = replayLap === totalLaps

  return (
    <div className="panel rounded-lg px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">REPLAY • LAP-BY-LAP</span>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className={`px-2 py-0.5 rounded font-bold border ${isLive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
            {isLive ? "LIVE VIEW" : `REPLAY LAP ${replayLap}/${totalLaps}`}
          </span>
          <span className="text-zinc-600 hidden sm:inline">Old races: scrub to any lap</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={()=>onScrub(1)} className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10" title="First lap"><Rewind className="w-4 h-4" /></button>
        <button onClick={()=>onScrub(Math.max(1, replayLap-1))} className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10" title="Prev lap"><SkipBack className="w-4 h-4" /></button>
        <button onClick={onPlayPause} className={`px-3 py-1.5 rounded font-mono font-bold text-xs flex items-center gap-1.5 border ${isPlaying?"bg-[#e10600] text-white border-[#e10600]":"bg-white text-black border-white"}`}>
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {isPlaying?"PAUSE":"PLAY"}
        </button>
        <button onClick={()=>onScrub(Math.min(totalLaps, replayLap+1))} className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10" title="Next lap"><SkipForward className="w-4 h-4" /></button>
        <button onClick={()=>onScrub(totalLaps)} className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10" title="Last lap"><FastForward className="w-4 h-4" /></button>

        <div className="flex-1 relative mx-2">
          <input
            type="range"
            min={1}
            max={totalLaps}
            value={replayLap}
            onChange={e=>onScrub(Number(e.target.value))}
            className="w-full accent-[#e10600] h-1"
          />
          <div className="absolute -top-1 left-0 right-0 h-1 pointer-events-none">
            <div className="h-1 bg-[#e10600]/30 rounded" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
            <span>1</span><span>{Math.floor(totalLaps/2)}</span><span>{totalLaps}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {[0.5,1,2,4].map(s=>(
            <button key={s} onClick={()=>onSpeedChange(s)} className={`px-1.5 py-1 rounded text-[11px] font-mono font-bold border ${speed===s?"bg-white text-black border-white":"bg-transparent border-white/10 text-zinc-500"}`}>{s}x</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
        <span>Current lap <span className="text-white font-bold">{currentLap}</span> • Replay <span className="text-white font-bold">{replayLap}</span> • Use ← → or slider • Play auto-steps</span>
        <button onClick={()=>onScrub(currentLap)} className="ml-auto px-2 py-1 rounded bg-white/10 border border-white/10 text-xs hover:bg-white/15">GO LIVE</button>
      </div>
    </div>
  )
}
