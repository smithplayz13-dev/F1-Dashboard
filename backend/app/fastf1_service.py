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
            import pandas as pd
            import math
            def safe_time(v):
                try:
                    if pd.isna(v): return None
                    return float(v.total_seconds())
                except: return None
            def safe_int(v):
                try:
                    if pd.isna(v): return None
                    return int(v)
                except: return None
            ses = fastf1.get_session(year, gp, session)
            ses.load(telemetry=False)
            laps = ses.laps
            out = []
            for _, row in laps.iterrows():
                try:
                    dn = str(row["DriverNumber"]).strip()
                    lap_time = safe_time(row.get("LapTime"))
                    s1 = safe_time(row.get("Sector1Time"))
                    s2 = safe_time(row.get("Sector2Time"))
                    s3 = safe_time(row.get("Sector3Time"))
                    # filter out NaN lap_time
                    if lap_time is not None and (math.isnan(lap_time) or lap_time <= 0):
                        lap_time = None
                    out.append({
                        "driver_number": int(dn) if dn.isdigit() else 0,
                        "lap_number": safe_int(row.get("LapNumber")) or 0,
                        "lap_time": lap_time,
                        "sector_1": s1 if s1 is None or not math.isnan(s1) else None,
                        "sector_2": s2 if s2 is None or not math.isnan(s2) else None,
                        "sector_3": s3 if s3 is None or not math.isnan(s3) else None,
                        "compound": str(row["Compound"]) if pd.notna(row.get("Compound")) and row.get("Compound") else None,
                        "tyre_age": safe_int(row.get("TyreLife")),
                        "is_pit_out_lap": bool(row.get("PitOutTime")) if pd.notna(row.get("PitOutTime")) else False,
                    })
                except Exception:
                    pass
            return out
        except Exception as e:
            import traceback
            traceback.print_exc()
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
