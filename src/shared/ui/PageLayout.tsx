import type { ReactNode } from 'react'

import styles from './PageLayout.module.css'

interface PageLayoutProps {
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function PageLayout({ header, children, footer }: PageLayoutProps) {
  return (
    <div className={styles.page}>
      {header}
      <div className={styles.body}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
