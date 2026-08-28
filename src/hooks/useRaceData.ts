import { useEffect, useState, useCallback, useRef } from "react"
import { fetchSessionData, listSessions, buildTimingRows } from "../services/raceData"
import type { Session, SessionData, TimingRowData } from "../types"
import { openf1 } from "../services/openf1"

export function useRaceData(initialSessionKey?: number) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSourceMode, setDataSourceMode] = useState<"auto"|"demo"|"openf1">("auto")
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | undefined>(initialSessionKey)
  const prevPosRef = useRef<Map<number,number>>(new Map())

  const load = useCallback(async (sk?: number) => {
    setLoading(true); setError(null)
    try {
      const useDemo = dataSourceMode==="demo"
      const data = await fetchSessionData(sk, useDemo)
      // capture prev positions for animation
      const nextTiming = buildTimingRows({ drivers:data.drivers, positions:data.positions, intervals:data.intervals, laps:data.laps, stints:data.stints, prevPositions: prevPosRef.current })
      // update prev map for next cycle
      const m = new Map<number,number>()
      for (const r of nextTiming) m.set(r.driver.driverNumber, r.position)
      prevPosRef.current = m
      setSessionData(data)
      if (data.session && !sk) setSelectedSessionKey(data.session.sessionKey)
    } catch (e:any) {
      setError(e.message ?? "Failed to load")
    } finally { setLoading(false) }
  }, [dataSourceMode])

  // initial list + load
  useEffect(()=> {
    listSessions(2025).then(setSessions).catch(()=>{})
    load(selectedSessionKey)
  }, []) // eslint-disable-line

  // when datasource mode changes, reload
  useEffect(()=> { load(selectedSessionKey) }, [dataSourceMode]) // eslint-disable-line

  // polling
  useEffect(()=> {
    if (!sessionData || dataSourceMode==="demo") return
    const id = setInterval(()=> {
      // poll intervals/positions/laps quickly; for MVP poll whole session every 5s
      fetchSessionData(selectedSessionKey, false).then(data=>{
        const nextTiming = buildTimingRows({ drivers:data.drivers, positions:data.positions, intervals:data.intervals, laps:data.laps, stints:data.stints, prevPositions: prevPosRef.current })
        const m = new Map<number,number>()
        for (const r of nextTiming) m.set(r.driver.driverNumber, r.position)
        prevPosRef.current = m
        setSessionData(data)
      }).catch(()=>{})
    }, 5000)
    return ()=> clearInterval(id)
  }, [sessionData, selectedSessionKey, dataSourceMode])

  // for header controls — fetch available meetings for selector
  const [meetings, setMeetings] = useState<any[]>([])
  useEffect(()=> { openf1.getMeetings(2025).then(setMeetings).catch(()=>{}) }, [])

  return { sessionData, sessions, meetings, loading, error, selectedSessionKey, setSelectedSessionKey, reload: ()=>load(selectedSessionKey), dataSourceMode, setDataSourceMode, load }
}

export function useTimingRows(sessionData: SessionData | null, prevPositions?: Map<number,number>): TimingRowData[] {
  if (!sessionData) return []
  return buildTimingRows({ drivers: sessionData.drivers, positions: sessionData.positions, intervals: sessionData.intervals, laps: sessionData.laps, stints: sessionData.stints, prevPositions })
}
