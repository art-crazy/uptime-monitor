import styles from './Toggle.module.css'

export interface ToggleOption<T extends string | number> {
  label: string
  value: T
}

interface ToggleProps<T extends string | number> {
  disabled?: boolean
  options: readonly ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function Toggle<T extends string | number>({
  disabled = false,
  onChange,
  options,
  value,
}: ToggleProps<T>) {
  return (
    <div className={styles.toggle} role="tablist">
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            aria-selected={isActive}
            key={String(option.value)}
            className={[styles.option, isActive ? styles.active : '']
              .filter(Boolean)
              .join(' ')}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
