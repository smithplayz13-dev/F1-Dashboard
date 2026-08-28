import { useEffect, useState, useCallback, useRef } from "react"
import { fetchSessionData, listSessionsRange } from "../services/raceData"
import type { Session, SessionData, TimingRowData } from "../types"
import { openf1 } from "../services/openf1"
import { buildTimingRows } from "../services/raceData"

const YEARS = [2026,2025,2024,2023]

export function useRaceData(initialSessionKey?: number) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSourceMode, setDataSourceMode] = useState<"auto"|"demo"|"openf1">("auto")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | undefined>(initialSessionKey)
  const prevPosRef = useRef<Map<number,number>>(new Map())
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (sk?: number) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true); setError(null)
    try {
      const useDemo = dataSourceMode==="demo"
      const data = await fetchSessionData(sk, useDemo)
      if (ac.signal.aborted) return
      const nextTiming = buildTimingRows({ drivers:data.drivers, positions:data.positions, intervals:data.intervals, laps:data.laps, stints:data.stints, prevPositions: prevPosRef.current })
      const m = new Map<number,number>()
      for (const r of nextTiming) if (r.position!==99) m.set(r.driver.driverNumber, r.position)
      prevPosRef.current = m
      setSessionData(data)
      if (data.session && !sk) setSelectedSessionKey(data.session.sessionKey)
      if (data.session) setSelectedYear(data.session.year)
    } catch (e:any) {
      if (e?.name==="AbortError") return
      setError(e.message ?? "Failed to load")
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [dataSourceMode])

  const refreshSessions = useCallback(async (year?: number) => {
    if (year) {
      const s = await listSessionsRange([year])
      setSessions(s)
    } else {
      const s = await listSessionsRange(YEARS)
      setSessions(s)
    }
  }, [])

  // initial list + load — single effect to avoid double fetch
  const initializedRef = useRef(false)
  useEffect(()=> {
    if (initializedRef.current) return
    initializedRef.current = true
    refreshSessions()
    load(selectedSessionKey)
  }, []) // eslint-disable-line

  // when year changes, refresh session list
  useEffect(()=> { refreshSessions(selectedYear) }, [selectedYear, refreshSessions])

  // polling — stable interval, abort-safe
  const sessionKeyRef = useRef(selectedSessionKey)
  useEffect(()=> { sessionKeyRef.current = selectedSessionKey }, [selectedSessionKey])
  const isLiveRef = useRef(false)
  useEffect(()=> { isLiveRef.current = !!sessionData?.isLive }, [sessionData?.isLive])

  useEffect(()=> {
    if (dataSourceMode==="demo") return
    const id = setInterval(()=> {
      if (!isLiveRef.current) return
      fetchSessionData(sessionKeyRef.current, false).then(data=>{
        const nextTiming = buildTimingRows({ drivers:data.drivers, positions:data.positions, intervals:data.intervals, laps:data.laps, stints:data.stints, prevPositions: prevPosRef.current })
        const m = new Map<number,number>()
        for (const r of nextTiming) if (r.position!==99) m.set(r.driver.driverNumber, r.position)
        prevPosRef.current = m
        setSessionData(data)
      }).catch(()=>{})
    }, 5000)
    return ()=> clearInterval(id)
  }, [dataSourceMode])

  const [meetings, setMeetings] = useState<any[]>([])
  useEffect(()=> { openf1.getMeetingsRange(YEARS).then(setMeetings).catch(()=>{}) }, [])

  return { sessionData, sessions, meetings, loading, error, selectedSessionKey, setSelectedSessionKey, selectedYear, setSelectedYear, refreshSessions, reload: ()=>load(selectedSessionKey), dataSourceMode, setDataSourceMode, load }
}

export function useTimingRows(sessionData: SessionData | null, prevPositions?: Map<number,number>): TimingRowData[] {
  if (!sessionData) return []
  return buildTimingRows({ drivers: sessionData.drivers, positions: sessionData.positions, intervals: sessionData.intervals, laps: sessionData.laps, stints: sessionData.stints, prevPositions })
}
