# Uptime Monitor — Claude Entry

Start with `AGENTS.md` for navigation rules and architecture constraints.
For detailed layer structure, read `docs/architecture.md`.

## What this is

Chrome Extension (Manifest V3) that monitors uptime of websites, APIs, and servers.
No external servers. All data in `chrome.storage.local`.

## Tech stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| UI            | React 19 + TypeScript 5.9         |
| Build         | Vite 8                            |
| Icons         | Lucide React                      |
| Extension API | Chrome MV3 (alarms, notifications, storage) |
| Architecture  | FSD (Feature-Sliced Design)       |

## Commands

```bash
npm run dev      # development (popup only, no extension context)
npm run build    # production build → dist/
npm run lint     # ESLint
```

Load extension: open `chrome://extensions` → Developer mode → Load unpacked → select `dist/`.

## Key constraints

- Popup (`src/app` → `src/pages`) and background (`src/background`) are **separate entry points**
- They communicate only via `chrome.runtime.sendMessage` / `chrome.storage.onChanged`
- Follow FSD import rules strictly — see `AGENTS.md`
- No external API calls except fetch to monitored URLs and ping target
