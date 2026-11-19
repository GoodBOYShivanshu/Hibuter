# Hibxy

**A small, fast habit tracker that lives entirely in your browser.** Streaks, a 26-week
heatmap, weekday patterns and weekly insights — no account, no server, no tracking.
Built with React, TypeScript and Vite.

```bash
npm install
npm run dev      # http://localhost:5173
```

---

## What it does

- **Today board** — everything scheduled for the day, one tap to check in. Rest days are
  marked separately, so an off-day never looks like a failure.
- **Streaks that respect your schedule** — a Mon/Wed/Fri habit only breaks on a missed
  Mon/Wed/Fri. Today not being logged yet doesn't kill last night's streak either.
- **26-week heatmap** per habit with click-to-backfill. Plus an aggregate map across all
  habits on the Insights tab.
- **Insights** — weekly completion trend, best weekdays, leaderboard by live streak,
  30-day completion rate, total check-ins.
- **Past-day logging** — jump to any of the last 7 days from the day strip and fix the
  record.
- **Bring your own habit** — emoji, one of eight accents, and any combination of
  weekdays (with Every day / Weekdays / Weekends / 3× a week presets).
- **Dark & light themes**, remembered across visits, applied before first paint.
- **Export / import JSON**, and a two-step "erase everything" for a clean slate.
- **Keyboard** — <kbd>N</kbd> for a new habit, <kbd>Esc</kbd> to dismiss a panel.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `0.0.0.0:5173` |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build on `0.0.0.0:4173` |
| `npm test` | Run the unit suite (28 tests) with Vitest |
| `npm run typecheck` | Types only |

## Project layout

```
src/
├─ main.tsx              # React entry point
├─ App.tsx               # app shell, state, actions, shortcuts
├─ styles.css            # design tokens, layout, dark/light themes
├─ types.ts              # Habit / AppState
├─ lib/
│  ├─ date.ts            # local-time date keys, ranges, heatmap grids
│  ├─ stats.ts           # streaks, rates, weekday/weekly aggregates
│  ├─ storage.ts         # localStorage, validation, demo data, export
│  └─ *.test.ts          # unit tests for the above
└─ components/
   ├─ TodayView.tsx      # day strip, hero ring, habit lists
   ├─ HabitCard.tsx      # one row: check-in, 7-day dots, streak
   ├─ InsightsView.tsx   # tiles, aggregate map, charts, leaderboard
   ├─ HabitDetail.tsx    # drawer: stats, history, backfill, edit, delete
   ├─ HabitDialog.tsx    # create / edit form
   ├─ Heatmap.tsx        # reusable week × weekday grid
   ├─ Charts.tsx         # sparkline, weekday bars, stat tiles
   └─ Ring.tsx           # SVG progress ring
```

## The data model

One localStorage key (`hibxy.state.v1`) holds everything:

```ts
type Habit = {
  id: string
  name: string
  emoji: string
  color: string
  schedule: number[]            // 0 = Sunday … 6 = Saturday
  createdAt: string             // YYYY-MM-DD
  entries: Record<string, number> // YYYY-MM-DD → check-ins
  archived: boolean
}
```

Days are always local-time `YYYY-MM-DD` strings, which makes streak maths
timezone-proof and sortable. Streak rules:

1. Only days in the habit's `schedule` count, in either direction.
2. Days before `createdAt` never count.
3. If today is scheduled but not logged, the streak is measured up to yesterday, so the
   number doesn't drop to zero every midnight.

## Privacy

No network calls, no analytics, no cookies. Check-ins stay in `localStorage` on the
device — clearing site data (or "Erase all") removes them for good, so export a backup
if you care about the history.

## Notes

- Demo data (six habits, ~20 weeks of history) is seeded on first load so the charts
  aren't empty. "Clear demo habits" wipes it; "Keep exploring" keeps it as real data.
- `npm test` covers streak edge cases, schedule handling, completion rates, date ranges,
  heatmap grids, and storage sanitisation.
- Styling is plain CSS with custom properties and `color-mix()` — no UI framework, no
  chart library. The whole bundle is ~79 kB gzipped.
