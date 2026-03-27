import type { ReactNode } from 'react'

import styles from './Badge.module.css'

type BadgeTone = 'success' | 'danger' | 'muted'

interface BadgeProps {
  children: ReactNode
  className?: string
  tone: BadgeTone
}

export function Badge({ children, className, tone }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
