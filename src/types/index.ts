// Normalized internal types — UI consumes these, not raw API shapes

export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | "UNKNOWN"

export interface Driver {
  driverNumber: number
  abbreviation: string
  fullName: string
  firstName: string
  lastName: string
  teamName: string
  teamColor: string
  headshotUrl?: string
}

export interface Session {
  sessionKey: number
  meetingKey: number
  sessionName: string // Race, Qualifying, Sprint, Practice 1 ...
  sessionType: string
  dateStart: string
  dateEnd: string
  gmtOffset: string
  location: string
  countryName: string
  circuitShortName: string
  year: number
}

export interface Lap {
  driverNumber: number
  lapNumber: number
  lapDuration: number | null // seconds
  durationSector1?: number | null
  durationSector2?: number | null
  durationSector3?: number | null
  isPitOutLap?: boolean
  isPitInLap?: boolean
}

export interface PositionEntry {
  driverNumber: number
  position: number
  date: string
}

export interface Stint {
  driverNumber: number
  compound: Compound
  stintNumber: number
  lapStart: number
  lapEnd: number | null
  tyreAgeAtStart?: number
}

export interface Interval {
  driverNumber: number
  gapToLeader: string | null
  interval: string | null
  date: string
}

export interface TelemetryPoint {
  driverNumber: number
  date: string
  speed: number | null
  rpm?: number | null
  gear?: number | null
  throttle?: number | null
  brake?: number | null
  drs?: number
  x?: number
  y?: number
  z?: number
}

export interface Weather {
  airTemperature: number | null
  trackTemperature: number | null
  humidity: number | null
  pressure: number | null
  rainfall: number | null
  windSpeed: number | null
  windDirection: number | null
  date: string
}

export type TrackStatusCode = "1" | "2" | "3" | "4" | "5" | "6"

export interface RaceControlMessage {
  category: string
  message: string
  status?: string
  flag?: string
  scope?: string
  sector?: number | null
  driverNumber?: number | null
  date: string
  lapNumber?: number | null
}

export type DataSource = "openf1" | "demo" | "ergast"

export interface TimingRowData {
  driver: Driver
  position: number
  positionChange: number // +1, -2, 0
  gapToLeader: string | null
  interval: string | null
  lastLap: Lap | null
  bestLap: Lap | null
  sectors?: [number | null, number | null, number | null]
  compound: Compound
  tyreAge?: number | null
  stints: Stint[]
  inPit?: boolean
  drs?: number
  speed?: number | null
}

export interface SessionData {
  session: Session | null
  drivers: Driver[]
  laps: Lap[]
  positions: PositionEntry[]
  intervals: Interval[]
  stints: Stint[]
  raceControl: RaceControlMessage[]
  weather: Weather | null
  status: "live" | "ended" | "loading" | "offline"
  lastUpdated: string | null
  dataSource: DataSource
  isLive: boolean
}
