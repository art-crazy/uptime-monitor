# Entities

> Types are defined in `src/entities/*/model/types.ts`.
> Update this file when the persisted entity model changes.

## Monitor

The core entity. Represents one tracked target.

```ts
type MonitorType = 'website' | 'api' | 'host'
type MonitorStatus = 'online' | 'down' | 'paused' | 'pending'
type MonitorCheckState = 'idle' | 'running'
type CheckInterval = 30 | 60 | 300 | 900 // seconds

interface Monitor {
  id: string
  name: string
  url: string
  type: MonitorType
  interval: CheckInterval
  status: MonitorStatus
  checkState: MonitorCheckState
  lastCheckError: string | null
  lastChecked: number | null
  responseTime: number | null
  uptimePercent: number
  incidentCount: number
  history: HistoryEntry[]
  checkVersion: number
  createdAt: number
}

interface HistoryEntry {
  timestamp: number
  responseTime: number | null
  status: 'online' | 'down'
}
```

Notes:

- `host` means a browser-reachable host or IP target checked over HTTP/HTTPS.
- Legacy stored values with `type: 'ip'` are migrated to `host` during background initialization.
- `checkState`, `lastCheckError`, and `checkVersion` are runtime-safety fields used by the background worker.

## Incident

A period when a monitor was down.

```ts
interface Incident {
  id: string
  monitorId: string
  startTime: number
  endTime: number | null
}
```

Duration is `endTime - startTime`.

## Settings

Global extension settings. Stored under the `settings` key.

```ts
interface Settings {
  notificationsEnabled: boolean
  defaultInterval: CheckInterval
  pingUrl: string
}
```

## InternetStatus

Stored under the `internetStatus` key. Updated by the background worker.

```ts
interface InternetStatus {
  online: boolean
  pingMs: number | null
  lastChecked: number
}
```

## Storage layout

| Key              | Type             | Notes                         |
|------------------|------------------|-------------------------------|
| `monitors`       | `Monitor[]`      | Full array, replaced on write |
| `incidents`      | `Incident[]`     | Rewritten together with monitors when needed |
| `settings`       | `Settings`       | Single object                 |
| `internetStatus` | `InternetStatus` | Overwritten on each connectivity check |
