import type { TranslationKey } from '@shared/lib/i18n'
import type { CheckInterval } from '../../../entities/monitor'

export interface ResponseChartPeriod {
  bucketCount: number
  bucketMs: number
  labelKey: TranslationKey
  windowMs: number
}

interface ResponseChartPeriodDefinition {
  labelKey: TranslationKey
  maxBuckets: number
  windowMs: number
}

const RESPONSE_CHART_PERIOD_DEFINITIONS: ResponseChartPeriodDefinition[] = [
  { maxBuckets: 10, windowMs: 5 * 60 * 1000, labelKey: 'chart_period_5m' },
  { maxBuckets: 12, windowMs: 30 * 60 * 1000, labelKey: 'chart_period_30m' },
  { maxBuckets: 12, windowMs: 60 * 60 * 1000, labelKey: 'chart_period_1h' },
  { maxBuckets: 24, windowMs: 24 * 60 * 60 * 1000, labelKey: 'chart_period_24h' },
]

export function getResponseChartPeriods(interval: CheckInterval): ResponseChartPeriod[] {
  const intervalMs = interval * 1000

  return RESPONSE_CHART_PERIOD_DEFINITIONS.map(({ labelKey, maxBuckets, windowMs }) => {
    if (intervalMs >= windowMs) {
      return {
        bucketCount: 1,
        bucketMs: windowMs,
        labelKey,
        windowMs,
      }
    }

    const expectedChecks = Math.ceil(windowMs / intervalMs)
    const checksPerBucket = Math.max(1, Math.ceil(expectedChecks / maxBuckets))
    const bucketMs = intervalMs * checksPerBucket
    const bucketCount = Math.max(1, Math.ceil(windowMs / bucketMs))

    return {
      bucketCount,
      bucketMs,
      labelKey,
      windowMs,
    }
  })
}

export type { ResponseChartPeriodDefinition }
