const OPENF1_BASE = "https://api.openf1.org/v1"

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OpenF1 ${res.status} ${url}`)
  return res.json()
}

// Raw response types (subset)
export interface OpenF1Session {
  session_key: number
  meeting_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  gmt_offset: string
  location: string
  country_name: string
  circuit_short_name: string
  year: number
}

export interface OpenF1Driver {
  driver_number: number
  broadcast_name: string
  full_name: string
  first_name: string
  last_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url?: string
  session_key: number
  meeting_key: number
}

export interface OpenF1Lap {
  driver_number: number
  lap_number: number
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  is_pit_out_lap: boolean
  date_start: string
  session_key: number
}

export interface OpenF1Position { driver_number: number; position: number; date: string; session_key:number }
export interface OpenF1Interval { driver_number:number; gap_to_leader: string | null; interval: string | null; date: string; session_key:number }
export interface OpenF1Stint { driver_number:number; compound: string; stint_number:number; lap_start:number; lap_end:number|null; tyre_age_at_start:number; session_key:number }
export interface OpenF1RaceControl { category:string; message:string; status?:string; flag?:string; scope?:string; sector?:number|null; driver_number?:number|null; date:string; lap_number?:number|null; session_key:number }
export interface OpenF1Weather { air_temperature:number|null; track_temperature:number|null; humidity:number|null; pressure:number|null; rainfall:number|null; wind_speed:number|null; wind_direction:number|null; date:string; session_key:number; meeting_key:number }
export interface OpenF1Meeting { meeting_key:number; meeting_name:string; location:string; country_name:string; circuit_short_name:string; year:number; date_start:string }
export interface OpenF1CarData { driver_number:number; speed:number|null; rpm:number|null; n_gear:number|null; throttle:number|null; brake:number|null; drs:number; date:string; session_key:number }

export const openf1 = {
  getSessions: (year?: number) =>
    fetchJSON<OpenF1Session[]>(`${OPENF1_BASE}/sessions${year?`?year=${year}`:""}`),
  getLatestSession: async (): Promise<OpenF1Session | null> => {
    const s = await fetchJSON<OpenF1Session[]>(`${OPENF1_BASE}/sessions?year=2025`)
    if (!s.length) {
      const all = await fetchJSON<OpenF1Session[]>(`${OPENF1_BASE}/sessions`)
      return all.sort((a,b)=>+new Date(b.date_start)-+new Date(a.date_start))[0] ?? null
    }
    return s.sort((a,b)=>+new Date(b.date_start)-+new Date(a.date_start))[0]
  },
  getMeetings: (year?:number) => fetchJSON<OpenF1Meeting[]>(`${OPENF1_BASE}/meetings${year?`?year=${year}`:""}`),
  getDrivers: (sessionKey:number) => fetchJSON<OpenF1Driver[]>(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
  getLaps: (sessionKey:number) => fetchJSON<OpenF1Lap[]>(`${OPENF1_BASE}/laps?session_key=${sessionKey}`),
  getPositions: (sessionKey:number) => fetchJSON<OpenF1Position[]>(`${OPENF1_BASE}/position?session_key=${sessionKey}`),
  getIntervals: (sessionKey:number) => fetchJSON<OpenF1Interval[]>(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`),
  getStints: (sessionKey:number) => fetchJSON<OpenF1Stint[]>(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
  getRaceControl: (sessionKey:number) => fetchJSON<OpenF1RaceControl[]>(`${OPENF1_BASE}/race_control?session_key=${sessionKey}`),
  getWeather: (sessionKey:number) => fetchJSON<OpenF1Weather[]>(`${OPENF1_BASE}/weather?session_key=${sessionKey}`),
  getCarData: (sessionKey:number, driverNumber?:number) => {
    let url = `${OPENF1_BASE}/car_data?session_key=${sessionKey}`
    if (driverNumber) url += `&driver_number=${driverNumber}`
    return fetchJSON<OpenF1CarData[]>(url)
  },
}
