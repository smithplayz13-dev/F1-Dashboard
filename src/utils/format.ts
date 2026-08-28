export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const secStr = s.toFixed(3).padStart(6, "0")
  return m > 0 ? `${m}:${secStr}` : secStr
}

export function formatGap(gap: string | null): string {
  if (!gap) return "—"
  if (gap === "—" || gap === "") return "—"
  return gap
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(3)}`
}

export function lapDeltaColor(delta: number): string {
  if (Math.abs(delta) < 0.001) return "text-zinc-400"
  return delta < 0 ? "text-emerald-400" : "text-red-400"
}

export function secondsToMs(s: number) { return s * 1000 }

export function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 1000) return "now"
  if (diff < 60000) return `${(diff/1000).toFixed(1)}s ago`
  const m = Math.floor(diff/60000)
  const s = Math.floor((diff % 60000)/1000)
  return `${m}m ${s}s ago`
}
