import { Button } from '@shared/ui/Button'
import { t } from '@shared/lib/i18n'
import styles from './AddMonitorForm.module.css'

interface ApiRequestImportTriggerProps {
  disabled: boolean
  isOpen: boolean
  onToggle: () => void
}

interface ApiRequestImportPanelProps {
  disabled: boolean
  error: string
  isOpen: boolean
  message: string
  onApply: () => void
  onPasteFromClipboard: () => void
  onValueChange: (value: string) => void
  value: string
}

export function ApiRequestImportTrigger({
  disabled,
  isOpen,
  onToggle,
}: ApiRequestImportTriggerProps) {
  const triggerClassName = [
    styles.importTrigger,
    isOpen ? styles.importTriggerActive : '',
  ].filter(Boolean).join(' ')

  return (
    <Button
      className={triggerClassName}
      disabled={disabled}
      onClick={onToggle}
      size="sm"
      variant="ghost"
    >
      {t('add_monitor_import_api_trigger')}
    </Button>
  )
}

export function ApiRequestImportPanel({
  disabled,
  error,
  isOpen,
  message,
  onApply,
  onPasteFromClipboard,
  onValueChange,
  value,
}: ApiRequestImportPanelProps) {
  if (!isOpen && !error && !message) {
    return null
  }

  return (
    <div className={styles.importSection}>
      {isOpen ? (
        <div className={styles.importEditor}>
          <textarea
            className={styles.textarea}
            disabled={disabled}
            onChange={(event) => {
              onValueChange(event.target.value)
            }}
            placeholder={t('add_monitor_import_api_placeholder')}
            spellCheck={false}
            value={value}
          />

          <div className={styles.importEditorActions}>
            <button
              className={styles.importTextAction}
              disabled={disabled}
              onClick={onPasteFromClipboard}
              type="button"
            >
              {t('add_monitor_import_api_paste')}
            </button>
            <Button
              disabled={disabled || value.trim().length === 0}
              onClick={onApply}
              size="sm"
              variant="primary"
            >
              {t('add_monitor_import_api_apply')}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className={[styles.hint, styles.hintError].join(' ')}>{error}</div>
      ) : null}
      {!error && message ? (
        <div className={styles.hintSuccess}>{message}</div>
      ) : null}
    </div>
  )
}
