import { startTransition, useEffect, useMemo, useState } from 'react'

import { useIncidents } from '../entities/incident'
import { useInternetStatus } from '../entities/internet'
import { useMonitors } from '../entities/monitor'
import { useSettings } from '../entities/settings'
import { AddMonitorPage } from '../pages/add-monitor'
import { DashboardPage } from '../pages/dashboard'
import { MonitorDetailsPage } from '../pages/monitor-details'
import { SettingsPage } from '../pages/settings'
import { t } from '../shared/lib/i18n'
import { PageHeader } from '../shared/ui/PageHeader'
import styles from './App.module.css'

type Screen =
  | { key: 'dashboard' }
  | { key: 'settings' }
  | { key: 'details'; monitorId: string }
  | { key: 'add'; monitorId?: string }

export function App() {
  const [screen, setScreen] = useState<Screen>({ key: 'dashboard' })
  const { incidents, isLoaded: areIncidentsLoaded } = useIncidents()
  const { internetStatus, isLoaded: isInternetStatusLoaded } = useInternetStatus()
  const { isLoaded: areMonitorsLoaded, monitors } = useMonitors()
  const { isLoaded: areSettingsLoaded, settings } = useSettings()
  const isHydrated =
    areIncidentsLoaded &&
    isInternetStatusLoaded &&
    areMonitorsLoaded &&
    areSettingsLoaded

  const selectedMonitor = useMemo(() => {
    if (screen.key !== 'details' && screen.key !== 'add') {
      return null
    }

    if (!screen.monitorId) {
      return null
    }

    return monitors.find((monitor) => monitor.id === screen.monitorId) ?? null
  }, [screen, monitors])

  const navigate = (nextScreen: Screen) => {
    startTransition(() => {
      setScreen(nextScreen)
    })
  }

  const normalizedScreen =
    (screen.key === 'details' || screen.key === 'add') &&
    screen.monitorId &&
    selectedMonitor === null
      ? { key: 'dashboard' as const }
      : screen

  useEffect(() => {
    document.title = t('ext_name')
  }, [])

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <PageHeader title={t('ext_name')} />
        <div className={styles.loadingState}>
          <div className={styles.loadingTitle}>{t('app_loading_title')}</div>
          <div className={styles.loadingSubtitle}>{t('app_loading_subtitle')}</div>
        </div>
      </div>
    )
  }

  if (normalizedScreen.key === 'add') {
    return (
      <AddMonitorPage
        key={selectedMonitor?.id ?? 'new-monitor'}
        defaultInterval={settings.defaultInterval}
        monitor={
          selectedMonitor
            ? {
                id: selectedMonitor.id,
                interval: selectedMonitor.interval,
                type: selectedMonitor.type,
                url: selectedMonitor.url,
              }
            : undefined
        }
        onBack={() =>
          navigate(
            normalizedScreen.monitorId
              ? { key: 'details', monitorId: normalizedScreen.monitorId }
              : { key: 'dashboard' },
          )
        }
        onSaved={(monitorId) =>
          navigate(
            normalizedScreen.monitorId
              ? { key: 'details', monitorId }
              : { key: 'dashboard' },
          )
        }
      />
    )
  }

  if (normalizedScreen.key === 'details' && selectedMonitor) {
    return (
      <MonitorDetailsPage
        key={selectedMonitor.id}
        incidents={incidents}
        monitor={selectedMonitor}
        onBack={() => navigate({ key: 'dashboard' })}
        onDeleted={() => navigate({ key: 'dashboard' })}
        onEdit={() => navigate({ key: 'add', monitorId: selectedMonitor.id })}
      />
    )
  }

  if (normalizedScreen.key === 'settings') {
    return (
      <SettingsPage onBack={() => navigate({ key: 'dashboard' })} settings={settings} />
    )
  }

  return (
    <DashboardPage
      incidents={incidents}
      internetStatus={internetStatus}
      monitors={monitors}
      onAddMonitor={() => navigate({ key: 'add' })}
      onOpenMonitor={(monitorId) => navigate({ key: 'details', monitorId })}
      onOpenSettings={() => navigate({ key: 'settings' })}
    />
  )
}
