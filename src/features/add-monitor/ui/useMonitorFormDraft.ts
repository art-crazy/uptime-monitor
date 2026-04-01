import { useCallback, useEffect, useRef, useState } from 'react'

import { t } from '@shared/lib/i18n'
import { useToast } from '@shared/ui/toast'
import { useFormDraft } from '@shared/hooks/useFormDraft'
import { type MonitorFormState } from '../model/defaults'
import type { MonitorFormDraft } from '../model/types'

type DraftState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; draft: MonitorFormState }

interface MonitorFormDraftResult {
  draftState: DraftState
  // Call after the draft has been applied to form fields to prevent re-application.
  onDraftApplied: () => void
  saveDraft: (value: MonitorFormState) => void
  clearDraft: () => void
}

// Encapsulates draft load/save/clear lifecycle for the add-monitor form.
// Works for both new monitors and edit mode — draft is keyed by monitor id when editing.
export function useMonitorFormDraft(
  monitor: MonitorFormDraft | undefined,
): MonitorFormDraftResult {
  const monitorId = monitor?.id
  const draftKey = monitorId ? `edit:${monitorId}` : 'new-monitor'
  const { loadDraft, saveDraft, clearDraft } = useFormDraft<MonitorFormState>(draftKey)
  const { showInfo } = useToast()
  const [draftState, setDraftState] = useState<DraftState>({ status: 'loading' })
  // Ref mirrors draftState.status to avoid rebuilding persistDraft on every status transition.
  const draftStatusRef = useRef<DraftState['status']>('loading')

  useEffect(() => {
    void loadDraft().then((draft) => {
      if (draft) {
        draftStatusRef.current = 'ready'
        setDraftState({ status: 'ready', draft })
        showInfo(t('add_monitor_draft_restored'))
      } else {
        draftStatusRef.current = 'empty'
        setDraftState({ status: 'empty' })
      }
    })
  }, [loadDraft, showInfo])

  const onDraftApplied = useCallback(() => {
    draftStatusRef.current = 'empty'
    setDraftState({ status: 'empty' })
  }, [])

  const persistDraft = useCallback(
    (value: MonitorFormState) => {
      if (draftStatusRef.current === 'loading') {
        return
      }

      saveDraft(value)
    },
    [saveDraft],
  )

  return { draftState, onDraftApplied, saveDraft: persistDraft, clearDraft }
}
