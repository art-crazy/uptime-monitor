import { getChartHistory, type HistoryEntry } from '../../../entities/monitor'
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
      <div className={styles.label}>Response time - last 24h</div>
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
                    ? 'Down'
                    : `${entry.responseTime}ms`
                  : 'No samples'
              }
            />
          )
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.good}>good</span>
        <span className={styles.slow}>slow</span>
        <span className={styles.down}>down</span>
      </div>
    </section>
  )
}
