import { ArrowLeft, Ellipsis } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IncidentRow, type Incident } from '../../../entities/incident'
import {
  type Monitor,
  ResponseTime,
} from '../../../entities/monitor'
import { checkNow } from '../../../features/check-monitor'
import { deleteMonitor } from '../../../features/delete-monitor'
import { toggleMonitor } from '../../../features/toggle-monitor'
import { MIN_LOADING_MS } from '@shared/constants'
import { delay } from '@shared/lib/async'
import { t, translateLocalizedMessage } from '@shared/lib/i18n'
import { formatPercent } from '@shared/lib/time'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { Spinner } from '@shared/ui/Spinner'
import { PageHeader } from '@shared/ui/PageHeader'
import { PageLayout } from '@shared/ui/PageLayout'
import { useToast } from '@shared/ui/toast'
import { ResponseChart } from '../../../widgets/response-chart'
import styles from './MonitorDetails.module.css'

interface StatusBadgeProps {
  className?: string
  status: Monitor['status']
}

function StatusBadge({ className, status }: StatusBadgeProps) {
  if (status === 'online') {
    return <Badge className={className} tone="success">{t('monitor_badge_up')}</Badge>
  }

  if (status === 'down') {
    return <Badge className={className} tone="danger">{t('monitor_badge_down')}</Badge>
  }

  if (status === 'paused') {
    return <Badge className={className} tone="muted">{t('monitor_badge_paused')}</Badge>
  }

  return <Badge className={className} tone="muted"><Spinner /></Badge>
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
  const [isBusy, setIsBusy] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCheckingNow, setIsCheckingNow] = useState(false)
  const [monitorStatus, setMonitorStatus] = useState(monitor.status)
  const [statusDelayDone, setStatusDelayDone] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)
  const statusDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { showError } = useToast()

  useEffect(() => {
    setMonitorStatus(monitor.status)
  }, [monitor.status])

  useEffect(() => {
    if (monitor.checkState !== 'running') {
      return
    }

    setStatusDelayDone(false)

    if (statusDelayTimerRef.current) {
      clearTimeout(statusDelayTimerRef.current)
    }

    statusDelayTimerRef.current = setTimeout(() => {
      setStatusDelayDone(true)
      statusDelayTimerRef.current = null
    }, MIN_LOADING_MS)
  }, [monitor.checkState])

  useEffect(() => {
    return () => {
      if (statusDelayTimerRef.current) {
        clearTimeout(statusDelayTimerRef.current)
      }
    }
  }, [])

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

  const isStatusSpinning = monitor.checkState === 'running' || !statusDelayDone
  const isCheckPending = isCheckingNow || (!isBusy && monitor.checkState === 'running')
  const feedbackMessage = translateLocalizedMessage(monitor.lastCheckError)
  const sortedIncidents = [...incidents]
    .filter((incident) => incident.monitorId === monitor.id)
    .sort((left, right) => right.startTime - left.startTime)

  const handleCheckNow = async () => {
    if (isCheckPending) {
      return
    }

    setIsCheckingNow(true)

    try {
      await Promise.all([checkNow(monitor.id), delay(MIN_LOADING_MS)])
    } catch {
      showError(t('monitor_details_error_check_now'))
    } finally {
      setIsCheckingNow(false)
    }
  }

  const handleTogglePause = async () => {
    if (isBusy) {
      return
    }

    const nextStatus = monitorStatus === 'paused' ? 'online' : 'paused'
    const resuming = monitorStatus === 'paused'
    setMonitorStatus(nextStatus)
    setIsBusy(true)
    setIsResuming(resuming)

    try {
      const ops: Promise<unknown>[] = [toggleMonitor(monitor.id)]
      if (resuming) ops.push(delay(MIN_LOADING_MS))
      await Promise.all(ops)
    } catch {
      setMonitorStatus(monitorStatus)
      showError(t('monitor_details_error_toggle'))
    } finally {
      setIsBusy(false)
      setIsResuming(false)
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

    try {
      await deleteMonitor(monitor.id)
      onDeleted()
    } catch {
      showError(t('monitor_details_error_delete'))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <PageLayout
      header={
        <PageHeader
          leading={
            <IconButton aria-label={t('common_go_back_aria')} onClick={onBack}>
              <ArrowLeft size={16} strokeWidth={2} />
            </IconButton>
          }
          title={monitor.name}
          trailing={
            <div className={styles.menuWrap} ref={menuRef}>
              <IconButton
                aria-label={t('monitor_details_more_actions_aria')}
                onClick={() => {
                  if (!isBusy) {
                    setIsMenuOpen((current) => !current)
                  }
                }}
              >
                <Ellipsis size={16} strokeWidth={2} />
              </IconButton>
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
          }
        />
      }
      footer={
        <>
          <div className={styles.actions}>
            <Button className={styles.actionButton} loading={isCheckPending} onClick={handleCheckNow}>
              {t('monitor_details_button_check_now')}
            </Button>
            <Button className={styles.actionButton} loading={isResuming} onClick={handleTogglePause} variant="secondary">
              {monitorStatus === 'paused'
                ? t('monitor_details_button_resume')
                : t('monitor_details_button_pause')}
            </Button>
          </div>
          {feedbackMessage ? (
            <div className={styles.feedback}>{feedbackMessage}</div>
          ) : null}
        </>
      }
    >
      <section className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_status')}</div>
          <div className={styles.cardValue}><StatusBadge className={styles.statusBadge} status={isStatusSpinning ? 'pending' : monitorStatus} /></div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_uptime')}</div>
          <div className={styles.cardValue}>{formatPercent(monitor.uptimePercent)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>{t('monitor_details_stat_avg_response')}</div>
          <div className={styles.cardValue}>
            <ResponseTime responseTime={monitor.responseTime} />
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
    </PageLayout>
  )
}
