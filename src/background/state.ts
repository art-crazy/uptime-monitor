import type { Incident } from '../entities/incident'
import type { InternetStatus } from '../entities/internet'
import {
  calculateUptimePercent,
  type Monitor,
} from '../entities/monitor'
import type { Settings } from '../entities/settings'
import { STORAGE_KEYS } from '../shared/constants'
import { setStorageValues } from '../shared/lib/storage'

function prepareMonitors(monitors: Monitor[]): Monitor[] {
  return monitors.map((monitor) => ({
    ...monitor,
    uptimePercent: calculateUptimePercent(monitor.history),
  }))
}

export async function writeInternetStatus(status: InternetStatus): Promise<void> {
  await setStorageValues({
    [STORAGE_KEYS.internetStatus]: status,
  })
}

export async function writeMonitors(monitors: Monitor[]): Promise<void> {
  await setStorageValues({
    [STORAGE_KEYS.monitors]: prepareMonitors(monitors),
  })
}

export async function writeMonitoringData(
  monitors: Monitor[],
  incidents: Incident[],
): Promise<void> {
  await setStorageValues({
    [STORAGE_KEYS.monitors]: prepareMonitors(monitors),
    [STORAGE_KEYS.incidents]: incidents,
  })
}

export async function writeSettings(settings: Settings): Promise<void> {
  await setStorageValues({
    [STORAGE_KEYS.settings]: settings,
  })
}
