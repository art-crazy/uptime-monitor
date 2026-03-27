import type { Monitor } from '../entities/monitor'
import {
  INTERNET_ALARM_NAME,
  INTERNET_CHECK_MINUTES,
  MONITOR_ALARM_PREFIX,
} from '@shared/constants'

function getMonitorAlarmName(monitorId: string): string {
  return `${MONITOR_ALARM_PREFIX}${monitorId}`
}

export function getMonitorIdFromAlarmName(name: string): string | null {
  if (!name.startsWith(MONITOR_ALARM_PREFIX)) {
    return null
  }

  return name.slice(MONITOR_ALARM_PREFIX.length)
}

function isSamePeriod(
  alarm: chrome.alarms.Alarm | undefined,
  periodInMinutes: number,
): boolean {
  return Math.abs((alarm?.periodInMinutes ?? 0) - periodInMinutes) < 0.001
}

export async function syncMonitorAlarms(monitors: Monitor[]): Promise<void> {
  const alarms = await chrome.alarms.getAll()
  const existingMonitorAlarms = new Map(
    alarms
      .filter((alarm) => getMonitorIdFromAlarmName(alarm.name) !== null)
      .map((alarm) => [alarm.name, alarm]),
  )
  const activeMonitors = monitors.filter((monitor) => monitor.status !== 'paused')
  const desiredAlarmNames = new Set(activeMonitors.map((monitor) => getMonitorAlarmName(monitor.id)))

  await Promise.all(
    Array.from(existingMonitorAlarms.values())
      .filter((alarm) => !desiredAlarmNames.has(alarm.name))
      .map((alarm) => chrome.alarms.clear(alarm.name)),
  )

  for (const monitor of activeMonitors) {
    const alarmName = getMonitorAlarmName(monitor.id)
    const periodInMinutes = monitor.interval / 60
    const existingAlarm = existingMonitorAlarms.get(alarmName)

    if (!isSamePeriod(existingAlarm, periodInMinutes)) {
      await chrome.alarms.create(alarmName, {
        delayInMinutes: periodInMinutes,
        periodInMinutes,
      })
    }
  }
}

export async function ensureInternetAlarm(): Promise<void> {
  const existing = await chrome.alarms.get(INTERNET_ALARM_NAME)

  if (!isSamePeriod(existing, INTERNET_CHECK_MINUTES)) {
    await chrome.alarms.create(INTERNET_ALARM_NAME, {
      delayInMinutes: INTERNET_CHECK_MINUTES,
      periodInMinutes: INTERNET_CHECK_MINUTES,
    })
  }
}

function getScheduleFingerprint(monitors: Monitor[]): Map<string, string> {
  return new Map(
    monitors.map((monitor) => [
      monitor.id,
      `${monitor.interval}:${monitor.status === 'paused'}`,
    ]),
  )
}

export function didMonitorSchedulesChange(
  previousMonitors: Monitor[],
  nextMonitors: Monitor[],
): boolean {
  const previousFingerprint = getScheduleFingerprint(previousMonitors)
  const nextFingerprint = getScheduleFingerprint(nextMonitors)

  if (previousFingerprint.size !== nextFingerprint.size) {
    return true
  }

  for (const [monitorId, fingerprint] of previousFingerprint) {
    if (nextFingerprint.get(monitorId) !== fingerprint) {
      return true
    }
  }

  return false
}
