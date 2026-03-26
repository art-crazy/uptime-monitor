# Architecture

## Overview

`Uptime Monitor` is a Chromium MV3 extension with two runtime contexts:

- Popup UI: React SPA rendered from `src/app/main.tsx`
- Background worker: service worker entry at `src/background/service-worker.ts`

The popup never writes directly to `chrome.storage.local`. User actions are sent to the background as runtime commands, and UI state is synchronized back through storage subscriptions.

## Source layout

```
src/
  app/
    App.tsx
    App.module.css
    main.tsx
    styles/
      global.css

  pages/
    add-monitor/
    dashboard/
    monitor-details/
    settings/

  widgets/
    internet-status/
    monitor-list/
    response-chart/

  features/
    add-monitor/
    check-monitor/
    clear-monitoring-data/
    delete-monitor/
    toggle-monitor/
    update-settings/

  entities/
    incident/
    internet/
    monitor/
    settings/

  shared/
    constants/
    hooks/
    lib/
    ui/

  background/
    alarms.ts
    checks.ts
    commands.ts
    icon.ts
    notifications.ts
    ping.ts
    queue.ts
    service-worker.ts
    state.ts

public/
  icons/

docs/
  architecture.md
  entities.md
  mockups/

vite.config.ts
```

## FSD boundaries

Popup code follows strict downward imports:

```
app -> pages -> widgets -> features -> entities -> shared
```

Rules:

- Same-layer slices do not import each other.
- Public imports go only through slice `index.ts`.
- `background/` is outside FSD and acts as the extension command/runtime layer.

## Build pipeline

The manifest is declared in `vite.config.ts` with `defineManifest(...)` from `@crxjs/vite-plugin`.

Important consequences:

- There is no `public/manifest.json` source file.
- `public/` contains only static assets, currently icons.
- The plugin generates `dist/manifest.json`, popup assets, and the service worker loader.

Typical build output:

```
dist/
  assets/
    index-*.css
    index.html-*.js
    service-worker.ts-*.js
    settings-*.css
    settings-*.js
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
  index.html
  manifest.json
  service-worker-loader.js
```

## Runtime contexts

### Popup

Responsibilities:

- Render dashboard, add/edit form, details page, and settings page
- Read synchronized state from `chrome.storage.local` through entity hooks
- Send user commands to the background through `chrome.runtime.sendMessage`

Key files:

- `src/app/App.tsx`
- `src/entities/*/model/hooks.ts`
- `src/shared/hooks/useStorageValue.ts`
- `src/shared/lib/runtime.ts`

### Background

Responsibilities:

- Validate and execute popup commands
- Schedule periodic checks with `chrome.alarms`
- Persist normalized state to `chrome.storage.local`
- Send browser notifications on monitor state transitions
- Update extension icon and badge

Key files:

- `src/background/service-worker.ts`
- `src/background/commands.ts`
- `src/background/checks.ts`
- `src/background/alarms.ts`
- `src/background/icon.ts`

## Data model

Core persisted entities:

- `monitors`
- `incidents`
- `settings`
- `internetStatus`

Storage keys live in `src/shared/constants/index.ts`.

Background writes related state in batches through `src/background/state.ts`, which uses typed storage helpers from `src/shared/lib/storage.ts`.

## Popup -> background command flow

Example:

```ts
chrome.runtime.sendMessage({
  type: 'SAVE_MONITOR',
  monitorDraft: { id, url, type, interval },
})
```

Flow:

1. Popup feature sends a typed command through `src/shared/lib/runtime.ts`
2. `service-worker.ts` validates initialization and forwards to `handleRuntimeMessage(...)`
3. `commands.ts` validates payloads with `zod`
4. Background mutates storage through `state.ts`
5. Popup re-renders from `chrome.storage.onChanged` through entity hooks

This keeps the background as the single writer for extension state.

## Periodic monitor checks

Alarm naming:

- `monitor:<id>`
- `internet-ping`

Monitor flow:

1. `chrome.alarms` fires in `service-worker.ts`
2. `runMonitorCheck(...)` in `checks.ts` schedules or coalesces the request
3. `pingMonitorTarget(...)` in `ping.ts` performs the HTTP(S) availability check
4. Background updates monitor status, history, incidents, notifications, and icon state
5. Popup receives the new state from storage subscriptions

The monitor lifecycle includes transient fields such as:

- `checkState`
- `lastCheckError`
- `checkVersion`

These fields prevent stale writes and allow the popup to render real check progress without guessing from timestamps.

## Internet connectivity checks

The extension cannot perform real ICMP ping from MV3. Internet status is therefore modeled as an HTTP(S) connectivity probe.

Notes:

- Default target remains `8.8.8.8` at the settings level
- Background normalizes that into browser-safe HTTP(S) candidates in `ping.ts`
- UI uses wording such as `response` and `connectivity target` instead of claiming ICMP ping

## Monitor types

Supported monitor types:

- `website`
- `api`
- `host`

`host` means an HTTP(S)-reachable host or IP target within browser limits. It is not a raw TCP or ICMP server ping.

## Notifications and icon state

Notifications:

- Generated in `src/background/notifications.ts`
- Triggered only when a monitor changes between `online` and `down`

Icon state:

- Gray: no monitors
- Green: monitors exist and none are down
- Red badge: one or more monitors are down

Icon logic is implemented in `src/background/icon.ts`.

## Hydration and popup routing

Routing is local state in `src/app/App.tsx`.

Route keys:

- `dashboard`
- `add`
- `details`
- `settings`

Before rendering the main screens, the popup waits for all entity hooks to finish initial hydration:

- `useMonitors()`
- `useIncidents()`
- `useSettings()`
- `useInternetStatus()`

This avoids rendering incorrect defaults before storage has loaded.

## Failure handling

Background initialization is idempotent:

- storage defaults are ensured
- stranded `checkState: 'running'` values are reconciled on worker startup
- alarms and icon state are resynced from storage

This is necessary because MV3 service workers can be suspended and restarted at any time.
