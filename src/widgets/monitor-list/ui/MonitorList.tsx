import { MonitorRow, type Monitor } from '../../../entities/monitor'
import styles from './MonitorList.module.css'

export interface MonitorListEntry {
  monitor: Monitor
  subtitle: string
}

interface MonitorListProps {
  items: MonitorListEntry[]
  onSelect: (monitorId: string) => void
}

export function MonitorList({ items, onSelect }: MonitorListProps) {
  return (
    <div className={styles.wrapper}>
      {items.map((item) => (
        <MonitorRow
          key={item.monitor.id}
          monitor={item.monitor}
          onClick={() => onSelect(item.monitor.id)}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  )
}
