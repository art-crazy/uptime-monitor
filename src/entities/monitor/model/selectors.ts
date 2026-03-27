import { HISTORY_MAX_ENTRIES } from '@shared/constants'

import type { HistoryEntry } from './types'

export function appendHistoryEntry(
  history: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [...history, entry].slice(-HISTORY_MAX_ENTRIES)
}

export function calculateUptimePercent(history: HistoryEntry[]): number {
  if (history.length === 0) {
    return 100
  }

  const onlineChecks = history.filter((entry) => entry.status === 'online').length
  return Math.round((onlineChecks / history.length) * 1000) / 10
}

export function calculateAverageResponseTime(
  history: HistoryEntry[],
): number | null {
  const onlineEntries = history.filter(
    (entry) => entry.status === 'online' && entry.responseTime !== null,
  )

  if (onlineEntries.length === 0) {
    return null
  }

  const total = onlineEntries.reduce(
    (sum, entry) => sum + (entry.responseTime ?? 0),
    0,
  )

  return Math.round(total / onlineEntries.length)
}

export function getChartHistory(
  history: HistoryEntry[],
  bucketCount = 24,
  bucketMs = 60 * 60 * 1000,
  now = Date.now(),
): Array<HistoryEntry | null> {
  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = now - (bucketCount - index) * bucketMs
    const bucketEnd = bucketStart + bucketMs
    const bucketEntries = history.filter(
      (entry) => entry.timestamp >= bucketStart && entry.timestamp < bucketEnd,
    )

    return bucketEntries.at(-1) ?? null
  })
}
