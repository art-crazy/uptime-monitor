import type { InternetStatus } from '../../../entities/internet'
import styles from './InternetStatus.module.css'

interface InternetStatusProps {
  status: InternetStatus
}

export function InternetStatusWidget({ status }: InternetStatusProps) {
  const hasResult = status.lastChecked > 0
  const isOnline = hasResult && status.online
  const classes = [
    styles.block,
    hasResult ? (isOnline ? styles.online : styles.offline) : styles.pending,
  ].join(' ')
  const dotClasses = [
    styles.dot,
    hasResult ? (isOnline ? styles.dotOnline : styles.dotOffline) : styles.dotPending,
  ].join(' ')

  return (
    <section className={classes}>
      <span className={dotClasses} />
      <div className={styles.copy}>
        <div className={styles.title}>Internet connection</div>
        <div className={styles.subtitle}>
          {hasResult
            ? isOnline
              ? `Online - ${status.pingMs ?? '--'}ms response`
              : 'Offline - no response'
            : 'Checking...'}
        </div>
      </div>
    </section>
  )
}
