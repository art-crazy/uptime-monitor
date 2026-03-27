import { useMemo, useState } from 'react'

import {
  getChartBuckets,
  getChartRange,
  type ChartBucket,
  type HistoryEntry,
} from '../../../entities/monitor'
import { t } from '@shared/lib/i18n'
import { formatResponseTime, formatTimeRange } from '@shared/lib/time'
import { RESPONSE_CHART_PERIODS } from '../model/periods'
import styles from './ResponseChart.module.css'

interface ResponseChartProps {
  history: HistoryEntry[]
  onPeriodChange?: (periodIndex: number) => void
  periodIndex?: number
}

interface HoveredBucketState {
  bucket: ChartBucket
  index: number
}

function getBarHeight(
  bucket: ChartBucket,
  minResponseTime: number,
  maxResponseTime: number,
): number {
  if (bucket.sampleCount === 0 && bucket.failureCount === 0) {
    return 12
  }

  if (bucket.averageResponseTime === null || maxResponseTime <= 0) {
    return 20
  }

  if (maxResponseTime === minResponseTime) {
    return 64
  }

  const normalized = (bucket.averageResponseTime - minResponseTime) / (maxResponseTime - minResponseTime)
  return Math.round(24 + normalized * 66)
}

export function ResponseChart({
  history,
  onPeriodChange,
  periodIndex: controlledPeriodIndex,
}: ResponseChartProps) {
  const [internalPeriodIndex, setInternalPeriodIndex] = useState(0)
  const [hoveredBucket, setHoveredBucket] = useState<HoveredBucketState | null>(null)
  const periodIndex = controlledPeriodIndex ?? internalPeriodIndex
  const period = RESPONSE_CHART_PERIODS[periodIndex]
  const chartRange = useMemo(
    () => getChartRange(history, period.bucketCount, period.bucketMs),
    [history, period],
  )

  const buckets = useMemo(() => {
    return getChartBuckets(history, period.bucketCount, period.bucketMs, chartRange?.end ?? null)
  }, [chartRange, history, period])

  const periodLabels = useMemo(() => RESPONSE_CHART_PERIODS.map((item) => t(item.labelKey)), [])

  const { maxResponseTime, minResponseTime } = useMemo(() => {
    const values = buckets
      .map((bucket) => bucket.averageResponseTime)
      .filter((value): value is number => value !== null)

    if (values.length === 0) {
      return {
        maxResponseTime: 0,
        minResponseTime: 0,
      }
    }

    return {
      maxResponseTime: Math.max(...values),
      minResponseTime: Math.min(...values),
    }
  }, [buckets])

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.title}>{t('chart_title')}</div>
          <div className={styles.periodValue}>
            {t('chart_period_label')}
            {' '}
            {periodLabels[periodIndex]}
          </div>
        </div>
        <div className={styles.tabs} role="tablist">
          {periodLabels.map((label, index) => (
            <button
              aria-selected={index === periodIndex}
              className={[styles.tab, index === periodIndex ? styles.tabActive : ''].filter(Boolean).join(' ')}
              key={label}
              onClick={() => {
                if (controlledPeriodIndex === undefined) {
                  setInternalPeriodIndex(index)
                }

                onPeriodChange?.(index)
              }}
              role="tab"
              tabIndex={index === periodIndex ? 0 : -1}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.barsWrap}>
        {hoveredBucket ? (
          <div
            className={styles.tooltip}
            style={{ left: `${((hoveredBucket.index + 0.5) / buckets.length) * 100}%` }}
          >
            <div className={styles.tooltipLine}>
              {formatTimeRange(hoveredBucket.bucket.bucketStart, hoveredBucket.bucket.bucketEnd)}
            </div>
            <div className={styles.tooltipLine}>
              {t('chart_samples', String(hoveredBucket.bucket.sampleCount))}
            </div>
            {hoveredBucket.bucket.failureCount > 0 ? (
              <div className={styles.tooltipLine}>
                {t('chart_bar_failures', String(hoveredBucket.bucket.failureCount))}
              </div>
            ) : null}
            <div className={styles.tooltipLine}>
              {hoveredBucket.bucket.averageResponseTime === null
                ? t('chart_bar_no_samples')
                : t('chart_bar_average', formatResponseTime(hoveredBucket.bucket.averageResponseTime))}
            </div>
            {hoveredBucket.bucket.medianResponseTime !== null ? (
              <div className={styles.tooltipLine}>
                {t('chart_bar_median', formatResponseTime(hoveredBucket.bucket.medianResponseTime))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className={styles.bars}>
        {buckets.map((bucket, index) => {
          const hasData = bucket.sampleCount > 0 || bucket.failureCount > 0
          const hasFailures = bucket.failureCount > 0
          const isMaxBucket =
            bucket.averageResponseTime !== null &&
            maxResponseTime > minResponseTime &&
            bucket.averageResponseTime === maxResponseTime

          return (
            <div className={styles.barSlot} key={`${index}-${bucket.bucketStart}`}>
              <div className={styles.barValue}>
                {bucket.averageResponseTime === null ? '' : Math.round(bucket.averageResponseTime)}
              </div>
              <button
                aria-label={[
                  formatTimeRange(bucket.bucketStart, bucket.bucketEnd),
                  t('chart_samples', String(bucket.sampleCount)),
                  hasFailures ? t('chart_bar_failures', String(bucket.failureCount)) : null,
                  bucket.averageResponseTime === null
                    ? t('chart_bar_no_samples')
                    : t('chart_bar_average', formatResponseTime(bucket.averageResponseTime)),
                  bucket.medianResponseTime === null
                    ? null
                    : t('chart_bar_median', formatResponseTime(bucket.medianResponseTime)),
                ].filter(Boolean).join(', ')}
                className={[
                  styles.barButton,
                  styles.bar,
                  hasFailures ? styles.barFailure : hasData ? styles.barHealthy : styles.barEmpty,
                  isMaxBucket ? styles.barPeak : '',
                ].join(' ')}
                onBlur={() => setHoveredBucket((current) => current?.index === index ? null : current)}
                onFocus={() => setHoveredBucket({ bucket, index })}
                onMouseEnter={() => setHoveredBucket({ bucket, index })}
                onMouseLeave={() => setHoveredBucket((current) => current?.index === index ? null : current)}
                style={{ height: `${getBarHeight(bucket, minResponseTime, maxResponseTime)}%` }}
                type="button"
              />
            </div>
          )
        })}
        </div>
      </div>

    </section>
  )
}
