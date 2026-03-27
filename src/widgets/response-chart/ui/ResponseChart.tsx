import { getChartHistory, type HistoryEntry } from '../../../entities/monitor'
import { t } from '../../../shared/lib/i18n'
import { formatResponseTime } from '../../../shared/lib/time'
import { getResponseTone } from '../../../shared/lib/response'
import styles from './ResponseChart.module.css'

interface ResponseChartProps {
  history: HistoryEntry[]
}

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
  const entries = getChartHistory(history)

  return (
    <section className={styles.section}>
      <div className={styles.label}>{t('chart_title')}</div>
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
      <div className={styles.legend}>
        <span className={styles.legendGood}>{t('chart_legend_good')}</span>
        <span className={styles.legendSlow}>{t('chart_legend_slow')}</span>
        <span className={styles.legendDown}>{t('chart_legend_down')}</span>
      </div>
    </section>
  )
}
