import { getResponseTone } from '../../../shared/lib/response'
import { formatResponseTime } from '../../../shared/lib/time'

import styles from './ResponseTime.module.css'

interface ResponseTimeProps {
  responseTime: number | null
}

export function ResponseTime({ responseTime }: ResponseTimeProps) {
  if (responseTime === null) {
    return <span className={styles.down}>--</span>
  }

  const tone = getResponseTone(responseTime)

  return <span className={styles[tone]}>{formatResponseTime(responseTime)}</span>
}
