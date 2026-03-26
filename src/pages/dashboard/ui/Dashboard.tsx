import { CircleDashed, Settings2 } from 'lucide-react'

import type { Incident } from '../../../entities/incident'
import type { InternetStatus } from '../../../entities/internet'
import type { Monitor } from '../../../entities/monitor'
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
      ? `Down - ${formatRelativeFromNow(activeIncident.startTime)}`
      : 'Down - waiting for recovery'
  }

  if (monitor.status === 'paused') {
    return 'Paused'
  }

  if (monitor.status === 'pending') {
    return 'Checking first response'
  }

  return `${formatPercent(monitor.uptimePercent)} uptime`
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
        title="Uptime Monitor"
        trailing={
          <IconButton aria-label="Open settings" onClick={onOpenSettings}>
            <Settings2 size={16} strokeWidth={2} />
          </IconButton>
        }
      />

      <InternetStatusWidget status={internetStatus} />

      {monitors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CircleDashed size={30} strokeWidth={1.8} />
          </div>
          <div className={styles.emptyTitle}>No monitors yet</div>
          <div className={styles.emptySubtitle}>
            Add a URL to start tracking uptime
          </div>
          <Button fullWidth onClick={onAddMonitor}>
            + Add your first monitor
          </Button>
        </div>
      ) : (
        <MonitorList items={items} onAdd={onAddMonitor} onSelect={onOpenMonitor} />
      )}
    </div>
  )
}
