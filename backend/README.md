# F1 Race Control Backend

Hybrid OpenF1 (live) + FastF1 (historical) normalized API

## Run

```powershell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Endpoints:
- `GET /health`
- `GET /api/sessions?year=2024`
- `GET /api/sessions/latest`
- `GET /api/sessions/{key}/laps|drivers|positions|intervals|stints|weather|race-control|normalized`
- `GET /api/fastf1/schedule?year=2024`
- `GET /api/fastf1/laps?year=2024&gp=Monza&session=R`
- `GET /api/fastf1/telemetry?year=2024&gp=Monza&session=R&driver=VER&lap=10`
- `WS /ws/live/{session_key}`

Frontend env: `VITE_API_URL=http://localhost:8000`
