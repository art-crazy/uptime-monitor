import { MonitorRow, type Monitor } from '../../../entities/monitor'
import { Button } from '../../../shared/ui/Button'
import styles from './MonitorList.module.css'

export interface MonitorListEntry {
  monitor: Monitor
  subtitle: string
}

interface MonitorListProps {
  items: MonitorListEntry[]
  onAdd: () => void
  onSelect: (monitorId: string) => void
}

export function MonitorList({ items, onAdd, onSelect }: MonitorListProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {items.map((item) => (
          <MonitorRow
            key={item.monitor.id}
            monitor={item.monitor}
            onClick={() => onSelect(item.monitor.id)}
            subtitle={item.subtitle}
          />
        ))}
      </div>
      <Button fullWidth onClick={onAdd} variant="dashed">
        + Add monitor
      </Button>
    </div>
  )
}
