import {
  getActiveIncident,
  getIncidents,
  incidentsSchema,
  type Incident,
} from '../entities/incident'
import {
  areApiMonitorConfigsEqual,
  appendHistoryEntry,
  getMonitors,
  monitorsSchema,
  type Monitor,
} from '../entities/monitor'
import {
  DEFAULT_INTERNET_STATUS,
  getInternetStatus,
  internetStatusSchema,
} from '../entities/internet'
import { DEFAULT_SETTINGS, getSettings, settingsSchema } from '../entities/settings'
import { STORAGE_KEYS } from '@shared/constants'
import { updateExtensionIcon } from './icon'
import { notifyMonitorStatusChange } from './notifications'
import { pingInternetTarget, pingMonitorTarget } from './ping'
import { enqueueBackgroundTask } from './queue'
import { writeInternetStatus, writeMonitoringData, writeMonitors } from './state'

interface RunMonitorCheckOptions {
  force?: boolean
}

interface MonitorSnapshot {
  apiConfig: Monitor['apiConfig']
  checkVersion: number
  type: Monitor['type']
  url: string
}

interface PendingMonitorCheck extends RunMonitorCheckOptions {
  force: boolean
  requestId: number
}

interface PendingInternetCheck {
  requestId: number
}

const pendingMonitorChecks = new Map<string, PendingMonitorCheck>()
const activeMonitorCheckDrains = new Map<string, Promise<void>>()
const latestMonitorRequestIds = new Map<string, number>()

let pendingInternetCheck: PendingInternetCheck | null = null
let activeInternetCheckDrain: Promise<void> | null = null
let latestInternetRequestId = 0

function getMigratedMonitors(value: unknown): {
  monitors: Monitor[]
  shouldRewrite: boolean
} | null {
  const parsedMonitors = monitorsSchema.safeParse(value)

  if (!parsedMonitors.success) {
    return null
  }

  const rawMonitors = Array.isArray(value) ? value : []
  const shouldRewrite = rawMonitors.some((monitor) => {
    if (!monitor || typeof monitor !== 'object') {
      return false
    }

    return 'type' in monitor && monitor.type === 'ip'
  })

  return {
    monitors: parsedMonitors.data,
    shouldRewrite,
  }
}

function countIncidentsForMonitor(incidents: Incident[], monitorId: string): number {
  return incidents.filter((incident) => incident.monitorId === monitorId).length
}

function matchesMonitorSnapshot(
  currentMonitor: Monitor,
  monitorSnapshot: MonitorSnapshot,
): boolean {
  return (
    areApiMonitorConfigsEqual(currentMonitor.apiConfig, monitorSnapshot.apiConfig) &&
    currentMonitor.checkVersion === monitorSnapshot.checkVersion &&
    currentMonitor.url === monitorSnapshot.url &&
    currentMonitor.type === monitorSnapshot.type
  )
}

function getMonitorCheckErrorMessage(): string {
  return 'monitor_error_check_failed'
}

function getInterruptedCheckMessage(): string {
  return 'monitor_error_check_interrupted'
}

function scheduleMonitorCheck(
  monitorId: string,
  options: RunMonitorCheckOptions,
): void {
  const requestId = (latestMonitorRequestIds.get(monitorId) ?? 0) + 1
  const currentPending = pendingMonitorChecks.get(monitorId)

  latestMonitorRequestIds.set(monitorId, requestId)
  pendingMonitorChecks.set(monitorId, {
    force: currentPending?.force === true || options.force === true,
    requestId,
  })
}

function takePendingMonitorCheck(monitorId: string): PendingMonitorCheck | null {
  const pendingCheck = pendingMonitorChecks.get(monitorId) ?? null

  if (pendingCheck) {
    pendingMonitorChecks.delete(monitorId)
  }

  return pendingCheck
}

function hasNewerMonitorRequest(monitorId: string, requestId: number): boolean {
  return latestMonitorRequestIds.get(monitorId) !== requestId
}

function scheduleInternetCheck(): void {
  latestInternetRequestId += 1
  pendingInternetCheck = {
    requestId: latestInternetRequestId,
  }
}

function takePendingInternetCheck(): PendingInternetCheck | null {
  const nextPendingInternetCheck = pendingInternetCheck
  pendingInternetCheck = null
  return nextPendingInternetCheck
}

function hasNewerInternetRequest(requestId: number): boolean {
  return latestInternetRequestId !== requestId
}

export async function ensureStorageDefaults(): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.monitors,
      STORAGE_KEYS.incidents,
      STORAGE_KEYS.settings,
      STORAGE_KEYS.internetStatus,
    ])
    const nextValues: Record<string, unknown> = {}
    const migratedMonitors = getMigratedMonitors(stored[STORAGE_KEYS.monitors])

    if (!migratedMonitors) {
      nextValues[STORAGE_KEYS.monitors] = []
    } else if (migratedMonitors.shouldRewrite) {
      nextValues[STORAGE_KEYS.monitors] = migratedMonitors.monitors
    }

    if (!incidentsSchema.safeParse(stored[STORAGE_KEYS.incidents]).success) {
      nextValues[STORAGE_KEYS.incidents] = []
    }

    if (!settingsSchema.safeParse(stored[STORAGE_KEYS.settings]).success) {
      nextValues[STORAGE_KEYS.settings] = DEFAULT_SETTINGS
    }

    if (!internetStatusSchema.safeParse(stored[STORAGE_KEYS.internetStatus]).success) {
      nextValues[STORAGE_KEYS.internetStatus] = DEFAULT_INTERNET_STATUS
    }

    if (Object.keys(nextValues).length > 0) {
      await chrome.storage.local.set(nextValues)
    }
  })
}

export async function reconcileMonitorCheckState(): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const monitors = await getMonitors()
    let hasChanges = false
    const nextMonitors: Monitor[] = monitors.map((monitor) => {
      if (monitor.checkState !== 'running') {
        return monitor
      }

      hasChanges = true

      return {
        ...monitor,
        checkState: 'idle',
        lastCheckError: monitor.lastCheckError ?? getInterruptedCheckMessage(),
      }
    })

    if (hasChanges) {
      await writeMonitors(nextMonitors)
    }
  })
}

async function runMonitorCheckOnce(
  monitorId: string,
  requestId: number,
  options: RunMonitorCheckOptions = {},
): Promise<void> {
  const force = options.force ?? false
  const [monitors, internet] = await Promise.all([getMonitors(), getInternetStatus()])
  const monitor = monitors.find((entry) => entry.id === monitorId)

  if (!monitor) {
    return
  }

  if (monitor.status === 'paused' && !force) {
    await updateExtensionIcon(monitors, internet)
    return
  }

  const monitorSnapshot: MonitorSnapshot = {
    apiConfig: monitor.apiConfig,
    checkVersion: monitor.checkVersion,
    type: monitor.type,
    url: monitor.url,
  }

  await enqueueBackgroundTask(async () => {
    const currentMonitors = await getMonitors()
    const monitorIndex = currentMonitors.findIndex(
      (currentMonitor) => currentMonitor.id === monitorId,
    )

    if (monitorIndex === -1) {
      return
    }

    const currentMonitor = currentMonitors[monitorIndex]

    if (
      (currentMonitor.status === 'paused' && !force) ||
      !matchesMonitorSnapshot(currentMonitor, monitorSnapshot)
    ) {
      return
    }

    if (currentMonitor.checkState === 'running' && currentMonitor.lastCheckError === null) {
      return
    }

    const nextMonitors = [...currentMonitors]
    nextMonitors[monitorIndex] = {
      ...currentMonitor,
      checkState: 'running',
      lastCheckError: null,
    }

    await writeMonitors(nextMonitors)
  })

  let result: Awaited<ReturnType<typeof pingMonitorTarget>>

  try {
    result = await pingMonitorTarget(
      monitorSnapshot.url,
      monitorSnapshot.type,
      monitorSnapshot.apiConfig,
    )
  } catch (error) {
    await enqueueBackgroundTask(async () => {
      const currentMonitors = await getMonitors()
      const monitorIndex = currentMonitors.findIndex(
        (currentMonitor) => currentMonitor.id === monitorId,
      )

      if (monitorIndex === -1) {
        return
      }

      const currentMonitor = currentMonitors[monitorIndex]

      if (
        hasNewerMonitorRequest(monitorId, requestId) ||
        !matchesMonitorSnapshot(currentMonitor, monitorSnapshot)
      ) {
        return
      }

      const nextMonitors = [...currentMonitors]
      nextMonitors[monitorIndex] = {
        ...currentMonitor,
        checkState: 'idle',
        lastCheckError: getMonitorCheckErrorMessage(),
      }

      await writeMonitors(nextMonitors)
    })

    throw error
  }

  await enqueueBackgroundTask(async () => {
    const [currentMonitors, incidents, settings, internet] = await Promise.all([
      getMonitors(),
      getIncidents(),
      getSettings(),
      getInternetStatus(),
    ])
    const monitorIndex = currentMonitors.findIndex(
      (currentMonitor) => currentMonitor.id === monitorId,
    )

    if (monitorIndex === -1) {
      return
    }

    const currentMonitor = currentMonitors[monitorIndex]

    if (currentMonitor.status === 'paused' && !force) {
      await updateExtensionIcon(currentMonitors, internet)
      return
    }

    if (
      !matchesMonitorSnapshot(currentMonitor, monitorSnapshot) ||
      hasNewerMonitorRequest(monitorId, requestId)
    ) {
      return
    }

    const now = Date.now()
    const nextStatus = result.ok ? 'online' : 'down'
    const shouldTrackIncidents = currentMonitor.status !== 'paused'
    let nextIncidents = [...incidents]
    const activeIncident = getActiveIncident(nextIncidents, currentMonitor.id)

    if (shouldTrackIncidents && nextStatus === 'down' && !activeIncident) {
      nextIncidents.push({
        id: crypto.randomUUID(),
        monitorId: currentMonitor.id,
        startTime: now,
        endTime: null,
      })
    }

    if (shouldTrackIncidents && nextStatus === 'online' && activeIncident) {
      nextIncidents = nextIncidents.map((incident) =>
        incident.id === activeIncident.id
          ? {
              ...incident,
              endTime: now,
            }
          : incident,
      )
    }

    const nextHistory = appendHistoryEntry(currentMonitor.history, {
      timestamp: now,
      responseTime: result.ok ? result.responseTime : null,
      status: nextStatus,
    })
    const nextMonitor: Monitor = shouldTrackIncidents
      ? {
          ...currentMonitor,
          checkState: 'idle',
          lastCheckError: result.ok ? null : (result.errorKey ?? null),
          status: nextStatus,
          lastChecked: now,
          responseTime: result.ok ? result.responseTime : null,
          history: nextHistory,
          incidentCount: countIncidentsForMonitor(nextIncidents, currentMonitor.id),
        }
      : {
          ...currentMonitor,
          checkState: 'idle',
          lastCheckError: null,
          lastChecked: now,
        }
    const nextMonitors = [...currentMonitors]
    nextMonitors[monitorIndex] = nextMonitor

    await writeMonitoringData(nextMonitors, nextIncidents)

    if (currentMonitor.status !== nextMonitor.status) {
      await notifyMonitorStatusChange(currentMonitor, nextMonitor, settings)
    }

    await updateExtensionIcon(nextMonitors, internet)
  })
}

async function drainMonitorChecks(monitorId: string): Promise<void> {
  while (true) {
    const pendingCheck = takePendingMonitorCheck(monitorId)

    if (!pendingCheck) {
      return
    }

    try {
      await runMonitorCheckOnce(monitorId, pendingCheck.requestId, pendingCheck)
    } catch (error) {
      console.error(`[background] runMonitorCheck:${monitorId}`, error)
    }
  }
}

export async function runMonitorCheck(
  monitorId: string,
  options: RunMonitorCheckOptions = {},
): Promise<void> {
  scheduleMonitorCheck(monitorId, options)

  const activeDrain = activeMonitorCheckDrains.get(monitorId)

  if (activeDrain) {
    await activeDrain
    return
  }

  const drainPromise = drainMonitorChecks(monitorId).finally(() => {
    activeMonitorCheckDrains.delete(monitorId)
  })

  activeMonitorCheckDrains.set(monitorId, drainPromise)
  await drainPromise
}

async function runInternetCheckOnce(requestId: number): Promise<void> {
  const settings = await getSettings()
  const pingUrlSnapshot = settings.pingUrl
  const result = await pingInternetTarget(pingUrlSnapshot)

  await enqueueBackgroundTask(async () => {
    const currentSettings = await getSettings()

    if (currentSettings.pingUrl !== pingUrlSnapshot) {
      return
    }

    if (hasNewerInternetRequest(requestId)) {
      return
    }

    await writeInternetStatus({
      online: result.ok,
      pingMs: result.ok ? result.responseTime : null,
      lastChecked: Date.now(),
    })
  })
}

async function drainInternetChecks(): Promise<void> {
  while (true) {
    const pendingCheck = takePendingInternetCheck()

    if (!pendingCheck) {
      return
    }

    await runInternetCheckOnce(pendingCheck.requestId)
  }
}

export async function runInternetCheck(): Promise<void> {
  scheduleInternetCheck()

  if (activeInternetCheckDrain) {
    await activeInternetCheckDrain
    return
  }

  const drainPromise = drainInternetChecks().finally(() => {
    activeInternetCheckDrain = null
  })

  activeInternetCheckDrain = drainPromise
  await drainPromise
}

export async function runAllMonitorChecks(): Promise<void> {
  const monitors = await getMonitors()
  const activeMonitors = monitors.filter((monitor) => monitor.status !== 'paused')

  await Promise.allSettled(activeMonitors.map((monitor) => runMonitorCheck(monitor.id)))
}

export async function refreshIconFromStorage(): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const [monitors, internet] = await Promise.all([getMonitors(), getInternetStatus()])
    await updateExtensionIcon(monitors, internet)
  })
}
