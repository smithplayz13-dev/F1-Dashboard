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
  "Haas F1 Team": "#FFFFFF",
  "Haas": "#B6BABD",
}

export function teamColor(teamName: string): string {
  if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName]
  // fuzzy match
  const k = Object.keys(TEAM_COLORS).find(k => teamName.toLowerCase().includes(k.toLowerCase().split(" ")[0]))
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
