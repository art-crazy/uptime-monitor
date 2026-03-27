import type { TranslationKey } from '@shared/lib/i18n'

export interface ResponseChartPeriod {
  bucketCount: number
  bucketMs: number
  labelKey: TranslationKey
}

export const RESPONSE_CHART_PERIODS: ResponseChartPeriod[] = [
  { bucketCount: 10, bucketMs: 30 * 1000, labelKey: 'chart_period_5m' },
  { bucketCount: 12, bucketMs: 2.5 * 60 * 1000, labelKey: 'chart_period_30m' },
  { bucketCount: 12, bucketMs: 5 * 60 * 1000, labelKey: 'chart_period_1h' },
  { bucketCount: 24, bucketMs: 60 * 60 * 1000, labelKey: 'chart_period_24h' },
]
