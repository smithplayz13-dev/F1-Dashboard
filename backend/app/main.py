from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import Optional

from . import openf1, fastf1_service
from .models import SessionData

app = FastAPI(title="F1 Race Control API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "fastf1_cache": True}

@app.get("/api/sessions")
async def sessions(year: Optional[int] = None):
    try:
        data = await openf1.get_sessions(year)
        return data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/sessions/latest")
async def sessions_latest():
    try:
        data = await openf1.get_latest_session()
        return data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/sessions/{session_key}")
async def session_detail(session_key: int):
    # proxy normalized
    try:
        laps = await openf1.get_laps(session_key)
        drivers = await openf1.get_drivers(session_key)
        return {"session_key": session_key, "drivers": drivers, "laps_count": len(laps)}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/sessions/{session_key}/laps")
async def session_laps(session_key: int, source: str = Query("openf1", enum=["openf1","fastf1"])):
    if source=="fastf1":
        # need year/gp — not enough info from session_key alone; return error hint
        raise HTTPException(400, "FastF1 laps require year/gp — use /api/fastf1/laps?year=2024&gp=Monza&session=R")
    try:
        return await openf1.get_laps(session_key)
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/sessions/{session_key}/drivers")
async def session_drivers(session_key: int):
    return await openf1.get_drivers(session_key)

@app.get("/api/sessions/{session_key}/positions")
async def session_positions(session_key: int):
    return await openf1.get_positions(session_key)

@app.get("/api/sessions/{session_key}/intervals")
async def session_intervals(session_key: int):
    return await openf1.get_intervals(session_key)

@app.get("/api/sessions/{session_key}/stints")
async def session_stints(session_key: int):
    return await openf1.get_stints(session_key)

@app.get("/api/sessions/{session_key}/weather")
async def session_weather(session_key: int):
    return await openf1.get_weather(session_key)

@app.get("/api/sessions/{session_key}/race-control")
async def session_race_control(session_key: int):
    return await openf1.get_race_control(session_key)

# Normalized combined endpoint
@app.get("/api/sessions/{session_key}/normalized", response_model=SessionData)
async def session_normalized(session_key: int):
    try:
        drivers, laps, positions, intervals, stints, rc, weather = await asyncio.gather(
            openf1.get_drivers(session_key),
            openf1.get_laps(session_key),
            openf1.get_positions(session_key),
            openf1.get_intervals(session_key),
            openf1.get_stints(session_key),
            openf1.get_race_control(session_key),
            openf1.get_weather(session_key),
        )
        has_chequered = any((r.get("flag")=="CHEQUERED") or ("chequered" in r.get("message","").lower()) for r in rc)
        # is_live heuristic mirrors frontend raceData: date window + no chequered
        is_live = not has_chequered and bool(laps)
        return {
            "session": None,
            "drivers": drivers,
            "laps": [{"driver_number": l["driver_number"], "lap_number": l["lap_number"], "lap_time": l["lap_duration"], "sector_1": l["duration_sector_1"], "sector_2": l["duration_sector_2"], "sector_3": l["duration_sector_3"]} for l in laps],
            "positions": positions,
            "intervals": intervals,
            "stints": stints,
            "race_control": rc,
            "weather": weather[-1] if weather else None,
            "source": "openf1",
            "is_live": is_live,
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# FastF1 endpoints
@app.get("/api/fastf1/schedule")
async def fastf1_schedule(year: int):
    data = await fastf1_service.get_event_schedule(year)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(500, data["error"])
    return data

@app.get("/api/fastf1/laps")
async def fastf1_laps(year: int, gp: str, session: str = "R"):
    data = await fastf1_service.get_session_laps(year, gp, session)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(500, data["error"])
    return data

@app.get("/api/fastf1/telemetry")
async def fastf1_telemetry(year: int, gp: str, session: str, driver: str, lap: int):
    data = await fastf1_service.get_telemetry(year, gp, session, driver, lap)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(500, data["error"])
    return data

@app.get("/api/compare")
async def compare(year: int, gp: str, session: str, driver_a: str, driver_b: str):
    a = await fastf1_service.get_session_laps(year, gp, session)
    # naive compare — return both laps sets
    return {"driver_a": [x for x in a if str(x.get("driver_number"))==driver_a][:5] if isinstance(a,list) else a, "driver_b": [x for x in a if str(x.get("driver_number"))==driver_b][:5] if isinstance(a,list) else a}

# WebSocket live
@app.websocket("/ws/live/{session_key}")
async def ws_live(websocket: WebSocket, session_key: int):
    await websocket.accept()
    try:
        while True:
            # poll openf1 every 3s and push
            laps = await openf1.get_laps(session_key)
            positions = await openf1.get_positions(session_key)
            await websocket.send_json({"type":"update","laps": laps[-5:], "positions": positions[-5:]})
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close(code=1011)
