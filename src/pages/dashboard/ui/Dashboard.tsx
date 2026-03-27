import { CircleDashed, Settings } from 'lucide-react'

import type { Incident } from '../../../entities/incident'
import type { InternetStatus } from '../../../entities/internet'
import type { Monitor } from '../../../entities/monitor'
import { t } from '../../../shared/lib/i18n'
import { formatPercent, formatRelativeFromNow } from '../../../shared/lib/time'
import { Button } from '../../../shared/ui/Button'
import { IconButton } from '../../../shared/ui/IconButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { InternetStatusWidget } from '../../../widgets/internet-status'
import { MonitorList, type MonitorListEntry } from '../../../widgets/monitor-list'
import styles from './Dashboard.module.css'

function getSubtitle(monitor: Monitor, incidents: Incident[]): string {
  if (monitor.status === 'down') {
    const activeIncident = incidents.find(
      (incident) => incident.monitorId === monitor.id && incident.endTime === null,
    )

    return activeIncident
      ? t('dashboard_status_down_relative', formatRelativeFromNow(activeIncident.startTime))
      : t('dashboard_status_down_waiting')
  }

  if (monitor.status === 'paused') {
    return t('dashboard_status_paused')
  }

  if (monitor.status === 'pending') {
    return t('dashboard_status_pending')
  }

  return t('dashboard_status_uptime', formatPercent(monitor.uptimePercent))
}

function sortMonitors(monitors: Monitor[]): Monitor[] {
  const priority: Record<Monitor['status'], number> = {
    down: 0,
    pending: 1,
    online: 2,
    paused: 3,
  }

  return [...monitors].sort((left, right) => {
    const statusDiff = priority[left.status] - priority[right.status]

    if (statusDiff !== 0) {
      return statusDiff
    }

    return left.name.localeCompare(right.name)
  })
}

interface DashboardPageProps {
  incidents: Incident[]
  internetStatus: InternetStatus
  monitors: Monitor[]
  onAddMonitor: () => void
  onOpenMonitor: (monitorId: string) => void
  onOpenSettings: () => void
}

export function DashboardPage({
  incidents,
  internetStatus,
  monitors,
  onAddMonitor,
  onOpenMonitor,
  onOpenSettings,
}: DashboardPageProps) {
  const items: MonitorListEntry[] = sortMonitors(monitors).map((monitor) => ({
    monitor,
    subtitle: getSubtitle(monitor, incidents),
  }))

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('ext_name')}
        trailing={
          <IconButton aria-label={t('dashboard_open_settings_aria')} onClick={onOpenSettings}>
            <Settings size={16} strokeWidth={1.75} />
          </IconButton>
        }
      />

      <InternetStatusWidget status={internetStatus} />

      {monitors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CircleDashed size={30} strokeWidth={1.8} />
          </div>
          <div className={styles.emptyTitle}>{t('dashboard_empty_title')}</div>
          <div className={styles.emptySubtitle}>{t('dashboard_empty_subtitle')}</div>
          <Button fullWidth onClick={onAddMonitor}>
            {t('dashboard_add_first_monitor')}
          </Button>
        </div>
      ) : (
        <MonitorList items={items} onAdd={onAddMonitor} onSelect={onOpenMonitor} />
      )}
    </div>
  )
}
