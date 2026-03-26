import { Badge } from '../../../shared/ui/Badge'

import type { Monitor } from '../model/types'
import { ResponseTime } from './ResponseTime'
import { StatusDot } from './StatusDot'
import styles from './MonitorRow.module.css'

interface MonitorRowProps {
  monitor: Monitor
  subtitle: string
  onClick: () => void
}

export function MonitorRow({ monitor, onClick, subtitle }: MonitorRowProps) {
  const isDown = monitor.status === 'down'
  const isPending = monitor.status === 'pending'
  const badge =
    monitor.status === 'down' ? (
      <Badge tone="danger">DOWN</Badge>
    ) : monitor.status === 'paused' ? (
      <Badge tone="muted">PAUSED</Badge>
    ) : monitor.status === 'pending' ? (
      <Badge tone="muted">CHECKING</Badge>
    ) : (
      <ResponseTime responseTime={monitor.responseTime} />
    )

  return (
    <button
      className={[
        styles.row,
        isDown ? styles.down : '',
        isPending ? styles.pending : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      title={monitor.name}
      type="button"
    >
      <StatusDot status={monitor.status} />
      <span className={styles.info}>
        <span className={styles.name}>{monitor.name}</span>
        <span className={[styles.subtitle, isDown ? styles.subtitleDown : ''].join(' ')}>
          {subtitle}
        </span>
      </span>
      <span className={styles.right}>
        {badge}
        <span aria-hidden="true" className={styles.arrow}>
          &rsaquo;
        </span>
      </span>
    </button>
  )
}
