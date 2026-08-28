// Centralized backend client — frontend never directly depends on FastF1
// Falls back to OpenF1 direct if backend unavailable
const API_BASE = (import.meta.env.VITE_API_URL as string) || ""

async function fetchJSON<T>(path: string, params?: Record<string,string|number>): Promise<T> {
  const url = API_BASE ? `${API_BASE}${path}` : path
  const qs = params ? "?" + new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)]) as any).toString() : ""
  const res = await fetch(url + qs)
  if (!res.ok) {
    const txt = await res.text().catch(()=> "")
    throw new Error(`${path} ${res.status} ${txt.slice(0,120)}`)
  }
  return res.json()
}

export const backend = {
  health: () => fetchJSON<{status:string}>("/health").catch(()=>null),
  getSessions: (year?: number) => fetchJSON<any[]>("/api/sessions", year?{year} : undefined),
  getLatestSession: () => fetchJSON<any>("/api/sessions/latest"),
  getLaps: (sk: number) => fetchJSON<any[]>(`/api/sessions/${sk}/laps`),
  getDrivers: (sk: number) => fetchJSON<any[]>(`/api/sessions/${sk}/drivers`),
  getPositions: (sk: number) => fetchJSON<any[]>(`/api/sessions/${sk}/positions`),
  getStints: (sk: number) => fetchJSON<any[]>(`/api/sessions/${sk}/stints`),
  getNormalized: (sk: number) => fetchJSON<any>(`/api/sessions/${sk}/normalized`),
  // FastF1
  getSchedule: (year: number) => fetchJSON<any[]>("/api/fastf1/schedule", {year}),
  getFastF1Laps: (year:number,gp:string,session="R") => fetchJSON<any[]>("/api/fastf1/laps", {year,gp,session}),
  getTelemetry: (year:number,gp:string,session:string,driver:string,lap:number) => fetchJSON<any[]>("/api/fastf1/telemetry", {year,gp,session,driver,lap} as any),
  isAvailable: async () => {
    try { const h = await fetchJSON<any>("/health"); return !!h } catch { return false }
  }
}
