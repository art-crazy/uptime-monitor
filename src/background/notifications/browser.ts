import type { BrowserNotificationSettings } from '../../entities/settings'

import { getNotificationContent } from './format'
import type { MonitorStatusChangeNotificationEvent } from './types'

export async function sendBrowserStatusChangeNotification(
  event: MonitorStatusChangeNotificationEvent,
  settings: BrowserNotificationSettings,
): Promise<void> {
  if (!settings.enabled) {
    return
  }

  const { message, title } = getNotificationContent(event)

  await chrome.notifications.create(`monitor-${event.monitorId}-${event.checkedAt}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  })
}
