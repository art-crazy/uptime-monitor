import { CircleHelp } from 'lucide-react'

import styles from './HintTooltip.module.css'

interface HintTooltipProps {
  text: string
}

export function HintTooltip({ text }: HintTooltipProps) {
  return (
    <button aria-label={text} className={styles.wrapper} type="button">
      <CircleHelp aria-hidden className={styles.icon} size={13} />
      <span className={styles.tooltip}>{text}</span>
    </button>
  )
}
