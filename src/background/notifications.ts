import type { Monitor } from '../entities/monitor'
import type { Settings } from '../entities/settings'
import { t } from '../shared/lib/i18n'
import { formatResponseTime } from '../shared/lib/time'

export async function notifyMonitorStatusChange(
  previous: Monitor,
  next: Monitor,
  settings: Settings,
): Promise<void> {
  if (!settings.notificationsEnabled || previous.status === next.status) {
    return
  }

  const title =
    next.status === 'down'
      ? t('notification_down_title', next.name)
      : t('notification_up_title', next.name)

  const message =
    next.status === 'down'
      ? t('notification_down_message', next.url)
      : t(
          'notification_up_message',
          next.responseTime === null ? '--' : formatResponseTime(next.responseTime),
        )

  await chrome.notifications.create(`monitor-${next.id}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  })
}
