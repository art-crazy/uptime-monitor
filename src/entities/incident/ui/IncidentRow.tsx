import { formatDuration, formatIncidentTimestamp } from '../../../shared/lib/time'

import type { Incident } from '../model/types'
import styles from './IncidentRow.module.css'

interface IncidentRowProps {
  incident: Incident
}

export function IncidentRow({ incident }: IncidentRowProps) {
  const isOngoing = incident.endTime === null
  const label = isOngoing ? 'Down' : 'Up'
  const resolvedEndTime = incident.endTime ?? incident.startTime
  const timestamp = isOngoing
    ? formatIncidentTimestamp(incident.startTime)
    : formatIncidentTimestamp(resolvedEndTime)
  const duration = isOngoing
    ? 'ongoing'
    : formatDuration(resolvedEndTime - incident.startTime)

  return (
    <div className={styles.row}>
      <span className={[styles.label, isOngoing ? styles.down : styles.up].join(' ')}>
        {label}
      </span>
      <span className={styles.meta}>
        {timestamp} · {duration}
      </span>
    </div>
  )
}
