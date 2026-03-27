import type { TelegramNotificationSettings } from '../../entities/settings'
import { t } from '@shared/lib/i18n'
import { UserFacingError } from '@shared/lib/user-facing-error'

import { getNotificationContent } from './format'
import type { MonitorStatusChangeNotificationEvent } from './types'

interface TelegramSendMessagePayload {
  chat_id: string
  disable_web_page_preview: true
  text: string
}

interface TelegramApiResponse {
  description?: string
  ok?: boolean
}

const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN

export function assertTelegramNotificationConfigured(
  settings: TelegramNotificationSettings,
): void {
  if (!settings.chatId.trim()) {
    throw new UserFacingError('Telegram chat ID is not configured')
  }
}

async function postToTelegramBotApi(
  payload: TelegramSendMessagePayload,
): Promise<void> {
  if (!telegramBotToken) {
    throw new Error('Telegram bot token is not configured')
  }

  const response = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  const data = await response.json().catch(() => null) as TelegramApiResponse | null
  const responseDescription = typeof data?.description === 'string' ? data.description : ''

  if (!response.ok) {
    throw new Error(
      responseDescription
        ? `Telegram Bot API request failed: ${responseDescription}`
        : `Telegram Bot API request failed with status ${response.status}`,
    )
  }

  if (data?.ok === false) {
    throw new Error(responseDescription || 'Telegram Bot API returned ok=false')
  }
}

export async function sendTelegramStatusChangeNotification(
  event: MonitorStatusChangeNotificationEvent,
  settings: TelegramNotificationSettings,
): Promise<void> {
  if (!settings.enabled) {
    return
  }

  if (event.nextStatus === 'online' && !settings.sendRecovery) {
    return
  }

  assertTelegramNotificationConfigured(settings)

  const { title, message } = getNotificationContent(event)

  await postToTelegramBotApi({
    chat_id: settings.chatId,
    disable_web_page_preview: true,
    text: `${title}\n${message}`,
  })
}

export async function sendTelegramTestNotification(
  settings: TelegramNotificationSettings,
): Promise<void> {
  assertTelegramNotificationConfigured(settings)

  await postToTelegramBotApi({
    chat_id: settings.chatId,
    disable_web_page_preview: true,
    text: t('notification_telegram_test_message', new Date().toISOString()),
  })
}
