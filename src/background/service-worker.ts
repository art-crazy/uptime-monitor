import {
  getMonitors,
  monitorsSchema,
  type Monitor,
} from '../entities/monitor'
import { settingsSchema } from '../entities/settings'
import {
  INTERNET_ALARM_NAME,
} from '@shared/constants'
import {
  didMonitorSchedulesChange,
  ensureInternetAlarm,
  getMonitorIdFromAlarmName,
  syncMonitorAlarms,
} from './alarms'
import { handleRuntimeMessage } from './commands'
import {
  ensureStorageDefaults,
  reconcileMonitorCheckState,
  refreshIconFromStorage,
  runAllMonitorChecks,
  runInternetCheck,
  runMonitorCheck,
} from './checks'
import { didExtensionIconStateChange } from './icon'

type TaskContext =
  | 'bootstrap:onInstalled'
  | 'bootstrap:onStartup'
  | 'storage:onChanged:syncFromStorage'
  | 'storage:onChanged:refreshIconFromStorage'
  | 'storage:onChanged:internetStatus:refreshIcon'
  | 'storage:onChanged:runInternetCheck'
  | 'runtime:onMessage'
  | `alarms:onAlarm:${string}`

function logBackgroundError(context: TaskContext, error: unknown): void {
  console.error(`[background] ${context}`, error)
}

function runBackgroundTask(
  task: Promise<void>,
  context: TaskContext,
): void {
  void task.catch((error) => {
    logBackgroundError(context, error)
  })
}

async function syncFromStorage(): Promise<void> {
  const monitors = await getMonitors()
  await Promise.all([syncMonitorAlarms(monitors), refreshIconFromStorage()])
}

function getChangedMonitors(
  change: chrome.storage.StorageChange,
): { nextMonitors: Monitor[]; previousMonitors: Monitor[] } | null {
  const previousMonitors = monitorsSchema.safeParse(change.oldValue)
  const nextMonitors = monitorsSchema.safeParse(change.newValue)

  if (!previousMonitors.success || !nextMonitors.success) {
    return null
  }

  return {
    previousMonitors: previousMonitors.data,
    nextMonitors: nextMonitors.data,
  }
}

function didPingUrlChange(change: chrome.storage.StorageChange): boolean {
  const previousSettings = settingsSchema.safeParse(change.oldValue)
  const nextSettings = settingsSchema.safeParse(change.newValue)

  if (!previousSettings.success || !nextSettings.success) {
    return true
  }

  return previousSettings.data.pingUrl !== nextSettings.data.pingUrl
}

async function bootstrap(runChecks: boolean): Promise<void> {
  await ensureInitialized()

  if (runChecks) {
    await Promise.all([runInternetCheck(), runAllMonitorChecks()])
  }
}

let initializationPromise: Promise<void> | null = null
let isInitializing = false

async function ensureInitialized(): Promise<void> {
  if (!initializationPromise) {
    isInitializing = true
    initializationPromise = (async () => {
      await ensureStorageDefaults()
      await reconcileMonitorCheckState()
      await Promise.all([syncFromStorage(), ensureInternetAlarm()])
    })()
      .catch((error) => {
        initializationPromise = null
        throw error
      })
      .finally(() => {
        isInitializing = false
      })
  }

  await initializationPromise
}

chrome.runtime.onInstalled.addListener(() => {
  runBackgroundTask(bootstrap(true), 'bootstrap:onInstalled')
})

chrome.runtime.onStartup.addListener(() => {
  runBackgroundTask(bootstrap(true), 'bootstrap:onStartup')
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || isInitializing) {
    return
  }

  if (changes.monitors) {
    const changedMonitors = getChangedMonitors(changes.monitors)

    if (
      changedMonitors === null ||
      didMonitorSchedulesChange(
        changedMonitors.previousMonitors,
        changedMonitors.nextMonitors,
      )
    ) {
      runBackgroundTask(syncFromStorage(), 'storage:onChanged:syncFromStorage')
    } else if (
      didExtensionIconStateChange(
        changedMonitors.previousMonitors,
        changedMonitors.nextMonitors,
      )
    ) {
      runBackgroundTask(refreshIconFromStorage(), 'storage:onChanged:refreshIconFromStorage')
    }
  }

  if (changes.internetStatus) {
    runBackgroundTask(refreshIconFromStorage(), 'storage:onChanged:internetStatus:refreshIcon')
  }

  if (changes.settings && didPingUrlChange(changes.settings)) {
    runBackgroundTask(runInternetCheck(), 'storage:onChanged:runInternetCheck')
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  runBackgroundTask(
    ensureInitialized().then(async () => {
      if (alarm.name === INTERNET_ALARM_NAME) {
        await runInternetCheck()
        return
      }

      const monitorId = getMonitorIdFromAlarmName(alarm.name)

      if (monitorId) {
        await runMonitorCheck(monitorId)
      }
    }),
    `alarms:onAlarm:${alarm.name}`,
  )
})

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    void ensureInitialized()
      .then(() => handleRuntimeMessage(message))
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: unknown) => {
        logBackgroundError('runtime:onMessage', error)
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      })

    return true
  },
)
