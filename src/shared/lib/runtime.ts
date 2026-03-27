import { MESSAGE_TYPES } from '../constants'
import type {
  RuntimeCommandPayloadMap,
  RuntimeCommandResponseMap,
  RuntimeCommandType,
  SaveMonitorDraftPayload,
} from './runtime-contract'

interface RuntimeErrorResponse {
  error: string
  ok: false
}

interface RuntimeSuccessResponse<TData> {
  data?: TData
  ok: true
}

type RuntimeResponse<TData> = RuntimeErrorResponse | RuntimeSuccessResponse<TData>

async function sendRuntimeCommand<TCommand extends RuntimeCommandType>(
  type: TCommand,
  payload: RuntimeCommandPayloadMap[TCommand],
): Promise<RuntimeCommandResponseMap[TCommand]> {
  const response = (await chrome.runtime.sendMessage(
    { type, ...payload },
  )) as RuntimeResponse<RuntimeCommandResponseMap[TCommand]> | undefined

  if (!response) {
    throw new Error('No response from background service worker')
  }

  if (!response.ok) {
    throw new Error(response.error)
  }

  return response.data as RuntimeCommandResponseMap[TCommand]
}

export async function requestMonitorCheck(monitorId: string): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.checkNow, { monitorId })
}

export async function saveMonitorDraft(
  monitorDraft: SaveMonitorDraftPayload,
): Promise<{ monitorId: string }> {
  return sendRuntimeCommand(MESSAGE_TYPES.saveMonitor, { monitorDraft })
}

export async function requestToggleMonitor(monitorId: string): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.toggleMonitor, { monitorId })
}

export async function requestDeleteMonitor(monitorId: string): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.deleteMonitor, { monitorId })
}

export async function requestClearAllMonitoringData(): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.clearAllMonitoringData, {})
}

export async function requestSetNotificationsEnabled(
  enabled: boolean,
): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.setNotificationsEnabled, { enabled })
}

export async function requestUpdateTelegramSettings(
  telegram: RuntimeCommandPayloadMap[typeof MESSAGE_TYPES.updateTelegramSettings]['telegram'],
): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.updateTelegramSettings, { telegram })
}

export async function requestSendTelegramTestMessage(): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.sendTelegramTestMessage, {})
}

export async function requestSetDefaultCheckInterval(
  interval: RuntimeCommandPayloadMap[typeof MESSAGE_TYPES.setDefaultCheckInterval]['interval'],
): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.setDefaultCheckInterval, { interval })
}

export async function requestSetPingUrl(pingUrl: string): Promise<void> {
  await sendRuntimeCommand(MESSAGE_TYPES.setPingUrl, { pingUrl })
}
