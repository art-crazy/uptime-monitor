import {
  DEFAULT_API_MONITOR_CONFIG,
  normalizeApiMonitorConfig,
  type ApiMonitorConfig,
  type MonitorCheckError,
  type MonitorType,
} from '../entities/monitor'
import { getMonitorCheckCandidates } from '../entities/monitor'
import {
  CHECK_TIMEOUT_MS,
  DEFAULT_PING_URL,
  INTERNET_TIMEOUT_MS,
} from '@shared/constants'
import { createLocalizedMessage } from '@shared/lib/localized-message'
import { hasHttpProtocol, normalizeNetworkTarget } from '@shared/lib/network'

interface PingResult {
  error?: MonitorCheckError
  ok: boolean
  responseTime: number | null
}

function createAbortController(timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
  }
}

async function timedFetch(
  url: string,
  method: 'GET' | 'HEAD' | 'POST',
  timeoutMs: number,
  headers?: HeadersInit,
  body?: string,
): Promise<{ response: Response; responseTime: number }> {
  const timer = createAbortController(timeoutMs)
  const startedAt = performance.now()

  try {
    const response = await fetch(url, {
      body,
      method,
      cache: 'no-store',
      headers,
      redirect: 'follow',
      signal: timer.controller.signal,
    })

    return {
      response,
      responseTime: Math.round(performance.now() - startedAt),
    }
  } finally {
    timer.clear()
  }
}

function isHtmlContentType(contentType: string | null): boolean {
  return contentType?.toLowerCase().startsWith('text/html') === true
}

function matchesExpectedStatus(status: number, config: ApiMonitorConfig): boolean {
  return config.expectedStatus === null
    ? status >= 200 && status < 300
    : status === config.expectedStatus
}

function getExpectedStatusLabel(config: ApiMonitorConfig): string {
  return config.expectedStatus === null ? '2xx' : String(config.expectedStatus)
}

async function probeUrl(url: string, timeoutMs: number): Promise<PingResult> {
  try {
    const headResult = await timedFetch(url, 'HEAD', timeoutMs)

    if (headResult.response.ok) {
      return {
        ok: true,
        responseTime: headResult.responseTime,
      }
    }

    if (![405, 501].includes(headResult.response.status)) {
      return {
        ok: false,
        responseTime: null,
      }
    }
  } catch {
    // Ignore and retry with GET.
  }

  try {
    const getResult = await timedFetch(url, 'GET', timeoutMs)

    return {
      ok: getResult.response.ok,
      responseTime: getResult.response.ok ? getResult.responseTime : null,
    }
  } catch {
    return {
      ok: false,
      responseTime: null,
    }
  }
}

function buildApiHeaders(config: ApiMonitorConfig): Headers {
  const headers = new Headers()

  for (const header of config.headers) {
    headers.set(header.name, header.value)
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain;q=0.9, */*;q=0.8')
  }

  if (config.authType === 'bearer' && config.authToken) {
    headers.set('Authorization', `Bearer ${config.authToken}`)
  }

  if (config.authType === 'basic' && config.authUsername) {
    headers.set('Authorization', `Basic ${btoa(`${config.authUsername}:${config.authPassword}`)}`)
  }

  if (config.method === 'POST' && config.body.trim().length > 0 && !headers.has('Content-Type')) {
    const contentType =
      config.body.trim().startsWith('{') || config.body.trim().startsWith('[')
        ? 'application/json'
        : 'text/plain;charset=UTF-8'
    headers.set('Content-Type', contentType)
  }

  return headers
}

function getJsonPathValue(value: unknown, path: string): unknown {
  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (current === null || current === undefined) {
        return undefined
      }

      if (Array.isArray(current) && /^\d+$/.test(segment)) {
        return current[Number(segment)]
      }

      if (typeof current === 'object') {
        return (current as Record<string, unknown>)[segment]
      }

      return undefined
    }, value)
}

function matchesExpectedJsonValue(actual: unknown, expected: string): boolean {
  const trimmedExpected = expected.trim()

  if (!trimmedExpected) {
    return false
  }

  try {
    const parsedExpected = JSON.parse(trimmedExpected)
    return JSON.stringify(actual) === JSON.stringify(parsedExpected)
  } catch {
    return String(actual) === trimmedExpected
  }
}

async function probeApiUrl(
  url: string,
  timeoutMs: number,
  config: ApiMonitorConfig,
): Promise<PingResult> {
  try {
    const { response, responseTime } = await timedFetch(
      url,
      config.method,
      timeoutMs,
      buildApiHeaders(config),
      config.method === 'POST' ? config.body : undefined,
    )

    if (!matchesExpectedStatus(response.status, config)) {
      return {
        error: createLocalizedMessage('monitor_error_api_unexpected_status', [
          getExpectedStatusLabel(config),
          String(response.status),
        ]),
        ok: false,
        responseTime: null,
      }
    }

    if (isHtmlContentType(response.headers.get('content-type'))) {
      return {
        error: createLocalizedMessage('monitor_error_api_html_response'),
        ok: false,
        responseTime: null,
      }
    }

    if (config.responseMode === 'body_includes') {
      const responseText = await response.text()

      if (!responseText.includes(config.responseBody)) {
        return {
          error: createLocalizedMessage('monitor_error_api_response_body_mismatch'),
          ok: false,
          responseTime: null,
        }
      }
    }

    if (config.responseMode === 'json_value') {
      let responseJson: unknown

      try {
        responseJson = await response.json()
      } catch {
        return {
          error: createLocalizedMessage('monitor_error_api_invalid_json'),
          ok: false,
          responseTime: null,
        }
      }

      const actualValue = getJsonPathValue(responseJson, config.responseJsonPath)

      if (!matchesExpectedJsonValue(actualValue, config.responseJsonValue)) {
        return {
          error: createLocalizedMessage('monitor_error_api_response_json_mismatch'),
          ok: false,
          responseTime: null,
        }
      }
    }

    return {
      ok: true,
      responseTime,
    }
  } catch {
    return {
      ok: false,
      responseTime: null,
    }
  }
}

function getInternetCheckCandidates(pingUrl: string): string[] {
  const trimmed = pingUrl.trim()

  if (!trimmed) {
    return ['https://clients3.google.com/generate_204']
  }

  if (
    trimmed === DEFAULT_PING_URL ||
    trimmed === `https://${DEFAULT_PING_URL}` ||
    trimmed === `http://${DEFAULT_PING_URL}`
  ) {
    return ['https://clients3.google.com/generate_204']
  }

  const normalized = normalizeNetworkTarget(trimmed)

  if (!normalized) {
    return []
  }

  if (hasHttpProtocol(normalized)) {
    return [normalized]
  }

  return [`https://${normalized}`, `http://${normalized}`]
}

export async function pingMonitorTarget(
  value: string,
  type: MonitorType,
  apiConfig?: ApiMonitorConfig,
): Promise<PingResult> {
  const candidates = getMonitorCheckCandidates(value, type)
  const normalizedApiConfig = normalizeApiMonitorConfig(apiConfig ?? DEFAULT_API_MONITOR_CONFIG)

  for (const candidate of candidates) {
    const result =
      type === 'api'
        ? await probeApiUrl(candidate, CHECK_TIMEOUT_MS, normalizedApiConfig)
        : await probeUrl(candidate, CHECK_TIMEOUT_MS)

    if (result.ok) {
      return result
    }

    if (result.error) {
      return result
    }
  }

  return {
    ok: false,
    responseTime: null,
  }
}

export async function pingInternetTarget(pingUrl: string): Promise<PingResult> {
  const candidates = getInternetCheckCandidates(pingUrl)

  for (const candidate of candidates) {
    const result = await probeUrl(candidate, INTERNET_TIMEOUT_MS)

    if (result.ok) {
      return result
    }
  }

  return {
    ok: false,
    responseTime: null,
  }
}
