// Ergast (Jolpica) fallback — https://api.jolpi.ca/ergast/f1
// Used only when OpenF1 has no session or for historical enrichment
const JOLPICA = "https://api.jolpi.ca/ergast/f1"

export async function getErgastSchedule(year: number) {
  const res = await fetch(`${JOLPICA}/${year}.json`)
  if (!res.ok) throw new Error(`Ergast ${res.status}`)
  const j = await res.json()
  return j.MRData?.RaceTable?.Races ?? []
}

export async function getErgastResults(year: number, round: number) {
  const res = await fetch(`${JOLPICA}/${year}/${round}/results.json`)
  if (!res.ok) throw new Error(`Ergast ${res.status}`)
  const j = await res.json()
  return j.MRData?.RaceTable?.Races?.[0] ?? null
}
