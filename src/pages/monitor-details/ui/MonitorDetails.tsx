import { ArrowLeft, Ellipsis } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IncidentRow, type Incident } from '../../../entities/incident'
import {
  calculateAverageResponseTime,
  type Monitor,
  ResponseTime,
} from '../../../entities/monitor'
import { checkNow } from '../../../features/check-monitor'
import { deleteMonitor } from '../../../features/delete-monitor'
import { toggleMonitor } from '../../../features/toggle-monitor'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { IconButton } from '../../../shared/ui/IconButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { ResponseChart } from '../../../widgets/response-chart'
import styles from './MonitorDetails.module.css'

function getStatusBadge(monitor: Monitor) {
  if (monitor.status === 'online') {
    return <Badge tone="success">UP</Badge>
  }

  if (monitor.status === 'down') {
    return <Badge tone="danger">DOWN</Badge>
  }

  return <Badge tone="muted">{monitor.status.toUpperCase()}</Badge>
}

interface MonitorDetailsPageProps {
  incidents: Incident[]
  monitor: Monitor
  onBack: () => void
  onDeleted: () => void
  onEdit: () => void
}

export function MonitorDetailsPage({
  incidents,
  monitor,
  onBack,
  onDeleted,
  onEdit,
}: MonitorDetailsPageProps) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const avgResponse = calculateAverageResponseTime(monitor.history)
  const isCheckPending = monitor.checkState === 'running'
  const feedbackMessage = actionError ?? monitor.lastCheckError
  const sortedIncidents = [...incidents]
    .filter((incident) => incident.monitorId === monitor.id)
    .sort((left, right) => right.startTime - left.startTime)

  const handleCheckNow = async () => {
    if (isBusy || isCheckPending) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await checkNow(monitor.id)
    } catch {
      setActionError('Unable to run a manual check right now')
    } finally {
      setIsBusy(false)
    }
  }

  const handleTogglePause = async () => {
    if (isBusy) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await toggleMonitor(monitor.id)
    } catch {
      setActionError('Unable to update this monitor right now')
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async () => {
    if (isBusy) {
      return
    }

    setIsMenuOpen(false)
    const confirmed = window.confirm(`Delete monitor "${monitor.name}"?`)

    if (!confirmed) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await deleteMonitor(monitor.id)
      onDeleted()
    } catch {
      setActionError('Unable to delete this monitor right now')
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (isBusy) {
      setIsMenuOpen(false)
    }
  }, [isBusy])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  return (
    <div className={styles.page}>
      <PageHeader
        leading={
          <IconButton aria-label="Go back" onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title={monitor.name}
        trailing={getStatusBadge(monitor)}
      />

      <section className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Uptime</div>
          <div className={styles.cardValue}>{monitor.uptimePercent.toFixed(1)}%</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Avg resp</div>
          <div className={styles.cardValue}>
            <ResponseTime responseTime={avgResponse} />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Incidents</div>
          <div className={styles.cardValue}>{sortedIncidents.length}</div>
        </div>
      </section>

      <ResponseChart history={monitor.history} />

      <section className={styles.incidents}>
        <div className={styles.sectionLabel}>Incidents</div>
        {sortedIncidents.length > 0 ? (
          <div className={styles.incidentList}>
            {sortedIncidents.map((incident) => (
              <IncidentRow incident={incident} key={incident.id} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No incidents recorded yet</div>
        )}
      </section>

      <div className={styles.actions}>
        <Button disabled={isBusy || isCheckPending} fullWidth onClick={handleCheckNow}>
          {isCheckPending ? 'Checking...' : 'Check now'}
        </Button>
        <Button disabled={isBusy} onClick={handleTogglePause} variant="secondary">
          {monitor.status === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <div className={styles.menuWrap} ref={menuRef}>
          <Button
            aria-label="More actions"
            disabled={isBusy}
            onClick={() => {
              if (!isBusy) {
                setIsMenuOpen((current) => !current)
              }
            }}
            variant="secondary"
          >
            <Ellipsis size={14} strokeWidth={2} />
          </Button>
          {isMenuOpen ? (
            <div className={styles.menu}>
              <button
                className={styles.menuItem}
                onClick={() => {
                  setIsMenuOpen(false)
                  onEdit()
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className={[styles.menuItem, styles.menuDanger].join(' ')}
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {feedbackMessage ? (
        <div className={[styles.feedback, styles.feedbackError].join(' ')}>
          {feedbackMessage}
        </div>
      ) : null}
    </div>
  )
}
