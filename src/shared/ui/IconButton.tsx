import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './IconButton.module.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function IconButton({
  children,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={[styles.button, className ?? ''].filter(Boolean).join(' ')}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
