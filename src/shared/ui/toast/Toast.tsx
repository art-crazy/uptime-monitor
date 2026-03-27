import { X } from 'lucide-react'

import { t } from '@shared/lib/i18n'
import styles from './Toast.module.css'
import type { ToastTone } from './ToastViewport'

const toneClassNameMap: Record<ToastTone, string> = {
  error: styles.toneError,
  info: styles.toneInfo,
  success: styles.toneSuccess,
}

export interface ToastProps {
  id: string
  message: string
  onDismiss: (id: string) => void
  tone: ToastTone
}

export function Toast({ id, message, onDismiss, tone }: ToastProps) {
  return (
    <div
      aria-atomic="true"
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={[styles.toast, toneClassNameMap[tone]].join(' ')}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span aria-hidden className={styles.accent} />
      <div className={styles.message}>{message}</div>
      <button
        aria-label={t('common_close_notification')}
        className={styles.closeButton}
        onClick={() => onDismiss(id)}
        type="button"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
