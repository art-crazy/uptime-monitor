export const STORAGE_KEYS = {
  monitors: 'monitors',
  incidents: 'incidents',
  settings: 'settings',
  internetStatus: 'internetStatus',
} as const

export const CHECK_INTERVAL_OPTIONS = [
  { value: 30, minutes: 0.5 },
  { value: 60, minutes: 1 },
  { value: 300, minutes: 5 },
  { value: 900, minutes: 15 },
] as const

export const RESPONSE_THRESHOLDS = {
  good: 300,
  slow: 1000,
} as const

export const HISTORY_MAX_ENTRIES = 288
export const DEFAULT_PING_URL = '8.8.8.8'
export const INTERNET_ALARM_NAME = 'internet-ping'
export const MONITOR_ALARM_PREFIX = 'monitor:'
export const CHECK_TIMEOUT_MS = 10_000
export const MIN_LOADING_MS = 600
export const INTERNET_TIMEOUT_MS = 5_000
export const INTERNET_CHECK_MINUTES = 0.5

export const MESSAGE_TYPES = {
  checkNow: 'CHECK_NOW',
  saveMonitor: 'SAVE_MONITOR',
  toggleMonitor: 'TOGGLE_MONITOR',
  deleteMonitor: 'DELETE_MONITOR',
  clearAllMonitoringData: 'CLEAR_ALL_MONITORING_DATA',
  setNotificationsEnabled: 'SET_NOTIFICATIONS_ENABLED',
  setDefaultCheckInterval: 'SET_DEFAULT_CHECK_INTERVAL',
  setPingUrl: 'SET_PING_URL',
} as const

export type CheckIntervalValue =
  (typeof CHECK_INTERVAL_OPTIONS)[number]['value']
