import { ArrowLeft } from 'lucide-react'
import { useId, useState } from 'react'

import type { CheckInterval } from '../../../entities/monitor'
import { AddMonitorForm, type MonitorFormDraft } from '../../../features/add-monitor'
import { t } from '@shared/lib/i18n'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { PageHeader } from '@shared/ui/PageHeader'
import { PageLayout } from '@shared/ui/PageLayout'

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
  const formId = useId()
  const [formState, setFormState] = useState({ isDisabled: true, isSaving: false })

  return (
    <PageLayout
      header={
        <PageHeader
          leading={
            <IconButton aria-label={t('common_go_back_aria')} onClick={onBack}>
              <ArrowLeft size={16} strokeWidth={2} />
            </IconButton>
          }
          title={monitor ? t('add_monitor_edit_title') : t('add_monitor_title')}
        />
      }
      footer={
        <Button
          disabled={formState.isDisabled}
          form={formId}
          fullWidth
          loading={formState.isSaving}
          type="submit"
          variant="primary"
        >
          {monitor ? t('add_monitor_button_save_changes') : t('add_monitor_button_save')}
        </Button>
      }
    >
      <AddMonitorForm
        defaultInterval={defaultInterval}
        formId={formId}
        monitor={monitor}
        onSaved={onSaved}
        onStateChange={setFormState}
      />
    </PageLayout>
  )
}
