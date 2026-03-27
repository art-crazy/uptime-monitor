import { ArrowLeft } from 'lucide-react'

import type { CheckInterval } from '../../../entities/monitor'
import { AddMonitorForm, type MonitorFormDraft } from '../../../features/add-monitor'
import { t } from '@shared/lib/i18n'
import { IconButton } from '@shared/ui/IconButton'
import { PageHeader } from '@shared/ui/PageHeader'
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
          <IconButton aria-label={t('common_go_back_aria')} onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title={monitor ? t('add_monitor_edit_title') : t('add_monitor_title')}
      />
      <div className={styles.body}>
        <AddMonitorForm
          defaultInterval={defaultInterval}
          monitor={monitor}
          onSaved={onSaved}
        />
      </div>
    </div>
  )
}
