import {
  getDisplayHost,
  hasHttpProtocol,
  normalizeHttpTarget,
  normalizeNetworkTarget,
} from '@shared/lib/network'

import type { MonitorType } from './types'

export function normalizeMonitorTarget(
  value: string,
  type: MonitorType,
): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (type === 'host') {
    return normalizeNetworkTarget(trimmed)
  }

  return normalizeHttpTarget(trimmed)
}

export function getMonitorCheckCandidates(
  value: string,
  type: MonitorType,
): string[] {
  const normalized = normalizeMonitorTarget(value, type)

  if (!normalized) {
    return []
  }

  if (hasHttpProtocol(normalized)) {
    return [normalized]
  }

  return [`https://${normalized}`, `http://${normalized}`]
}

export function getMonitorDisplayName(value: string): string {
  return getDisplayHost(value)
}

export function resolveUniqueMonitorName(
  baseName: string,
  takenNames: ReadonlySet<string>,
): string {
  if (!takenNames.has(baseName)) {
    return baseName
  }

  let counter = 2

  while (takenNames.has(`${baseName} (${counter})`)) {
    counter += 1
  }

  return `${baseName} (${counter})`
}
