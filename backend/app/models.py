from pydantic import BaseModel
from typing import Optional, List, Literal

class Driver(BaseModel):
    driver_number: int
    abbreviation: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    team: str
    team_color: str
    headshot_url: Optional[str] = None

class Session(BaseModel):
    session_key: int
    meeting_key: int
    session_name: str
    session_type: str
    date_start: str
    date_end: str
    gmt_offset: str
    location: str
    country_name: str
    circuit_short_name: str
    year: int
    source: Literal["openf1","fastf1","demo"] = "openf1"

class Lap(BaseModel):
    driver_number: int
    lap_number: int
    lap_time: Optional[float] = None
    sector_1: Optional[float] = None
    sector_2: Optional[float] = None
    sector_3: Optional[float] = None
    compound: Optional[str] = None
    tyre_age: Optional[int] = None
    is_personal_best: bool = False
    is_session_best: bool = False
    is_pit_out_lap: bool = False
    date_start: Optional[str] = None

class Stint(BaseModel):
    driver_number: int
    compound: str
    stint_number: int
    lap_start: int
    lap_end: Optional[int] = None
    tyre_age_at_start: Optional[int] = None

class Position(BaseModel):
    driver_number: int
    position: int
    date: str

class Interval(BaseModel):
    driver_number: int
    gap_to_leader: Optional[str] = None
    interval: Optional[str] = None
    date: str

class TelemetryPoint(BaseModel):
    distance: float
    speed: Optional[float] = None
    throttle: Optional[float] = None
    brake: Optional[float] = None
    gear: Optional[int] = None
    rpm: Optional[float] = None
    drs: Optional[int] = None

class Telemetry(BaseModel):
    driver_number: int
    lap_number: int
    points: List[TelemetryPoint]

class Weather(BaseModel):
    air_temperature: Optional[float] = None
    track_temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    date: str

class RaceControlMessage(BaseModel):
    category: str
    message: str
    flag: Optional[str] = None
    status: Optional[str] = None
    scope: Optional[str] = None
    sector: Optional[int] = None
    driver_number: Optional[int] = None
    lap_number: Optional[int] = None
    date: str

class SessionData(BaseModel):
    session: Optional[Session] = None
    drivers: List[Driver] = []
    laps: List[Lap] = []
    positions: List[Position] = []
    intervals: List[Interval] = []
    stints: List[Stint] = []
    race_control: List[RaceControlMessage] = []
    weather: Optional[Weather] = None
    source: str = "openf1"
    is_live: bool = False
