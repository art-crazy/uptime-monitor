import { t } from '@shared/lib/i18n'
import { formatResponseTime } from '@shared/lib/time'

import type { MonitorStatusChangeNotificationEvent } from './types'

export interface NotificationContent {
  message: string
  title: string
}

export function getNotificationContent(
  event: MonitorStatusChangeNotificationEvent,
): NotificationContent {
  const title =
    event.nextStatus === 'down'
      ? t('notification_down_title', event.monitorName)
      : t('notification_up_title', event.monitorName)

  const message =
    event.nextStatus === 'down'
      ? t('notification_down_message', event.monitorUrl)
      : t(
          'notification_up_message',
          event.responseTime === null ? '--' : formatResponseTime(event.responseTime),
        )

  return {
    title,
    message,
  }
}
