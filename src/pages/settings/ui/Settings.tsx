import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Settings } from '../../../entities/settings'
import { clearAllMonitoringData } from '../../../features/clear-monitoring-data'
import {
  setDefaultCheckInterval,
  setNotificationsEnabled as saveNotificationsEnabled,
  setPingUrl,
} from '../../../features/update-settings'
import { CHECK_INTERVAL_OPTIONS, MIN_LOADING_MS } from '@shared/constants'
import { delay } from '@shared/lib/async'
import { t } from '@shared/lib/i18n'
import { formatCheckInterval } from '@shared/lib/time'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { PageHeader } from '@shared/ui/PageHeader'
import { Toggle } from '@shared/ui/Toggle'
import styles from './Settings.module.css'

interface SettingsPageProps {
  onBack: () => void
  settings: Settings
}

export function SettingsPage({ onBack, settings }: SettingsPageProps) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isNotificationsBusy, setIsNotificationsBusy] = useState(false)
  const [isClearBusy, setIsClearBusy] = useState(false)
  const [isPingBusy, setIsPingBusy] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled)
  const [defaultInterval, setDefaultInterval] = useState(settings.defaultInterval)
  const [pingError, setPingError] = useState<string | null>(null)
  const intervalOptions = useMemo(
    () =>
      CHECK_INTERVAL_OPTIONS.map((option) => ({
        label: formatCheckInterval(option.value),
        value: option.value,
      })),
    [],
  )

  useEffect(() => {
    setNotificationsEnabled(settings.notificationsEnabled)
  }, [settings.notificationsEnabled])

  useEffect(() => {
    setDefaultInterval(settings.defaultInterval)
  }, [settings.defaultInterval])

  const commitPingUrl = async (value: string, input: HTMLInputElement) => {
    if (isPingBusy) {
      return
    }

    const nextPingUrl = value.trim()

    if (!nextPingUrl || nextPingUrl === settings.pingUrl) {
      setPingError(null)
      input.value = settings.pingUrl
      return
    }

    setIsPingBusy(true)
    setActionError(null)

    try {
      const result = await setPingUrl(nextPingUrl)

      if (result === 'invalid') {
        setPingError(t('settings_error_invalid_ping_target'))
        input.value = settings.pingUrl
        return
      }

      setPingError(null)
      input.value = nextPingUrl
    } catch {
      setPingError(t('settings_error_unable_to_save_ping_target'))
      input.value = settings.pingUrl
    } finally {
      setIsPingBusy(false)
    }
  }

  const handleClearAll = async () => {
    if (isClearBusy) {
      return
    }

    const confirmed = window.confirm(t('settings_confirm_clear_all'))

    if (!confirmed) {
      return
    }

    setIsClearBusy(true)
    setActionError(null)

    try {
      await Promise.all([clearAllMonitoringData(), delay(MIN_LOADING_MS)])
    } catch {
      setActionError(t('settings_error_unable_to_clear'))
    } finally {
      setIsClearBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        leading={
          <IconButton aria-label={t('common_go_back_aria')} onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title={t('settings_title')}
      />

      <div className={styles.body}>
        <section className={styles.section}>
          <div className={styles.row}>
            <span className={styles.label}>{t('settings_browser_notifications')}</span>
            <button
              aria-pressed={notificationsEnabled}
              className={[
                styles.switch,
                notificationsEnabled ? styles.switchOn : styles.switchOff,
              ].join(' ')}
              disabled={isNotificationsBusy}
              onClick={async () => {
                const next = !notificationsEnabled
                setNotificationsEnabled(next)
                setIsNotificationsBusy(true)
                setActionError(null)

                try {
                  await saveNotificationsEnabled(next)
                } catch {
                  setNotificationsEnabled(!next)
                  setActionError(t('settings_error_unable_to_update_notifications'))
                } finally {
                  setIsNotificationsBusy(false)
                }
              }}
              type="button"
            >
              <span className={styles.thumb} />
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('settings_section_default_interval')}</div>
          <Toggle
            onChange={async (value) => {
              const next = value as Settings['defaultInterval']
              setDefaultInterval(next)
              setActionError(null)

              try {
                await setDefaultCheckInterval(next)
              } catch {
                setDefaultInterval(settings.defaultInterval)
                setActionError(t('settings_error_unable_to_update_interval'))
              }
            }}
            options={intervalOptions}
            value={defaultInterval}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('settings_section_advanced')}</div>
          <label className={styles.fieldLabel} htmlFor="ping-url">
            {t('settings_connectivity_target')}
          </label>
          <input
            aria-invalid={pingError !== null}
            className={styles.input}
            defaultValue={settings.pingUrl}
            disabled={isPingBusy}
            id="ping-url"
            key={settings.pingUrl}
            onChange={() => setPingError(null)}
            onBlur={(event) => {
              void commitPingUrl(event.currentTarget.value, event.currentTarget)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.currentTarget.value = settings.pingUrl
                event.currentTarget.blur()
                return
              }

              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
            placeholder="8.8.8.8"
            spellCheck={false}
            type="text"
          />
          <div className={styles.hint}>
            {pingError ?? t('settings_connectivity_hint')}
          </div>
        </section>

      </div>

      <section className={[styles.section, styles.sectionDanger].join(' ')}>
        <Button
          fullWidth
          loading={isClearBusy}
          onClick={handleClearAll}
          variant="danger"
        >
          {t('settings_button_clear_all')}
        </Button>
      </section>

      {actionError ? (
        <div className={[styles.feedback, styles.feedbackError].join(' ')}>
          {actionError}
        </div>
      ) : null}
    </div>
  )
}
