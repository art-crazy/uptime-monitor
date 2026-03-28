import { Button } from '@shared/ui/Button'
import { t } from '@shared/lib/i18n'
import styles from './AddMonitorForm.module.css'

interface ApiRequestImportProps {
  disabled: boolean
  error: string
  isOpen: boolean
  message: string
  value: string
  onApply: () => void
  onCancel: () => void
  onPasteFromClipboard: () => void
  onToggle: () => void
  onValueChange: (value: string) => void
}

export function ApiRequestImport({
  disabled,
  error,
  isOpen,
  message,
  value,
  onApply,
  onCancel,
  onPasteFromClipboard,
  onToggle,
  onValueChange,
}: ApiRequestImportProps) {
  return (
    <div className={styles.importPanel}>
      <div className={styles.importHeader}>
        <div className={styles.label}>{t('add_monitor_import_api_label')}</div>
        <Button disabled={disabled} onClick={onToggle} size="sm" variant="secondary">
          {t('add_monitor_import_api_trigger')}
        </Button>
      </div>
      <div className={styles.hint}>{t('add_monitor_import_api_hint')}</div>

      {isOpen ? (
        <div className={styles.importCard}>
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

          <div className={styles.importActions}>
            <Button disabled={disabled} onClick={onPasteFromClipboard} size="sm" variant="ghost">
              {t('add_monitor_import_api_paste')}
            </Button>
            <Button
              disabled={disabled || value.trim().length === 0}
              onClick={onApply}
              size="sm"
              variant="primary"
            >
              {t('add_monitor_import_api_apply')}
            </Button>
            <Button disabled={disabled} onClick={onCancel} size="sm" variant="ghost">
              {t('add_monitor_import_api_cancel')}
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
