import type { MonitorType } from '../entities/monitor'
import { getMonitorCheckCandidates } from '../entities/monitor'
import {
  CHECK_TIMEOUT_MS,
  DEFAULT_PING_URL,
  INTERNET_TIMEOUT_MS,
} from '@shared/constants'
import { hasHttpProtocol, normalizeNetworkTarget } from '@shared/lib/network'

interface PingResult {
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
  method: 'GET' | 'HEAD',
  timeoutMs: number,
): Promise<{ ok: boolean; responseTime: number; status: number }> {
  const timer = createAbortController(timeoutMs)
  const startedAt = performance.now()

  try {
    const response = await fetch(url, {
      method,
      cache: 'no-store',
      redirect: 'follow',
      signal: timer.controller.signal,
    })

    return {
      ok: response.ok,
      responseTime: Math.round(performance.now() - startedAt),
      status: response.status,
    }
  } finally {
    timer.clear()
  }
}

async function probeUrl(url: string, timeoutMs: number): Promise<PingResult> {
  try {
    const headResult = await timedFetch(url, 'HEAD', timeoutMs)

    if (headResult.ok) {
      return {
        ok: true,
        responseTime: headResult.responseTime,
      }
    }

    if (![405, 501].includes(headResult.status)) {
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
      ok: getResult.ok,
      responseTime: getResult.ok ? getResult.responseTime : null,
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
): Promise<PingResult> {
  const candidates = getMonitorCheckCandidates(value, type)

  for (const candidate of candidates) {
    const result = await probeUrl(candidate, CHECK_TIMEOUT_MS)

    if (result.ok) {
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
