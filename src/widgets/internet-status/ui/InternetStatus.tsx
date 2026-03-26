import type { InternetStatus } from '../../../entities/internet'
import { t } from '../../../shared/lib/i18n'
import { formatResponseTime } from '../../../shared/lib/time'
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
        <div className={styles.title}>{t('internet_title')}</div>
        <div className={styles.subtitle}>
          {hasResult
            ? isOnline
              ? t(
                  'internet_status_online',
                  status.pingMs === null ? '--' : formatResponseTime(status.pingMs),
                )
              : t('internet_status_offline')
            : t('internet_status_checking')}
        </div>
      </div>
    </section>
  )
}
