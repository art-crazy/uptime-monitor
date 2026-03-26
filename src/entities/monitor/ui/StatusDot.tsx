import type { MonitorStatus } from '../model/types'

import styles from './StatusDot.module.css'

interface StatusDotProps {
  status: MonitorStatus
}

export function StatusDot({ status }: StatusDotProps) {
  return <span className={[styles.dot, styles[status]].join(' ')} />
}
