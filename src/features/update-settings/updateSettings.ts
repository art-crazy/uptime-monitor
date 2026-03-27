import type { Settings } from '../../entities/settings'
import { normalizeNetworkTarget } from '@shared/lib/network'
import {
  requestSetDefaultCheckInterval,
  requestSetNotificationsEnabled,
  requestSetPingUrl,
} from '@shared/lib/runtime'

export type PingUrlUpdateResult = 'success' | 'invalid'

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await requestSetNotificationsEnabled(enabled)
}

export async function setDefaultCheckInterval(
  interval: Settings['defaultInterval'],
): Promise<void> {
  await requestSetDefaultCheckInterval(interval)
}

export async function setPingUrl(
  pingUrl: string,
): Promise<PingUrlUpdateResult> {
  const normalizedPingUrl = normalizeNetworkTarget(pingUrl)

  if (!normalizedPingUrl) {
    return 'invalid'
  }

  await requestSetPingUrl(normalizedPingUrl)

  return 'success'
}
