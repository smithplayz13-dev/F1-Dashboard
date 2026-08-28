import os
from pathlib import Path

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
try:
    import fastf1
    fastf1.Cache.enable_cache(str(CACHE_DIR))
    HAS_FASTF1 = True
except Exception:
    HAS_FASTF1 = False
    fastf1 = None  # type: ignore

# lightweight in-memory cache for normalized results
_mem = {}

def _key(*parts): return "|".join(map(str, parts))

async def get_session_laps(year: int, gp: str, session: str = "R"):
    """Load laps via FastF1 for historical analysis. gp can be circuit short name or round."""
    if not HAS_FASTF1:
        return {"error": "FastF1 not installed — pip install fastf1"}
    k = _key("laps", year, gp, session)
    if k in _mem: return _mem[k]
    # FastF1 is blocking — run in thread
    import asyncio
    def _load():
        try:
            # Try by GP name, fallback to round lookup
            ses = fastf1.get_session(year, gp, session)
            ses.load(telemetry=False)
            laps = ses.laps
            # normalize
            out = []
            for _, row in laps.iterrows():
                try:
                    out.append({
                        "driver_number": int(str(row["DriverNumber"]).strip()) if str(row["DriverNumber"]).isdigit() else 0,
                        "lap_number": int(row["LapNumber"]) if row["LapNumber"] else 0,
                        "lap_time": float(row["LapTime"].total_seconds()) if row["LapTime"] else None,
                        "sector_1": float(row["Sector1Time"].total_seconds()) if row["Sector1Time"] else None,
                        "sector_2": float(row["Sector2Time"].total_seconds()) if row["Sector2Time"] else None,
                        "sector_3": float(row["Sector3Time"].total_seconds()) if row["Sector3Time"] else None,
                        "compound": str(row["Compound"]) if row["Compound"] else None,
                        "tyre_age": int(row["TyreLife"]) if row["TyreLife"] else None,
                        "is_pit_out_lap": bool(row["PitOutTime"]) if "PitOutTime" in row else False,
                    })
                except: pass
            return out
        except Exception as e:
            return {"error": str(e)}
    out = await asyncio.to_thread(_load)
    if isinstance(out, list):
        _mem[k]=out
    return out

async def get_telemetry(year: int, gp: str, session: str, driver: str, lap: int):
    if not HAS_FASTF1:
        return {"error": "FastF1 not installed — pip install fastf1"}
    k = _key("tel", year, gp, session, driver, lap)
    if k in _mem: return _mem[k]
    import asyncio
    def _load():
        try:
            ses = fastf1.get_session(year, gp, session)
            ses.load(telemetry=True)
            drv_laps = ses.laps.pick_drivers(driver)
            # find lap
            lap_obj = drv_laps[drv_laps["LapNumber"]==lap].iloc[0] if len(drv_laps[drv_laps["LapNumber"]==lap]) else drv_laps.iloc[-1]
            tel = lap_obj.get_telemetry()
            points = []
            for _, r in tel.iterrows():
                points.append({
                    "distance": float(r["Distance"]) if "Distance" in r else 0,
                    "speed": float(r["Speed"]) if "Speed" in r else None,
                    "throttle": float(r["Throttle"]) if "Throttle" in r else None,
                    "brake": float(r["Brake"]) if "Brake" in r else None,
                    "gear": int(r["nGear"]) if "nGear" in r and r["nGear"] else None,
                    "rpm": float(r["RPM"]) if "RPM" in r else None,
                    "drs": int(r["DRS"]) if "DRS" in r else None,
                })
            return points[::max(1,len(points)//500)]  # downsample to ~500 pts
        except Exception as e:
            return {"error": str(e)}
    out = await asyncio.to_thread(_load)
    if isinstance(out, list):
        _mem[k]=out
    return out

async def get_event_schedule(year: int):
    if not HAS_FASTF1:
        return {"error": "FastF1 not installed — pip install fastf1"}
    k = _key("schedule", year)
    if k in _mem: return _mem[k]
    import asyncio
    def _load():
        try:
            sched = fastf1.get_event_schedule(year, include_testing=False)
            out=[]
            for _, r in sched.iterrows():
                out.append({
                    "round": int(r["RoundNumber"]),
                    "event_name": str(r["EventName"]),
                    "location": str(r["Location"]),
                    "country": str(r["Country"]),
                    "event_date": str(r["EventDate"]),
                    "event_format": str(r["EventFormat"]),
                })
            return out
        except Exception as e:
            return {"error": str(e)}
    out = await asyncio.to_thread(_load)
    if isinstance(out, list):
        _mem[k]=out
    return out
