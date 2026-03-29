import { t } from '@shared/lib/i18n'
import { useToast } from '@shared/ui/toast'
import {
  getApiImportErrorMessage,
  getApiImportSuccessMessage,
} from '../model/import-api-feedback'
import { parseApiImport } from '../model/import-api-request'
import type { ApiImportFormState } from '../model/types'
import { useApiRequestImportState } from './useApiRequestImportState'

interface UseApiRequestImportParams {
  onImported: (state: ApiImportFormState) => void
}

export function useApiRequestImport({
  onImported,
}: UseApiRequestImportParams) {
  const { showError } = useToast()
  const state = useApiRequestImportState()

  const handleApply = () => {
    const imported = parseApiImport(state.value)

    if (!imported.ok) {
      state.setMessage('')
      state.setError(getApiImportErrorMessage(imported.error.reason))
      return
    }

    onImported(imported.value.state)
    state.setError('')
    state.setMessage(getApiImportSuccessMessage(imported.value.warnings))
    state.setValue('')
    state.setIsOpen(false)
  }

  const handlePasteFromClipboard = async () => {
    state.resetInlineFeedback()

    try {
      const text = await navigator.clipboard.readText()
      state.setValue(text)
    } catch {
      showError(t('add_monitor_import_api_clipboard_error'))
    }
  }

  return {
    error: state.error,
    handleApply,
    handlePasteFromClipboard,
    handleToggle: state.handleToggle,
    handleValueChange: state.handleValueChange,
    isOpen: state.isOpen,
    message: state.message,
    value: state.value,
  }
}
