export type ViewTab = "TIMING" | "TELEMETRY" | "STRATEGY"

export default function RaceControls({ active, onChange }: { active: ViewTab, onChange:(v:ViewTab)=>void }) {
  const tabs: ViewTab[] = ["TIMING","TELEMETRY","STRATEGY"]
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f0f12] border border-white/10 w-fit">
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} className={`px-4 py-1.5 rounded text-xs font-mono font-bold tracking-widest ${active===t ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}>{t}</button>
      ))}
      <span className="hidden sm:inline-flex ml-2 text-[10px] font-mono tracking-widest text-zinc-600 border-l border-white/10 pl-3">LIVE • REPLAY active via bar</span>
    </div>
  )
}
