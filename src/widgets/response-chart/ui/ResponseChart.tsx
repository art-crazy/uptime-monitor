import { useState, useMemo } from 'react'
import { getChartHistory, type HistoryEntry } from '../../../entities/monitor'
import { t, type TranslationKey } from '@shared/lib/i18n'
import { formatResponseTime } from '@shared/lib/time'
import { getResponseTone } from '@shared/lib/response'
import styles from './ResponseChart.module.css'

interface ResponseChartProps {
  history: HistoryEntry[]
}

type ChartPeriod =
  | { lastN: number; labelKey: TranslationKey }
  | { bucketCount: number; bucketMs: number; labelKey: TranslationKey }

const PERIODS: ChartPeriod[] = [
  { lastN: 10, labelKey: 'chart_period_5m' },
  { bucketCount: 12, bucketMs: 2.5 * 60 * 1000, labelKey: 'chart_period_30m' },
  { bucketCount: 12, bucketMs: 5 * 60 * 1000, labelKey: 'chart_period_1h' },
  { bucketCount: 24, bucketMs: 60 * 60 * 1000, labelKey: 'chart_period_24h' },
]

function getBarHeight(entry: HistoryEntry | null): number {
  if (entry === null) {
    return 12
  }

  if (entry.responseTime === null) {
    return 100
  }

  return Math.max(18, Math.min(100, Math.round((entry.responseTime / 1000) * 100)))
}

export function ResponseChart({ history }: ResponseChartProps) {
  const [periodIndex, setPeriodIndex] = useState(0)
  const period = PERIODS[periodIndex]
  const entries = useMemo(() => {
    if ('lastN' in period) {
      const last = history.slice(-period.lastN)
      const padding: Array<null> = Array.from({ length: Math.max(0, period.lastN - last.length) }, () => null)
      return [...padding, ...last] as Array<HistoryEntry | null>
    }
    return getChartHistory(history, period.bucketCount, period.bucketMs)
  }, [history, period])

  const periodLabels = useMemo(
    () => PERIODS.map((p) => t(p.labelKey)),
    [],
  )

  return (
    <section className={styles.section}>
      <div className={styles.tabs} role="tablist">
        {periodLabels.map((label, index) => (
          <button
            aria-selected={index === periodIndex}
            className={[styles.tab, index === periodIndex ? styles.tabActive : ''].filter(Boolean).join(' ')}
            key={label}
            onClick={() => setPeriodIndex(index)}
            role="tab"
            tabIndex={index === periodIndex ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.bars}>
        {entries.map((entry, index) => {
          const tone = entry === null ? 'empty' : getResponseTone(entry.responseTime)

          return (
            <span
              className={[styles.bar, styles[tone]].join(' ')}
              key={`${index}-${entry?.timestamp ?? 'empty'}`}
              style={{ height: `${getBarHeight(entry)}%` }}
              title={
                entry
                  ? entry.responseTime === null
                    ? t('chart_bar_down')
                    : formatResponseTime(entry.responseTime)
                  : t('chart_bar_no_samples')
              }
            />
          )
        })}
      </div>
    </section>
  )
}
