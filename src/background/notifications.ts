import type { Monitor } from '../entities/monitor'
import type { Settings } from '../entities/settings'

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
      ? `${next.name} is down`
      : `${next.name} is back up`

  const message =
    next.status === 'down'
      ? `The latest uptime check failed for ${next.url}.`
      : `Latest response time: ${next.responseTime ?? '--'}ms.`

  await chrome.notifications.create(`monitor-${next.id}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  })
}
