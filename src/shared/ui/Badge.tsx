import type { ReactNode } from 'react'

import styles from './Badge.module.css'

type BadgeTone = 'success' | 'danger' | 'muted'

interface BadgeProps {
  children: ReactNode
  tone: BadgeTone
}

export function Badge({ children, tone }: BadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(' ')}>{children}</span>
}
