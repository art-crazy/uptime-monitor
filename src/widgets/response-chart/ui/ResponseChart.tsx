import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

import {
  getChartBuckets,
  type ChartRange,
  type ChartBucket,
  type HistoryEntry,
} from '../../../entities/monitor'
import { t } from '@shared/lib/i18n'
import { formatResponseTime, formatTimeRange } from '@shared/lib/time'
import type { ResponseChartPeriod } from '../model/periods'
import styles from './ResponseChart.module.css'

interface ResponseChartProps {
  chartRange: ChartRange | null
  history: HistoryEntry[]
  onPeriodChange?: (periodIndex: number) => void
  periods: ResponseChartPeriod[]
  periodIndex?: number
}

interface HoveredBucketState {
  bucket: ChartBucket
  index: number
}

function updateTooltipPosition(
  barsWrapElement: HTMLDivElement,
  tooltipElement: HTMLDivElement,
  bucketIndex: number,
  bucketCount: number,
) {
  if (bucketCount === 0) {
    tooltipElement.style.removeProperty('left')
    return
  }

  const containerWidth = barsWrapElement.clientWidth
  const tooltipWidth = tooltipElement.offsetWidth
  const anchorX = ((bucketIndex + 0.5) / bucketCount) * containerWidth
  const edgePadding = 6
  const maxLeft = Math.max(edgePadding, containerWidth - tooltipWidth - edgePadding)
  const nextLeft = Math.min(Math.max(anchorX - tooltipWidth / 2, edgePadding), maxLeft)

  tooltipElement.style.left = `${nextLeft}px`
}

function useTooltipPosition(
  barsWrapRef: RefObject<HTMLDivElement | null>,
  tooltipRef: RefObject<HTMLDivElement | null>,
  hoveredBucket: HoveredBucketState | null,
  bucketCount: number,
) {
  useLayoutEffect(() => {
    if (!tooltipRef.current) {
      return
    }

    if (!hoveredBucket || !barsWrapRef.current || bucketCount === 0) {
      tooltipRef.current.style.removeProperty('left')
      return
    }

    updateTooltipPosition(barsWrapRef.current, tooltipRef.current, hoveredBucket.index, bucketCount)
  }, [barsWrapRef, bucketCount, hoveredBucket, tooltipRef])

  useLayoutEffect(() => {
    if (!barsWrapRef.current || !tooltipRef.current || !hoveredBucket) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!barsWrapRef.current || !tooltipRef.current || bucketCount === 0) {
        return
      }

      updateTooltipPosition(barsWrapRef.current, tooltipRef.current, hoveredBucket.index, bucketCount)
    })

    resizeObserver.observe(barsWrapRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [barsWrapRef, bucketCount, hoveredBucket, tooltipRef])
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
  chartRange,
  history,
  onPeriodChange,
  periods,
  periodIndex: controlledPeriodIndex,
}: ResponseChartProps) {
  const [internalPeriodIndex, setInternalPeriodIndex] = useState(0)
  const [hoveredBucket, setHoveredBucket] = useState<HoveredBucketState | null>(null)
  const barsWrapRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const periodIndex = controlledPeriodIndex ?? internalPeriodIndex
  const period = periods[periodIndex] ?? periods[0]

  const buckets = useMemo(() => {
    return getChartBuckets(history, chartRange, period.bucketCount, period.bucketMs)
  }, [chartRange, history, period])

  const periodLabels = useMemo(() => periods.map((item) => t(item.labelKey)), [periods])

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

  useTooltipPosition(barsWrapRef, tooltipRef, hoveredBucket, buckets.length)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>{t('chart_title')}</div>
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

      <div className={styles.barsWrap} ref={barsWrapRef}>
        {hoveredBucket ? (
          <div
            className={styles.tooltip}
            ref={tooltipRef}
          >
            <div className={styles.tooltipLine}>
              {hoveredBucket.bucket.sampleCount === 0 && hoveredBucket.bucket.failureCount === 0
                ? t('chart_bar_no_samples')
                : formatTimeRange(hoveredBucket.bucket.bucketStart, hoveredBucket.bucket.bucketEnd)}
            </div>
            <div className={styles.tooltipLine}>
              {t('chart_bar_failures', String(hoveredBucket.bucket.failureCount))}
            </div>
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
                    bucket.sampleCount === 0 && bucket.failureCount === 0
                      ? t('chart_bar_no_samples')
                      : formatTimeRange(bucket.bucketStart, bucket.bucketEnd),
                    t('chart_bar_failures', String(bucket.failureCount)),
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
