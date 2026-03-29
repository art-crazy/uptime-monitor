import type { Monitor } from '../../entities/monitor'
import type { Settings } from '../../entities/settings'
import { translateLocalizedMessage } from '@shared/lib/i18n'
import { isIgnorableExtensionError } from '@shared/lib/user-facing-error'

import {
  assertTelegramNotificationConfigured,
  sendTelegramStatusChangeNotification,
  sendTelegramTestNotification,
} from './telegram'
import type { MonitorStatusChangeNotificationEvent } from './types'

function createStatusChangeEvent(
  previous: Monitor,
  next: Monitor,
): MonitorStatusChangeNotificationEvent | null {
  if (previous.status === next.status || (next.status !== 'down' && next.status !== 'online')) {
    return null
  }

  const checkedAt = next.lastChecked ?? Date.now()

  return {
    eventId: `${next.id}:${next.status}:${checkedAt}`,
    checkedAt,
    errorMessage: translateLocalizedMessage(next.lastCheckError),
    monitorId: next.id,
    monitorName: next.name,
    monitorUrl: next.url,
    previousStatus: previous.status,
    nextStatus: next.status,
    responseTime: next.responseTime,
  }
}

export async function notifyMonitorStatusChange(
  previous: Monitor,
  next: Monitor,
  settings: Settings,
): Promise<void> {
  const event = createStatusChangeEvent(previous, next)

  if (!event) {
    return
  }

  const channels = [
    {
      name: 'telegram',
      send: () => sendTelegramStatusChangeNotification(event, settings.notifications.telegram),
    },
  ] as const

  const notificationResults = await Promise.allSettled(channels.map((channel) => channel.send()))

  notificationResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      if (!isIgnorableExtensionError(result.reason)) {
        console.warn(
          `[background] notifyMonitorStatusChange:${channels[index].name}`,
          result.reason,
        )
      }
    }
  })
}

export async function sendTelegramTestMessage(settings: Settings): Promise<void> {
  await sendTelegramTestNotification(settings.notifications.telegram)
}

export { assertTelegramNotificationConfigured }
