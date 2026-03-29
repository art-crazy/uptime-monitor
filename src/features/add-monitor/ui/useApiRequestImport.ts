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
  const { showError, showSuccess } = useToast()
  const state = useApiRequestImportState()

  const handleApply = () => {
    const imported = parseApiImport(state.value)

    if (!imported.ok) {
      showError(getApiImportErrorMessage(imported.error.reason))
      return
    }

    onImported(imported.value.state)
    showSuccess(getApiImportSuccessMessage(imported.value.warnings))
    state.setValue('')
    state.setIsOpen(false)
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      state.setValue(text)
    } catch {
      showError(t('add_monitor_import_api_clipboard_error'))
    }
  }

  return {
    handleApply,
    handlePasteFromClipboard,
    handleToggle: state.handleToggle,
    handleValueChange: state.handleValueChange,
    isOpen: state.isOpen,
    value: state.value,
  }
}
