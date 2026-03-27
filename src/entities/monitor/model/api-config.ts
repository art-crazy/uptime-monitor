import {
  DEFAULT_API_MONITOR_CONFIG,
  type ApiMonitorConfig,
  type ApiMonitorHeader,
} from './types'

interface ParseApiHeadersResult {
  error: boolean
  headers: ApiMonitorHeader[]
}

export function normalizeApiMonitorConfig(
  value?: Partial<ApiMonitorConfig> | null,
): ApiMonitorConfig {
  const source = value ?? {}
  const method = source.method === 'POST' ? 'POST' : 'GET'
  const authType =
    source.authType === 'bearer' || source.authType === 'basic'
      ? source.authType
      : 'none'
  const responseMode =
    source.responseMode === 'body_includes' || source.responseMode === 'json_value'
      ? source.responseMode
      : 'none'
  const headers = Array.isArray(source.headers)
    ? source.headers
        .map((header) => ({
          name: header.name.trim(),
          value: header.value.trim(),
        }))
        .filter((header) => header.name.length > 0)
    : []

  return {
    ...DEFAULT_API_MONITOR_CONFIG,
    authPassword: authType === 'basic' ? source.authPassword ?? '' : '',
    authToken: authType === 'bearer' ? source.authToken?.trim() ?? '' : '',
    authType,
    authUsername: authType === 'basic' ? source.authUsername?.trim() ?? '' : '',
    body: method === 'POST' ? source.body ?? '' : '',
    headers,
    method,
    responseBody:
      responseMode === 'body_includes' ? source.responseBody?.trim() ?? '' : '',
    responseJsonPath:
      responseMode === 'json_value' ? source.responseJsonPath?.trim() ?? '' : '',
    responseJsonValue:
      responseMode === 'json_value' ? source.responseJsonValue?.trim() ?? '' : '',
    responseMode,
  }
}

export function areApiMonitorConfigsEqual(
  left?: Partial<ApiMonitorConfig> | null,
  right?: Partial<ApiMonitorConfig> | null,
): boolean {
  return JSON.stringify(normalizeApiMonitorConfig(left)) === JSON.stringify(normalizeApiMonitorConfig(right))
}

export function formatApiHeaders(headers: readonly ApiMonitorHeader[]): string {
  return headers.map((header) => `${header.name}: ${header.value}`.trimEnd()).join('\n')
}

export function parseApiHeadersText(value: string): ParseApiHeadersResult {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const headers: ApiMonitorHeader[] = []

  for (const line of lines) {
    const colonIndex = line.indexOf(':')

    if (colonIndex <= 0) {
      return {
        error: true,
        headers: [],
      }
    }

    headers.push({
      name: line.slice(0, colonIndex).trim(),
      value: line.slice(colonIndex + 1).trim(),
    })
  }

  return {
    error: false,
    headers,
  }
}
