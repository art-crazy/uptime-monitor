# Agent Navigation Guide

## Project layout (top level)

```
src/
  app/          ← React entry, global styles, root router
  pages/        ← Full screens rendered in the popup
  widgets/      ← Composite UI blocks, assembled from features/entities
  features/     ← User-facing interactions with side effects
  entities/     ← Business entities: data types, storage access, display logic
  shared/       ← Framework-agnostic utilities, UI primitives, constants
  background/   ← Service worker only — NOT part of FSD, separate entry point
public/
  manifest.json
  icons/        ← icon16.png, icon32.png, icon48.png, icon128.png
docs/
  architecture.md
  entities.md
```

## FSD import rule (strict)

Imports flow **downward only**:

```
app → pages → widgets → features → entities → shared
```

- A layer may import from layers **below** it only.
- Slices within the same layer must **not** import each other.
- Cross-slice communication goes through the layer above (or via shared events/store).

## Layer responsibilities

| Layer      | What belongs here                                              | What does NOT belong |
|------------|----------------------------------------------------------------|----------------------|
| `app`      | `main.tsx`, global CSS, root `<App>` with router state        | Business logic       |
| `pages`    | Screen components (Dashboard, AddMonitor, MonitorDetails, Settings) | Data fetching logic |
| `widgets`  | MonitorList, InternetStatus, ResponseChart                     | Direct storage calls |
| `features` | AddMonitorForm, ToggleMonitor, CheckNow, DeleteMonitor         | Raw entity types     |
| `entities` | Monitor, Incident, Settings, Internet — types + storage hooks | UI composition       |
| `shared`   | `lib/storage.ts`, `lib/notifications.ts`, `ui/`, `constants/` | App-specific logic   |

## Public API rule

Each slice exposes only what is listed in its `index.ts`.
Never import from internal paths like `entities/monitor/model/types` — use `entities/monitor` only.

## Chrome extension specifics

### Two separate worlds

| Context    | Entry point                 | Has DOM | Has chrome.alarms |
|------------|-----------------------------|---------|-------------------|
| Popup      | `src/app/main.tsx`          | yes     | no (limited)      |
| Background | `src/background/service-worker.ts` | no | yes          |

### Communication pattern

```ts
// Popup → Background (command)
chrome.runtime.sendMessage({ type: 'CHECK_NOW', monitorId: '...' })

// Background → Popup (state sync)
chrome.storage.onChanged.addListener((changes) => { ... })
```

### Alarm naming convention

```
monitor:<id>        ← per-monitor check interval
internet-ping       ← global internet status check
```

## Screens (pages layer)

| Page             | Route key   | Description                          |
|------------------|-------------|--------------------------------------|
| Dashboard        | `dashboard` | Monitor list or empty state          |
| AddMonitor       | `add`       | Form to create a new monitor         |
| MonitorDetails   | `details`   | Stats, chart, incidents for one monitor |
| Settings         | `settings`  | Notifications, intervals, ping URL   |

Navigation is managed in `src/app/App.tsx` as local state (no React Router — popup is a SPA with 4 screens, routing overhead is not justified).
