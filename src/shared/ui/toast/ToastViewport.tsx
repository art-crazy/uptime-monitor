import { Toast } from './Toast'
import styles from './Toast.module.css'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItemProps {
  id: string
  message: string
  tone: ToastTone
  onDismiss: (id: string) => void
}

export interface ToastViewportProps {
  items: ToastItemProps[]
  onDismiss: (id: string) => void
}

export function ToastViewport({ items, onDismiss }: ToastViewportProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={styles.viewport}>
      {items.map((item) => (
        <Toast
          id={item.id}
          key={item.id}
          message={item.message}
          onDismiss={onDismiss}
          tone={item.tone}
        />
      ))}
    </div>
  )
}
