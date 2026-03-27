import {
  DEFAULT_API_MONITOR_CONFIG,
  formatApiHeaders,
  type CheckInterval,
} from '../../../entities/monitor'

import type { ApiMonitorFormFields, MonitorFormDraft } from './types'

export interface MonitorFormState extends ApiMonitorFormFields {
  interval: CheckInterval
  type: MonitorFormDraft['type']
  url: string
}

export function getInitialMonitorFormState(
  defaultInterval: CheckInterval,
  monitor?: MonitorFormDraft,
): MonitorFormState {
  const apiConfig = monitor?.apiConfig ?? DEFAULT_API_MONITOR_CONFIG

  return {
    authPassword: apiConfig.authPassword,
    authToken: apiConfig.authToken,
    authType: apiConfig.authType,
    authUsername: apiConfig.authUsername,
    body: apiConfig.body,
    headersText: formatApiHeaders(apiConfig.headers),
    type: monitor?.type ?? 'website',
    url: monitor?.url ?? '',
    interval: monitor?.interval ?? defaultInterval,
    method: apiConfig.method,
    responseBody: apiConfig.responseBody,
    responseJsonPath: apiConfig.responseJsonPath,
    responseJsonValue: apiConfig.responseJsonValue,
    responseMode: apiConfig.responseMode,
  }
}
