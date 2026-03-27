import {
  getActiveIncident,
  getIncidents,
} from '../entities/incident'
import {
  areApiMonitorConfigsEqual,
  getMonitorDisplayName,
  getMonitors,
  normalizeApiMonitorConfig,
  normalizeMonitorTarget,
  type Monitor,
} from '../entities/monitor'
import { getSettings } from '../entities/settings'
import { MESSAGE_TYPES } from '@shared/constants'
import { normalizeNetworkTarget } from '@shared/lib/network'
import {
  runtimeMessageSchema,
  type RuntimeCommand,
  type SaveMonitorDraftPayload,
} from '@shared/lib/runtime-contract'
import { runMonitorCheck } from './checks'
import { enqueueBackgroundTask } from './queue'
import { writeMonitoringData, writeSettings } from './state'

function triggerMonitorCheck(
  monitorId: string,
  options?: { force?: boolean },
): void {
  void runMonitorCheck(monitorId, options).catch((error) => {
    console.error(`[background] runMonitorCheck:${monitorId}`, error)
  })
}

function upsertMonitor(monitors: Monitor[], monitor: Monitor): Monitor[] {
  const index = monitors.findIndex((entry) => entry.id === monitor.id)

  if (index === -1) {
    return [...monitors, monitor]
  }

  const nextMonitors = [...monitors]
  nextMonitors[index] = monitor
  return nextMonitors
}

async function saveMonitorCommand(
  monitorDraft: SaveMonitorDraftPayload,
): Promise<{ monitorId: string }> {
  const normalizedUrl = normalizeMonitorTarget(monitorDraft.url, monitorDraft.type)
  const normalizedApiConfig = normalizeApiMonitorConfig(monitorDraft.apiConfig)

  if (!normalizedUrl) {
    throw new Error('Invalid monitor target')
  }

  const result = await enqueueBackgroundTask(async () => {
    const [monitors, incidents] = await Promise.all([getMonitors(), getIncidents()])
    const existingMonitor =
      monitors.find((entry) => entry.id === monitorDraft.id) ?? null
    const targetChanged =
      existingMonitor !== null &&
      (existingMonitor.url !== normalizedUrl ||
        existingMonitor.type !== monitorDraft.type ||
        !areApiMonitorConfigsEqual(existingMonitor.apiConfig, normalizedApiConfig))

    const nextMonitor: Monitor =
      existingMonitor === null
        ? {
            apiConfig: normalizedApiConfig,
            checkState: 'idle',
            checkVersion: 0,
            createdAt: Date.now(),
            history: [],
            id: monitorDraft.id ?? crypto.randomUUID(),
            incidentCount: 0,
            interval: monitorDraft.interval,
            lastCheckError: null,
            lastChecked: null,
            name: getMonitorDisplayName(normalizedUrl),
            responseTime: null,
            status: 'pending',
            type: monitorDraft.type,
            uptimePercent: 100,
            url: normalizedUrl,
          }
        : {
            ...existingMonitor,
            apiConfig: normalizedApiConfig,
            interval: monitorDraft.interval,
            name: getMonitorDisplayName(normalizedUrl),
            type: monitorDraft.type,
            url: normalizedUrl,
            checkState: targetChanged ? 'idle' : existingMonitor.checkState,
            checkVersion: targetChanged
              ? existingMonitor.checkVersion + 1
              : existingMonitor.checkVersion,
            lastCheckError: targetChanged ? null : existingMonitor.lastCheckError,
            status: targetChanged
              ? existingMonitor.status === 'paused'
                ? 'paused'
                : 'pending'
              : existingMonitor.status,
            lastChecked: targetChanged ? null : existingMonitor.lastChecked,
            responseTime: targetChanged ? null : existingMonitor.responseTime,
            uptimePercent: targetChanged ? 100 : existingMonitor.uptimePercent,
            incidentCount: targetChanged ? 0 : existingMonitor.incidentCount,
            history: targetChanged ? [] : existingMonitor.history,
          }
    const nextMonitors = upsertMonitor(monitors, nextMonitor)
    const nextIncidents = targetChanged
      ? incidents.filter((incident) => incident.monitorId !== nextMonitor.id)
      : incidents

    await writeMonitoringData(nextMonitors, nextIncidents)

    return {
      monitorId: nextMonitor.id,
      shouldCheck:
        existingMonitor === null ||
        (targetChanged && existingMonitor.status !== 'paused'),
    }
  })

  if (result.shouldCheck) {
    triggerMonitorCheck(result.monitorId)
  }

  return {
    monitorId: result.monitorId,
  }
}

async function toggleMonitorCommand(monitorId: string): Promise<void> {
  const result = await enqueueBackgroundTask(async () => {
    const [monitors, incidents] = await Promise.all([getMonitors(), getIncidents()])
    const monitorIndex = monitors.findIndex((monitor) => monitor.id === monitorId)

    if (monitorIndex === -1) {
      throw new Error('Monitor not found')
    }

    const currentMonitor = monitors[monitorIndex]
    const shouldCheck = currentMonitor.status === 'paused'
    const now = Date.now()
    const activeIncident = getActiveIncident(incidents, currentMonitor.id)
    const nextIncidents =
      !shouldCheck && activeIncident
        ? incidents.map((incident) =>
            incident.id === activeIncident.id
              ? {
                  ...incident,
                  endTime: incident.endTime ?? now,
                }
              : incident,
          )
        : incidents
    const nextMonitor: Monitor = {
      ...currentMonitor,
      checkState: 'idle',
      checkVersion: currentMonitor.checkVersion + 1,
      lastCheckError: null,
      status: shouldCheck ? 'pending' : 'paused',
      responseTime: shouldCheck ? null : currentMonitor.responseTime,
    }
    const nextMonitors = [...monitors]
    nextMonitors[monitorIndex] = nextMonitor

    await writeMonitoringData(nextMonitors, nextIncidents)

    return {
      shouldCheck,
    }
  })

  if (result.shouldCheck) {
    triggerMonitorCheck(monitorId)
  }
}

async function deleteMonitorCommand(monitorId: string): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const [monitors, incidents] = await Promise.all([getMonitors(), getIncidents()])

    await writeMonitoringData(
      monitors.filter((monitor) => monitor.id !== monitorId),
      incidents.filter((incident) => incident.monitorId !== monitorId),
    )
  })
}

async function clearAllMonitoringDataCommand(): Promise<void> {
  await enqueueBackgroundTask(async () => {
    await writeMonitoringData([], [])
  })
}

async function setNotificationsEnabledCommand(enabled: boolean): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const settings = await getSettings()

    await writeSettings({
      ...settings,
      notificationsEnabled: enabled,
    })
  })
}

async function setDefaultCheckIntervalCommand(
  interval: SaveMonitorDraftPayload['interval'],
): Promise<void> {
  await enqueueBackgroundTask(async () => {
    const settings = await getSettings()

    await writeSettings({
      ...settings,
      defaultInterval: interval,
    })
  })
}

async function setPingUrlCommand(pingUrl: string): Promise<void> {
  const normalizedPingUrl = normalizeNetworkTarget(pingUrl)

  if (!normalizedPingUrl) {
    throw new Error('Invalid ping URL')
  }

  await enqueueBackgroundTask(async () => {
    const settings = await getSettings()

    await writeSettings({
      ...settings,
      pingUrl: normalizedPingUrl,
    })
  })
}

export async function handleRuntimeMessage(message: unknown): Promise<unknown> {
  const parsedMessage = runtimeMessageSchema.safeParse(message)

  if (!parsedMessage.success) {
    throw new Error('Invalid runtime message')
  }

  const runtimeMessage: RuntimeCommand = parsedMessage.data

  switch (runtimeMessage.type) {
    case MESSAGE_TYPES.checkNow:
      triggerMonitorCheck(runtimeMessage.monitorId, { force: true })
      return undefined

    case MESSAGE_TYPES.saveMonitor:
      return saveMonitorCommand(runtimeMessage.monitorDraft)

    case MESSAGE_TYPES.toggleMonitor:
      await toggleMonitorCommand(runtimeMessage.monitorId)
      return undefined

    case MESSAGE_TYPES.deleteMonitor:
      await deleteMonitorCommand(runtimeMessage.monitorId)
      return undefined

    case MESSAGE_TYPES.clearAllMonitoringData:
      await clearAllMonitoringDataCommand()
      return undefined

    case MESSAGE_TYPES.setNotificationsEnabled:
      await setNotificationsEnabledCommand(runtimeMessage.enabled)
      return undefined

    case MESSAGE_TYPES.setDefaultCheckInterval:
      await setDefaultCheckIntervalCommand(runtimeMessage.interval)
      return undefined

    case MESSAGE_TYPES.setPingUrl:
      await setPingUrlCommand(runtimeMessage.pingUrl)
      return undefined
  }
}
