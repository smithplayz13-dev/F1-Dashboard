import httpx
from typing import Optional

BASE = "https://api.openf1.org/v1"

async def fetch_json(path: str, params: dict = None):
    url = f"{BASE}{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params or {})
        r.raise_for_status()
        return r.json()

async def get_sessions(year: Optional[int] = None):
    params = {"year": year} if year else {}
    return await fetch_json("/sessions", params)

async def get_latest_session():
    import datetime
    y = datetime.datetime.now().year
    for year in [y, y-1, y-2, y-3]:
        try:
            data = await fetch_json("/sessions", {"year": year})
            if data:
                data.sort(key=lambda x: x["date_start"], reverse=True)
                return data[0]
        except: pass
    data = await fetch_json("/sessions")
    data.sort(key=lambda x: x["date_start"], reverse=True)
    return data[0] if data else None

async def get_drivers(session_key: int):
    return await fetch_json("/drivers", {"session_key": session_key})

async def get_laps(session_key: int):
    return await fetch_json("/laps", {"session_key": session_key})

async def get_positions(session_key: int):
    return await fetch_json("/position", {"session_key": session_key})

async def get_intervals(session_key: int):
    return await fetch_json("/intervals", {"session_key": session_key})

async def get_stints(session_key: int):
    return await fetch_json("/stints", {"session_key": session_key})

async def get_race_control(session_key: int):
    return await fetch_json("/race_control", {"session_key": session_key})

async def get_weather(session_key: int):
    return await fetch_json("/weather", {"session_key": session_key})

async def get_car_data(session_key: int, driver_number: Optional[int]=None):
    params = {"session_key": session_key}
    if driver_number: params["driver_number"]=driver_number
    return await fetch_json("/car_data", params)
