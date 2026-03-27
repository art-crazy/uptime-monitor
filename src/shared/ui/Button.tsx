import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { Spinner } from './Spinner'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dashed' | 'danger' | 'telegram'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  fullWidth?: boolean
  iconLeading?: ReactNode
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  children,
  className,
  fullWidth = false,
  iconLeading,
  loading = false,
  size = 'md',
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          {iconLeading ? <span className={styles.iconLeading}>{iconLeading}</span> : null}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
