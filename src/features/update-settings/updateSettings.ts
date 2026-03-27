import type { Settings } from '../../entities/settings'
import { MESSAGE_TYPES } from '@shared/constants'
import { normalizeNetworkTarget } from '@shared/lib/network'
import {
  requestSendTelegramTestMessage,
  requestSetDefaultCheckInterval,
  requestSetNotificationsEnabled,
  requestSetPingUrl,
  requestUpdateTelegramSettings,
} from '@shared/lib/runtime'
import type { RuntimeCommandPayloadMap } from '@shared/lib/runtime-contract'

type FieldUpdateResult = 'success' | 'invalid'

type TelegramSettingsPatch =
  RuntimeCommandPayloadMap[typeof MESSAGE_TYPES.updateTelegramSettings]['telegram']

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await requestSetNotificationsEnabled(enabled)
}

async function updateTelegramSettings(
  telegram: TelegramSettingsPatch,
): Promise<void> {
  await requestUpdateTelegramSettings(telegram)
}

export async function setTelegramChatId(
  chatId: string,
): Promise<FieldUpdateResult> {
  const normalizedChatId = chatId.trim()

  if (!normalizedChatId) {
    return 'invalid'
  }

  await updateTelegramSettings({ chatId: normalizedChatId })
  return 'success'
}

export async function setTelegramEnabled(enabled: boolean): Promise<void> {
  await updateTelegramSettings({ enabled })
}

export async function setTelegramRecoveryEnabled(sendRecovery: boolean): Promise<void> {
  await updateTelegramSettings({ sendRecovery })
}

export async function sendTelegramTestMessage(): Promise<void> {
  await requestSendTelegramTestMessage()
}

export async function setDefaultCheckInterval(
  interval: Settings['defaultInterval'],
): Promise<void> {
  await requestSetDefaultCheckInterval(interval)
}

export async function setPingUrl(
  pingUrl: string,
): Promise<FieldUpdateResult> {
  const normalizedPingUrl = normalizeNetworkTarget(pingUrl)

  if (!normalizedPingUrl) {
    return 'invalid'
  }

  await requestSetPingUrl(normalizedPingUrl)

  return 'success'
}
