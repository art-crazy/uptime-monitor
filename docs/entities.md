# Entities

> Types are defined in `src/entities/*/model/types.ts`.
> This file describes the shape and intent of each entity — update it when types change.

## Monitor

The core entity. Represents one tracked target.

```ts
type MonitorType     = 'website' | 'api' | 'ip'
type MonitorStatus   = 'online' | 'down' | 'paused' | 'pending'
type CheckInterval   = 30 | 60 | 300 | 900  // seconds

interface Monitor {
  id:            string          // crypto.randomUUID()
  name:          string          // auto-detected from domain, editable
  url:           string          // full URL or IP/hostname
  type:          MonitorType
  interval:      CheckInterval
  status:        MonitorStatus
  lastChecked:   number | null   // Unix ms
  responseTime:  number | null   // ms, null if down
  uptimePercent: number          // 0–100, calculated from history
  incidentCount: number          // total incidents
  history:       HistoryEntry[]  // capped at HISTORY_MAX_ENTRIES (288 = 24h / 5min)
  createdAt:     number          // Unix ms
}

interface HistoryEntry {
  timestamp:    number           // Unix ms
  responseTime: number | null    // null = down
  status:       'online' | 'down'
}
```

## Incident

A period when a monitor was down.

```ts
interface Incident {
  id:        string
  monitorId: string
  startTime: number        // Unix ms — when monitor went down
  endTime:   number | null // Unix ms — when it came back; null = ongoing
}
```

Duration = `endTime - startTime`. Displayed in MonitorDetails incidents list.

## Settings

Global extension settings. Single record in storage under key `settings`.

```ts
interface Settings {
  notificationsEnabled: boolean      // default: true
  defaultInterval:      CheckInterval // default: 60 (1 min)
  pingUrl:              string        // default: '8.8.8.8'
}
```

## InternetStatus

Stored under key `internetStatus`. Updated by background on every internet ping.

```ts
interface InternetStatus {
  online:      boolean
  pingMs:      number | null  // null if offline
  lastChecked: number         // Unix ms
}
```

## Storage layout (chrome.storage.local keys)

| Key              | Type              | Notes                        |
|------------------|-------------------|------------------------------|
| `monitors`       | `Monitor[]`       | Full array, replaced on update |
| `incidents`      | `Incident[]`      | Appended; old entries pruned |
| `settings`       | `Settings`        | Single object                |
| `internetStatus` | `InternetStatus`  | Overwritten each ping        |
