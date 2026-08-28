import { useState } from "react"

export default function TrackMap({ circuit }: { circuit: string }) {
  const [hasGeometry] = useState(false) // OpenF1 position x/y not circuit geometry — hide rather than invent

  if (!hasGeometry) {
    return (
      <div className="panel rounded-lg p-4">
        <div className="text-[11px] font-mono tracking-[0.2em] text-zinc-500">TRACK MAP • {circuit.toUpperCase()}</div>
        <div className="mt-3 rounded border border-white/5 bg-[#0a0a0b] p-6 text-center">
          <div className="text-xs font-mono text-zinc-600">Circuit geometry unavailable</div>
          <div className="text-[11px] font-mono text-zinc-700 mt-1">Hide rather than invent — enable when accurate x/y → track mapping available</div>
          <div className="mt-3 text-[10px] font-mono text-zinc-600">DRS zones / sectors would appear here when data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel rounded-lg p-3">
      <div className="text-[11px] font-mono tracking-widest text-zinc-500">TRACK MAP</div>
      <svg viewBox="0 0 200 120" className="w-full h-32 mt-2">
        <path d="M20 60 Q50 20 100 30 T180 60 Q150 100 100 90 T20 60" fill="none" stroke="#e10600" strokeWidth="2" />
        <circle cx="20" cy="60" r="3" fill="#fff" /><text x="24" y="58" fontSize="6" fill="#aaa">S/F</text>
      </svg>
    </div>
  )
}
