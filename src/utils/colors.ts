// 2026 grid team colors — recognizable, muted accents
export const TEAM_COLORS: Record<string, string> = {
  "McLaren": "#FF8000",
  "Red Bull Racing": "#0600EF",
  "Red Bull": "#0600EF",
  "Ferrari": "#DC0000",
  "Mercedes": "#00D2BE",
  "Aston Martin": "#006F62",
  "Alpine": "#0090FF",
  "Williams": "#005AFF",
  "RB": "#6692FF",
  "Racing Bulls": "#6692FF",
  "Visa Cash App RB": "#6692FF",
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252",
  "Haas F1 Team": "#B6BABD",
  "Haas": "#B6BABD",
}

export function teamColor(teamName: string): string {
  if (!teamName) return "#6b7280"
  if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName]
  // fuzzy match — prefer longest key first to avoid "Haas" vs "Haas F1 Team" collision
  const sorted = Object.keys(TEAM_COLORS).sort((a,b)=>b.length-a.length)
  const k = sorted.find(k => teamName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(teamName.toLowerCase().split(" ")[0]))
  return k ? TEAM_COLORS[k] : "#6b7280"
}

export const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#ff2d2d",
  MEDIUM: "#facc15",
  HARD: "#e5e7eb",
  INTERMEDIATE: "#22c55e",
  WET: "#3b82f6",
  UNKNOWN: "#6b7280",
}

export const COMPOUND_LABEL: Record<string, string> = {
  SOFT: "SOFT",
  MEDIUM: "MED",
  HARD: "HARD",
  INTERMEDIATE: "INT",
  WET: "WET",
  UNKNOWN: "—",
}

export function compoundDot(compound: string) {
  const c = compound as keyof typeof COMPOUND_COLOR
  return COMPOUND_COLOR[c] ?? COMPOUND_COLOR.UNKNOWN
}
