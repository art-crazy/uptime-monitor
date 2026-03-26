import { ArrowLeft } from 'lucide-react'

import type { CheckInterval } from '../../../entities/monitor'
import { AddMonitorForm, type MonitorFormDraft } from '../../../features/add-monitor'
import { IconButton } from '../../../shared/ui/IconButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import styles from './AddMonitor.module.css'

interface AddMonitorPageProps {
  defaultInterval: CheckInterval
  monitor?: MonitorFormDraft
  onBack: () => void
  onSaved: (monitorId: string) => void
}

export function AddMonitorPage({
  defaultInterval,
  monitor,
  onBack,
  onSaved,
}: AddMonitorPageProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        leading={
          <IconButton aria-label="Go back" onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title={monitor ? 'Edit monitor' : 'Add monitor'}
      />
      <AddMonitorForm
        defaultInterval={defaultInterval}
        monitor={monitor}
        onSaved={onSaved}
      />
    </div>
  )
}
