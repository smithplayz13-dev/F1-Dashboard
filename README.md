# F1 RACE CONTROL — Live Timing Dashboard

Broadcast-grade F1 timing screen built with React + TypeScript + Vite, Tailwind, Recharts, Framer Motion and OpenF1 API.

![stack](https://img.shields.io/badge/React-19-blue) ![api](https://img.shields.io/badge/OpenF1-live-red)

## Features
- **Timing Tower** — driver rows with position changes, gap/interval, last/best lap, tyre compound + age, team colour strip, DRS.
- **Track Status** — flag state, lap count, weather (air/track/wind).
- **Lap Delta** — vs best lap with delta bar + sector deltas.
- **Lap-time Telemetry Graph** — Recharts line chart, fastest lap highlight, compare driver.
- **Tire Strategy Timeline** — stint bars coloured by compound (SOFT/MED/HARD/INT/WET), pit lap markers.
- **Driver Telemetry** — speed/sectors/tyre, comparison mode.
- **Live Polling** — 5s refresh, connection status, last update, auto-reconnect. Never fakes demo as live.
- **Broadcast Mode** — press `F` or button to enter fullscreen-style layout.

## Tech
React 19 + TypeScript + Vite 8 + Tailwind 3.4 + Recharts + Framer Motion + lucide-react

```
src/
  components/  # Header, TimingTower/Row, TrackStatus, LapDelta, LapGraph, TireStrategy, DriverDetail, Comparison, RaceControls
  services/    # openf1.ts, ergast.ts, raceData.ts (adapter + normalized types)
  hooks/       # useRaceData (polling + session selector)
  types/       # normalized Driver/Session/Lap/Stint/etc
  utils/       # format, colors
  data/        # demoData (realistic fallback)
```

## API
- Primary: **OpenF1** `https://api.openf1.org/v1` — sessions, drivers, laps, position, intervals, stints, race_control, weather, car_data
- Fallback: **Jolpica Ergast** `https://api.jolpi.ca/ergast/f1` for historical enrichment
- Data Source toggle: `AUTO` / `OPENF1` / `DEMO` (demo never labeled live)
- Architecture is modular — swap provider via `services/raceData.ts`

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production
npm run preview
```

## Data freshness
The header shows `LIVE ●` vs `SESSION ENDED`, `Updated Xs ago`, and connection status. If no live session exists, the latest available session is shown as `SESSION ENDED` with demo fallback clearly labeled `DEMO MODE`.

## Broadcast mode
`Enter Broadcast Mode` button or press `F` — expands tower, hides chrome, increases type scale.

## Deploy
Any static host (Vercel, Netlify, GitHub Pages). `npm run build` outputs `dist/`.
