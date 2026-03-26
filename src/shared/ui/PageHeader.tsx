import type { ReactNode } from 'react'

import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
}

export function PageHeader({ leading, title, trailing }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leading}>{leading}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.trailing}>{trailing}</div>
    </header>
  )
}
