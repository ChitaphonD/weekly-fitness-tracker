# Weekly Progress Tracker

Mobile-first web app for logging workouts and tracking week-over-week progress.
Implements `project/Fitness Tracker.dc.html` from the Claude Design handoff.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build in dist/
```

## Structure

- `src/data.ts` – exercise library, routines, 8 weeks of sample data, labels
- `src/store.ts` – `useTracker()` hook: all state, actions and localStorage persistence
- `src/photos.ts` – progress photos in IndexedDB (downscaled to 1400px)
- `src/components/` – `Dashboard`, `LogScreen`, `BodyScreen`, `ProfileScreen`, `Overlays` (week picker, custom-exercise sheet), `PhotoSlot`
- `src/config.ts` – options from the prototype's Tweaks, set via env vars:
  `VITE_THEME`, `VITE_DEFAULT_TAB`, `VITE_WEIGHT_INCREMENT`, `VITE_ALWAYS_SHOW_WELCOME`

## Storage keys

| key | contents |
| --- | --- |
| `wft-week-v1` | selected week (1–8); its absence shows the first-launch picker |
| `wft-data-v1` | current week's logs, in-progress session, profile |
| `wft-custom-v1` | user-created exercises (and routines / metrics / cardio types) |
| `wft-theme-v1` | `dark` / `light` |
| IndexedDB `wft-photos` | progress photos keyed `progress-w1` … `progress-w8` |

There is no backend yet. `project/Tech Spec.dc.html` has the proposed PostgreSQL schema and API.
