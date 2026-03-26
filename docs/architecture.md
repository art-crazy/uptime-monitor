# Architecture

## Full directory tree (skeleton)

```
src/
  app/
    styles/
      global.css
    main.tsx                        ← ReactDOM.createRoot → <App />
    App.tsx                         ← screen router (local state, no library)

  pages/
    dashboard/
      index.ts
      ui/
        Dashboard.tsx
    add-monitor/
      index.ts
      ui/
        AddMonitor.tsx
    monitor-details/
      index.ts
      ui/
        MonitorDetails.tsx
    settings/
      index.ts
      ui/
        Settings.tsx

  widgets/
    monitor-list/
      index.ts
      ui/
        MonitorList.tsx             ← renders list of MonitorRow entities
    internet-status/
      index.ts
      ui/
        InternetStatus.tsx          ← green/red banner with ping ms
    response-chart/
      index.ts
      ui/
        ResponseChart.tsx           ← 24h bar chart (custom SVG)

  features/
    add-monitor/
      index.ts
      model/
        validation.ts               ← URL/hostname validation
        defaults.ts                 ← name auto-detection from domain
      ui/
        AddMonitorForm.tsx
    toggle-monitor/
      index.ts
      toggleMonitor.ts              ← pause / resume
    check-monitor/
      index.ts
      checkNow.ts                   ← sends CHECK_NOW message to background
    delete-monitor/
      index.ts
      deleteMonitor.ts

  entities/
    monitor/
      index.ts
      model/
        types.ts                    ← Monitor, MonitorType, MonitorStatus, CheckInterval
        storage.ts                  ← CRUD via chrome.storage.local
        selectors.ts                ← uptimePercent, avgResponse helpers
      ui/
        MonitorRow.tsx              ← single row in the list
        StatusDot.tsx
        ResponseTime.tsx            ← colored ms value
    incident/
      index.ts
      model/
        types.ts                    ← Incident
        storage.ts
      ui/
        IncidentRow.tsx
    settings/
      index.ts
      model/
        types.ts                    ← Settings
        storage.ts
        defaults.ts
    internet/
      index.ts
      model/
        types.ts                    ← InternetStatus
        storage.ts

  shared/
    lib/
      storage.ts                    ← typed chrome.storage.local get/set wrappers
      notifications.ts              ← chrome.notifications.create helpers
    constants/
      index.ts                      ← RESPONSE_THRESHOLDS, DEFAULT_PING_URL, HISTORY_MAX_ENTRIES
    ui/
      Button.tsx
      Toggle.tsx                    ← single-select pill group (30s/1min/5min/15min)
      Badge.tsx                     ← UP / DOWN / PAUSED labels

  background/
    service-worker.ts               ← entry: registers alarms, listens to messages
    ping.ts                         ← fetch with timeout → { ok, responseTime }
    alarms.ts                       ← create/remove/sync alarms per monitor
    icon.ts                         ← setIcon gray/green + setBadgeText red N
    notifications.ts                ← down/up notification helpers

public/
  manifest.json
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
```

## Build output (dist/)

```
dist/
  index.html          ← popup
  popup.js            ← React bundle
  background.js       ← service worker (separate rollup entry)
  manifest.json
  icons/
```

Vite is configured with two rollup entry points: `index.html` (popup) and
`src/background/service-worker.ts`. Output filenames are deterministic (no hash)
so `manifest.json` can reference them by name.

## Response time thresholds

| Range         | Color  | Meaning |
|---------------|--------|---------|
| < 300 ms      | green  | Good    |
| 300–1000 ms   | orange | Slow    |
| > 1000 ms     | red    | Bad     |
| no response   | red    | Down    |

## Extension icon states

| State                   | Icon color | Badge        |
|-------------------------|------------|--------------|
| No monitors             | gray       | —            |
| All online              | green      | —            |
| N monitors down         | red        | N (red bg)   |

## Data flow: periodic check

```
chrome.alarms → service-worker.ts
  → ping.ts (fetch with timeout)
  → update monitor in chrome.storage.local
  → if status changed → notifications.ts (browser notification)
  → icon.ts (recount down monitors → update badge)
  → popup reacts via chrome.storage.onChanged
```

## Data flow: user adds monitor

```
AddMonitorForm (feature) → storage.ts (entity)
  → chrome.storage.local.set
  → background: storage.onChanged → alarms.ts → create alarm for new monitor
  → popup: storage.onChanged → re-render MonitorList
```
