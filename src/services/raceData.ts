import type { Session, Driver, Lap, PositionEntry, Interval, Stint, Weather, RaceControlMessage, TimingRowData, SessionData } from "../types"
import { openf1 } from "./openf1"
import { teamColor } from "../utils/colors"
import { DEMO_DRIVERS, DEMO_LAPS, DEMO_POSITIONS, DEMO_STINTS, DEMO_INTERVALS } from "../data/demoData"

function mapSession(s: any): Session {
  return {
    sessionKey: s.session_key,
    meetingKey: s.meeting_key,
    sessionName: s.session_name,
    sessionType: s.session_type,
    dateStart: s.date_start,
    dateEnd: s.date_end,
    gmtOffset: s.gmt_offset,
    location: s.location,
    countryName: s.country_name,
    circuitShortName: s.circuit_short_name,
    year: s.year,
  }
}

function mapDriver(d: any): Driver {
  const col = d.team_colour ? `#${d.team_colour}` : teamColor(d.team_name)
  return {
    driverNumber: d.driver_number,
    abbreviation: d.name_acronym,
    fullName: d.full_name,
    firstName: d.first_name,
    lastName: d.last_name,
    teamName: d.team_name,
    teamColor: col,
    headshotUrl: d.headshot_url,
  }
}

function mapLap(l: any): Lap {
  return {
    driverNumber: l.driver_number,
    lapNumber: l.lap_number,
    lapDuration: l.lap_duration,
    durationSector1: l.duration_sector_1,
    durationSector2: l.duration_sector_2,
    durationSector3: l.duration_sector_3,
    isPitOutLap: l.is_pit_out_lap,
  }
}

function mapStint(s: any): Stint {
  const comp = (s.compound ?? "UNKNOWN").toUpperCase() as Stint["compound"]
  return {
    driverNumber: s.driver_number,
    compound: ["SOFT","MEDIUM","HARD","INTERMEDIATE","WET"].includes(comp) ? comp : "UNKNOWN",
    stintNumber: s.stint_number,
    lapStart: s.lap_start,
    lapEnd: s.lap_end,
    tyreAgeAtStart: s.tyre_age_at_start,
  }
}

// Build TimingRowData from normalized collections
export function buildTimingRows(data: {
  drivers: Driver[]
  positions: PositionEntry[]
  intervals: Interval[]
  laps: Lap[]
  stints: Stint[]
  carData?: { driverNumber:number; speed:number|null; drs:number }[]
  prevPositions?: Map<number, number>
}): TimingRowData[] {
  // latest position per driver
  const posMap = new Map<number, PositionEntry>()
  const sortedPos = [...data.positions].sort((a,b)=>+new Date(a.date)-+new Date(b.date))
  for (const p of sortedPos) posMap.set(p.driverNumber, p)

  const intervalMap = new Map<number, Interval>()
  const sortedIv = [...data.intervals].sort((a,b)=>+new Date(a.date)-+new Date(b.date))
  for (const iv of sortedIv) intervalMap.set(iv.driverNumber, iv)

  // best & last lap per driver
  const lapsByDriver = new Map<number, Lap[]>()
  for (const l of data.laps) {
    if (!lapsByDriver.has(l.driverNumber)) lapsByDriver.set(l.driverNumber, [])
    lapsByDriver.get(l.driverNumber)!.push(l)
  }

  const speedMap = new Map<number, number|null>()
  const drsMap = new Map<number, number>()
  for (const c of data.carData ?? []) { speedMap.set(c.driverNumber, c.speed); drsMap.set(c.driverNumber, c.drs) }

  const rows: TimingRowData[] = data.drivers.map(d => {
    const pos = posMap.get(d.driverNumber)
    const iv = intervalMap.get(d.driverNumber)
    const laps = (lapsByDriver.get(d.driverNumber) ?? []).filter(l=>l.lapDuration != null && l.lapDuration>0).sort((a,b)=>a.lapNumber-b.lapNumber)
    const lastLap = laps[laps.length-1] ?? null
    const bestLap = laps.length ? [...laps].sort((a,b)=>(a.lapDuration??999)-(b.lapDuration??999))[0] : null
    const driverStints = data.stints.filter(s=>s.driverNumber===d.driverNumber).sort((a,b)=>a.stintNumber-b.stintNumber)
    const latestStint = driverStints[driverStints.length-1]
    // tyre age: prefer interval/lap count derived from global current lap would be more accurate, but fallback to per-driver lap count
    const currentLapCount = laps.length
    const tyreAge = latestStint ? (latestStint.tyreAgeAtStart ?? 0) + Math.max(0, currentLapCount - latestStint.lapStart + 1) : null

    const prev = data.prevPositions?.get(d.driverNumber)
    const curPos = pos?.position ?? 99
    const change = prev != null ? prev - curPos : 0

    return {
      driver: d,
      position: curPos,
      positionChange: change,
      gapToLeader: iv?.gapToLeader ?? null,
      interval: iv?.interval ?? null,
      lastLap,
      bestLap,
      sectors: lastLap ? [lastLap.durationSector1??null, lastLap.durationSector2??null, lastLap.durationSector3??null] : undefined,
      compound: (latestStint?.compound ?? "UNKNOWN"),
      tyreAge,
      stints: driverStints,
      speed: speedMap.get(d.driverNumber) ?? null,
      drs: drsMap.get(d.driverNumber),
    }
  })

  // sort by position, drivers without position at end
  rows.sort((a,b)=>a.position-b.position)
  return rows
}

export async function fetchSessionData(sessionKey?: number, useDemo=false): Promise<SessionData> {
  if (useDemo) {
    return demoSessionData()
  }
  try {
    let session: Session | null = null
    if (sessionKey) {
      // fetch all sessions (no year filter) to guarantee we find any year
      const sessions = await openf1.getSessions()
      const found = sessions.find(s=>s.session_key===sessionKey)
      if (found) session = mapSession(found)
      else {
        // fallback: try range
        const range = await openf1.getSessionsRange([2026,2025,2024,2023])
        const f2 = range.find(s=>s.session_key===sessionKey)
        if (f2) session = mapSession(f2)
      }
    } else {
      const latest = await openf1.getLatestSession()
      if (latest) session = mapSession(latest)
    }
    if (!session) throw new Error("No session found")

    const sk = session.sessionKey

    // parallel fetches — fail gracefully per endpoint
    const [driversRaw, lapsRaw, positionsRaw, intervalsRaw, stintsRaw, rcRaw, weatherRaw] = await Promise.all([
      openf1.getDrivers(sk).catch(()=>[]),
      openf1.getLaps(sk).catch(()=>[]),
      openf1.getPositions(sk).catch(()=>[]),
      openf1.getIntervals(sk).catch(()=>[]),
      openf1.getStints(sk).catch(()=>[]),
      openf1.getRaceControl(sk).catch(()=>[]),
      openf1.getWeather(sk).catch(()=>[]),
    ])

    const drivers: Driver[] = (driversRaw as any[]).map(mapDriver)
    const laps: Lap[] = (lapsRaw as any[]).map(mapLap)
    const positions: PositionEntry[] = (positionsRaw as any[]).map((p:any)=>({ driverNumber:p.driver_number, position:p.position, date:p.date }))
    const intervals: Interval[] = (intervalsRaw as any[]).map((iv:any)=>({ driverNumber:iv.driver_number, gapToLeader:iv.gap_to_leader, interval:iv.interval, date:iv.date }))
    const stints: Stint[] = (stintsRaw as any[]).map(mapStint)
    const raceControl: RaceControlMessage[] = (rcRaw as any[]).map((r:any)=>({...r, driverNumber: r.driver_number ?? null, lapNumber: r.lap_number ?? null}))
    // weather: pick latest by date, not array order
    let weather: Weather | null = null
    if ((weatherRaw as any[]).length) {
      const sorted = [...weatherRaw as any[]].sort((a,b)=>+new Date(a.date)-+new Date(b.date))
      const w = sorted[sorted.length-1]
      weather = {
        airTemperature: w.air_temperature,
        trackTemperature: w.track_temperature,
        humidity: w.humidity,
        pressure: w.pressure,
        rainfall: w.rainfall,
        windSpeed: w.wind_speed,
        windDirection: w.wind_direction,
        date: w.date,
      }
    }

    const now = Date.now()
    const end = new Date(session.dateEnd).getTime()
    const start = new Date(session.dateStart).getTime()
    const hasChequered = raceControl.some(r=> (r.flag==="CHEQUERED") || r.message.toLowerCase().includes("chequered"))
    const isLive = !hasChequered && now >= start && now <= end + 2*60*60*1000
    const status: SessionData["status"] = isLive ? "live" : (now > end || hasChequered ? "ended" : "loading")

    return {
      session, drivers, laps, positions, intervals, stints, raceControl, weather,
      status, lastUpdated: new Date().toISOString(), dataSource: "openf1", isLive
    }
  } catch (e) {
    console.warn("OpenF1 fetch failed, falling back to demo", e)
    return { ...demoSessionData(), status: "offline", lastUpdated: new Date().toISOString() }
  }
}

function demoSessionData(): SessionData {
  const session: Session = {
    sessionKey: 9999,
    meetingKey: 9999,
    sessionName: "Race",
    sessionType: "Race",
    dateStart: new Date(Date.now()- 2*3600*1000).toISOString(),
    dateEnd: new Date(Date.now()+ 0.5*3600*1000).toISOString(),
    gmtOffset: "00:00:00",
    location: "Monza",
    countryName: "Italy",
    circuitShortName: "Monza",
    year: 2026,
  }
  return {
    session,
    drivers: DEMO_DRIVERS,
    laps: DEMO_LAPS,
    positions: DEMO_POSITIONS,
    intervals: DEMO_INTERVALS,
    stints: DEMO_STINTS,
    raceControl: [{ category:"Flag", message:"GREEN FLAG", flag:"GREEN", date:new Date().toISOString(), scope:"Track" }],
    weather: { airTemperature:28, trackTemperature:41, humidity:45, pressure:1012, rainfall:0, windSpeed:12, windDirection:180, date:new Date().toISOString() },
    status: "ended",
    lastUpdated: new Date().toISOString(),
    dataSource: "demo",
    isLive: false,
  }
}

export async function listSessions(year?: number): Promise<Session[]> {
  try {
    const s = year ? await openf1.getSessions(year) : await openf1.getSessions()
    return s.map(mapSession).sort((a,b)=>+new Date(b.dateStart)-+new Date(a.dateStart))
  } catch { return [] }
}

export async function listSessionsRange(years: number[]): Promise<Session[]> {
  try {
    const s = await openf1.getSessionsRange(years)
    return s.map(mapSession).sort((a,b)=>+new Date(b.dateStart)-+new Date(a.dateStart))
  } catch { return [] }
}
