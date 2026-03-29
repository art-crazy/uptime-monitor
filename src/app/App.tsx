import { startTransition, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useIncidents } from '../entities/incident'
import { useInternetStatus } from '../entities/internet'
import { useMonitors } from '../entities/monitor'
import { useSettings } from '../entities/settings'
import { AddMonitorPage } from '../pages/add-monitor'
import { DashboardPage } from '../pages/dashboard'
import { MonitorDetailsPage } from '../pages/monitor-details'
import { SettingsPage } from '../pages/settings'
import { t } from '@shared/lib/i18n'
import { PageHeader } from '@shared/ui/PageHeader'
import { ToastProvider } from '@shared/ui/toast'
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

  const normalizedScreen = useMemo(
    () =>
      (screen.key === 'details' || screen.key === 'add') &&
      screen.monitorId &&
      selectedMonitor === null
        ? { key: 'dashboard' as const }
        : screen,
    [screen, selectedMonitor],
  )

  const screenTitle = useMemo(() => {
    if (normalizedScreen.key === 'dashboard') {
      return t('dashboard_title')
    }

    if (normalizedScreen.key === 'settings') {
      return t('settings_title')
    }

    if (normalizedScreen.key === 'add') {
      return normalizedScreen.monitorId ? t('add_monitor_edit_title') : t('add_monitor_title')
    }

    return selectedMonitor?.name ?? t('dashboard_title')
  }, [normalizedScreen, selectedMonitor])

  useEffect(() => {
    document.title = screenTitle
  }, [screenTitle])

  const renderScreen = (content: ReactNode) => (
    <div className={styles.page}>
      <div className={styles.screen}>
        {content}
      </div>
    </div>
  )

  let content: ReactNode

  if (!isHydrated) {
    content = (
      <div className={styles.page}>
        <PageHeader title={screenTitle} />
        <div className={styles.loadingState}>
          <div className={styles.loadingTitle}>{t('app_loading_title')}</div>
          <div className={styles.loadingSubtitle}>{t('app_loading_subtitle')}</div>
        </div>
      </div>
    )
  } else if (normalizedScreen.key === 'add') {
    content = renderScreen(
      <AddMonitorPage
        key={selectedMonitor?.id ?? 'new-monitor'}
        defaultInterval={settings.defaultInterval}
        monitor={
          selectedMonitor
            ? {
                apiConfig: selectedMonitor.apiConfig,
                id: selectedMonitor.id,
                interval: selectedMonitor.interval,
                name: selectedMonitor.name,
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
      />,
    )
  } else if (normalizedScreen.key === 'details' && selectedMonitor) {
    content = renderScreen(
      <MonitorDetailsPage
        key={selectedMonitor.id}
        incidents={incidents}
        monitor={selectedMonitor}
        onBack={() => navigate({ key: 'dashboard' })}
        onDeleted={() => navigate({ key: 'dashboard' })}
        onEdit={() => navigate({ key: 'add', monitorId: selectedMonitor.id })}
      />,
    )
  } else if (normalizedScreen.key === 'settings') {
    content = renderScreen(
      <SettingsPage onBack={() => navigate({ key: 'dashboard' })} settings={settings} />,
    )
  } else {
    content = renderScreen(
      <DashboardPage
        incidents={incidents}
        internetStatus={internetStatus}
        monitors={monitors}
        onAddMonitor={() => navigate({ key: 'add' })}
        onOpenMonitor={(monitorId) => navigate({ key: 'details', monitorId })}
        onOpenSettings={() => navigate({ key: 'settings' })}
      />,
    )
  }

  return (
    <ToastProvider>
      {content}
    </ToastProvider>
  )
}
