# Agent Navigation Guide

## Project layout (top level)

```
src/
  app/          <- React entry, global styles, root router
  pages/        <- Full screens rendered in the popup
  widgets/      <- Composite UI blocks, assembled from features/entities
  features/     <- User-facing interactions with side effects
  entities/     <- Business entities: data types, storage access, display logic
  shared/       <- Constants, runtime helpers, UI primitives, shared React hooks
  background/   <- Service worker only, not part of FSD, separate entry point
public/
  icons/        <- icon16.png, icon32.png, icon48.png, icon128.png
docs/
  architecture.md
  entities.md
  mockups/
vite.config.ts  <- MV3 manifest source via @crxjs/vite-plugin
```

## FSD import rule (strict)

Imports flow downward only:

```
app -> pages -> widgets -> features -> entities -> shared
```

- A layer may import from layers below it only.
- Slices within the same layer must not import each other.
- Cross-slice communication goes through the layer above, or through shared primitives.

## Layer responsibilities

| Layer      | What belongs here                                              | What does NOT belong |
|------------|----------------------------------------------------------------|----------------------|
| `app`      | `main.tsx`, global CSS, root `<App>` with router state         | Business logic       |
| `pages`    | Screen components (`Dashboard`, `AddMonitor`, `MonitorDetails`, `Settings`) | Direct storage or runtime commands |
| `widgets`  | Composite UI blocks like `MonitorList`, `InternetStatus`, `ResponseChart` | Direct storage calls |
| `features` | User actions such as add/check/toggle/delete/update settings   | Entity persistence details |
| `entities` | `Monitor`, `Incident`, `Settings`, `Internet` types, selectors, hooks | Screen composition   |
| `shared`   | `lib/`, `hooks/`, `ui/`, constants, generic helpers           | App-specific logic   |

## Public API rule

Each slice exposes only what is listed in its `index.ts`.
Never import from internal paths like `entities/monitor/model/types` - use `entities/monitor` only.

## Chrome extension specifics

### Two separate worlds

| Context    | Entry point                          | Has DOM | Has `chrome.alarms` |
|------------|--------------------------------------|---------|---------------------|
| Popup      | `src/app/main.tsx`                   | yes     | no                  |
| Background | `src/background/service-worker.ts`   | no      | yes                 |

### Manifest and build

- The MV3 manifest is declared in `vite.config.ts` with `defineManifest(...)`.
- `public/` stores only static assets such as icons.
- `@crxjs/vite-plugin` generates the final `dist/manifest.json` and bundles popup/background entries.

### Communication pattern

```ts
// Popup -> Background (command)
chrome.runtime.sendMessage({ type: 'CHECK_NOW', monitorId: '...' })

// Background -> Popup (state sync)
chrome.storage.onChanged.addListener((changes) => { ... })
```

### Alarm naming convention

```
monitor:<id>   <- per-monitor check interval
internet-ping  <- global internet availability check
```

## Screens (pages layer)

| Page             | Route key   | Description                               |
|------------------|-------------|-------------------------------------------|
| Dashboard        | `dashboard` | Monitor list or empty state               |
| AddMonitor       | `add`       | Form to create or edit a monitor          |
| MonitorDetails   | `details`   | Stats, chart, incidents for one monitor   |
| Settings         | `settings`  | Notifications, default interval, network target |

Navigation is managed in `src/app/App.tsx` as local state. React Router is intentionally not used because the popup is a 4-screen SPA.
