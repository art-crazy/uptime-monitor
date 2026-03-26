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
import { t, translateDynamicKey } from '../../../shared/lib/i18n'
import { formatPercent } from '../../../shared/lib/time'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { IconButton } from '../../../shared/ui/IconButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { ResponseChart } from '../../../widgets/response-chart'
import styles from './MonitorDetails.module.css'

function getStatusBadge(monitor: Monitor) {
  if (monitor.status === 'online') {
    return <Badge tone="success">{t('monitor_badge_up')}</Badge>
  }

  if (monitor.status === 'down') {
    return <Badge tone="danger">{t('monitor_badge_down')}</Badge>
  }

  return (
    <Badge tone="muted">
      {monitor.status === 'paused' ? t('monitor_badge_paused') : t('monitor_badge_checking')}
    </Badge>
  )
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
  const feedbackMessage =
    actionError ??
    (monitor.lastCheckError ? translateDynamicKey(monitor.lastCheckError) : null)
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
      setActionError(t('monitor_details_error_check_now'))
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
      setActionError(t('monitor_details_error_toggle'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async () => {
    if (isBusy) {
      return
    }

    setIsMenuOpen(false)
    const confirmed = window.confirm(t('monitor_details_confirm_delete', monitor.name))

    if (!confirmed) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await deleteMonitor(monitor.id)
      onDeleted()
    } catch {
      setActionError(t('monitor_details_error_delete'))
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
          <IconButton aria-label={t('common_go_back_aria')} onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title={monitor.name}
        trailing={getStatusBadge(monitor)}
      />

      <section className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_uptime')}</div>
          <div className={styles.cardValue}>{formatPercent(monitor.uptimePercent)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_avg_response')}</div>
          <div className={styles.cardValue}>
            <ResponseTime responseTime={avgResponse} />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_incidents')}</div>
          <div className={styles.cardValue}>{sortedIncidents.length}</div>
        </div>
      </section>

      <ResponseChart history={monitor.history} />

      <section className={styles.incidents}>
        <div className={styles.sectionLabel}>{t('monitor_details_section_incidents')}</div>
        {sortedIncidents.length > 0 ? (
          <div className={styles.incidentList}>
            {sortedIncidents.map((incident) => (
              <IncidentRow incident={incident} key={incident.id} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{t('monitor_details_empty_incidents')}</div>
        )}
      </section>

      <div className={styles.actions}>
        <Button disabled={isBusy || isCheckPending} fullWidth onClick={handleCheckNow}>
          {isCheckPending ? t('monitor_details_button_checking') : t('monitor_details_button_check_now')}
        </Button>
        <Button disabled={isBusy} onClick={handleTogglePause} variant="secondary">
          {monitor.status === 'paused'
            ? t('monitor_details_button_resume')
            : t('monitor_details_button_pause')}
        </Button>
        <div className={styles.menuWrap} ref={menuRef}>
          <Button
            aria-label={t('monitor_details_more_actions_aria')}
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
                {t('common_edit')}
              </button>
              <button
                className={[styles.menuItem, styles.menuDanger].join(' ')}
                onClick={handleDelete}
                type="button"
              >
                {t('common_delete')}
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
