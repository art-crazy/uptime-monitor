# Uptime Monitor

<p align="center">
  <img src="./docs/readme/hero.svg" alt="Uptime Monitor hero banner" width="100%" />
</p>

<p align="center">
  <img alt="Chrome MV3" src="https://img.shields.io/badge/Chrome-MV3-185FA5?style=flat-square" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-171717?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-185FA5?style=flat-square" />
  <img alt="Local First" src="https://img.shields.io/badge/Data-Local%20First-639922?style=flat-square" />
  <img alt="Internationalization" src="https://img.shields.io/badge/i18n-Chrome%20native-E24B4A?style=flat-square" />
</p>

Мониторинг сайтов, API и хостов — прямо из браузера. Без сервера, без аккаунта, без компромиссов с платформой.

Это полноценное Manifest V3 расширение: popup и service worker разделены как положено, записью в storage управляет только background-слой, проверки идут через `chrome.alarms`, алерты — через `chrome.notifications`, иконка расширения отражает текущее состояние мониторов.

---

## Скриншоты

<table>
  <tr>
    <td align="center">
      <img src="./docs/readme/dashboard.svg" alt="Dashboard" width="240" />
    </td>
    <td align="center">
      <img src="./docs/readme/details.svg" alt="Monitor details" width="240" />
    </td>
    <td align="center">
      <img src="./docs/readme/settings.svg" alt="Settings" width="240" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Dashboard</strong><br/>Список мониторов, internet status</td>
    <td align="center"><strong>Details</strong><br/>24h chart, incidents, действия</td>
    <td align="center"><strong>Settings</strong><br/>Интервалы, уведомления, network</td>
  </tr>
</table>

---

## Архитектура

FSD (Feature-Sliced Design) с чёткими границами между popup и background:

```
src/
  app/         точка входа popup, навигация
  pages/       экраны popup
  widgets/     составные UI-блоки
  features/    пользовательские действия, side effects
  entities/    доменные типы, selectors, hooks
  shared/      helpers, UI primitives, i18n, constants
  background/  service worker, runtime команды, проверки
```

### Поток данных

```
Popup action → typed command → background validates → chrome.storage.local
                                                              ↓
                                         storage.onChanged → Popup re-renders
                                         chrome.alarms     → checks run
                                         chrome.notifications → alerts fire
                                         action icon       → reflects health
```

---


## Стек

React 19 · TypeScript 5.9 · Vite 8 · @crxjs/vite-plugin · zod · CSS Modules
`chrome.storage` · `chrome.alarms` · `chrome.notifications` · `chrome.i18n`

---

## Запуск

```bash
npm install
npm run dev    # popup в браузере без extension context
npm run build  # production → dist/
```

Загрузка в Chrome: `chrome://extensions` → Developer mode → Load unpacked → `dist/`

Работает в Chrome, Edge, Brave и любом Chromium-браузере.
