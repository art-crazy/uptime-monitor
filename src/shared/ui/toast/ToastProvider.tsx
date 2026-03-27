import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { ToastContext, type ShowToastOptions, type ToastContextValue } from './context'
import { ToastViewport, type ToastTone } from './ToastViewport'

const DEFAULT_TOAST_DURATION = 3200
const MAX_VISIBLE_TOASTS = 3

interface ToastProviderProps {
  children: ReactNode
}

interface ToastRecord {
  id: string
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastRecord[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const clearToastTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)

    if (typeof timer === 'number') {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    clearToastTimer(id)
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }, [clearToastTimer])

  const showToast = useCallback(
    ({
      duration = DEFAULT_TOAST_DURATION,
      id = crypto.randomUUID(),
      message,
      tone = 'info',
    }: ShowToastOptions) => {
      clearToastTimer(id)

      setItems((currentItems) => {
        const nextItems = currentItems.filter((item) => item.id !== id)
        nextItems.push({ id, message, tone })

        const removedItems = nextItems.slice(0, Math.max(0, nextItems.length - MAX_VISIBLE_TOASTS))
        for (const removedItem of removedItems) {
          clearToastTimer(removedItem.id)
        }

        return nextItems.slice(-MAX_VISIBLE_TOASTS)
      })

      if (duration > 0) {
        timersRef.current.set(
          id,
          window.setTimeout(() => {
            dismissToast(id)
          }, duration),
        )
      }

      return id
    },
    [clearToastTimer, dismissToast],
  )

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      dismissToast,
      showError: (message, options) => showToast({ ...options, message, tone: 'error' }),
      showInfo: (message, options) => showToast({ ...options, message, tone: 'info' }),
      showSuccess: (message, options) => showToast({ ...options, message, tone: 'success' }),
      showToast,
    }),
    [dismissToast, showToast],
  )

  const viewportItems = useMemo(
    () => items.map(({ id, message, tone }) => ({ id, message, onDismiss: dismissToast, tone })),
    [dismissToast, items],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={viewportItems} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}
