import { HISTORY_MAX_ENTRIES } from '@shared/constants'

import type { HistoryEntry } from './types'

export interface ChartBucket {
  averageResponseTime: number | null
  bucketEnd: number
  bucketStart: number
  failureCount: number
  medianResponseTime: number | null
  sampleCount: number
}

export interface ChartRange {
  end: number
  start: number
}

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

export function calculateMedianResponseTime(history: HistoryEntry[]): number | null {
  const onlineResponseTimes = history
    .filter((entry) => entry.status === 'online' && entry.responseTime !== null)
    .map((entry) => entry.responseTime as number)
    .sort((left, right) => left - right)

  if (onlineResponseTimes.length === 0) {
    return null
  }

  const middleIndex = Math.floor(onlineResponseTimes.length / 2)

  if (onlineResponseTimes.length % 2 === 1) {
    return onlineResponseTimes[middleIndex]
  }

  return Math.round((onlineResponseTimes[middleIndex - 1] + onlineResponseTimes[middleIndex]) / 2)
}

export function getChartRange(
  history: HistoryEntry[],
  bucketCount = 24,
  bucketMs = 60 * 60 * 1000,
  chartEnd = history.at(-1)?.timestamp ?? null,
): ChartRange | null {
  if (chartEnd === null) {
    return null
  }

  return {
    end: chartEnd,
    start: chartEnd - bucketCount * bucketMs,
  }
}

export function getChartBuckets(
  history: HistoryEntry[],
  bucketCount = 24,
  bucketMs = 60 * 60 * 1000,
  chartEnd = history.at(-1)?.timestamp ?? null,
): ChartBucket[] {
  const range = getChartRange(history, bucketCount, bucketMs, chartEnd)

  if (range === null) {
    return Array.from({ length: bucketCount }, (_, index) => ({
      averageResponseTime: null,
      bucketEnd: (index + 1) * bucketMs,
      bucketStart: index * bucketMs,
      failureCount: 0,
      medianResponseTime: null,
      sampleCount: 0,
    }))
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = range.end - (bucketCount - index) * bucketMs
    const bucketEnd = bucketStart + bucketMs
    const bucketEntries = history.filter(
      (entry) => entry.timestamp >= bucketStart && entry.timestamp < bucketEnd,
    )
    const onlineEntries = bucketEntries.filter(
      (entry) => entry.status === 'online' && entry.responseTime !== null,
    )

    return {
      averageResponseTime: calculateAverageResponseTime(bucketEntries),
      bucketEnd,
      bucketStart,
      failureCount: bucketEntries.filter((entry) => entry.status === 'down').length,
      medianResponseTime: calculateMedianResponseTime(bucketEntries),
      sampleCount: onlineEntries.length,
    }
  })
}
