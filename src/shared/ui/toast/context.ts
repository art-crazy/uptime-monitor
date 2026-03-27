import { createContext } from 'react'

import type { ToastTone } from './ToastViewport'

export interface ShowToastOptions {
  duration?: number
  id?: string
  message: string
  tone?: ToastTone
}

export interface ToastContextValue {
  dismissToast: (id: string) => void
  showError: (message: string, options?: Omit<ShowToastOptions, 'message' | 'tone'>) => string
  showInfo: (message: string, options?: Omit<ShowToastOptions, 'message' | 'tone'>) => string
  showSuccess: (message: string, options?: Omit<ShowToastOptions, 'message' | 'tone'>) => string
  showToast: (options: ShowToastOptions) => string
}

export const ToastContext = createContext<ToastContextValue | null>(null)
