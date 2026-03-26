import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Settings } from '../../../entities/settings'
import { clearAllMonitoringData } from '../../../features/clear-monitoring-data'
import {
  setDefaultCheckInterval,
  setNotificationsEnabled,
  setPingUrl,
} from '../../../features/update-settings'
import { CHECK_INTERVAL_OPTIONS } from '../../../shared/constants'
import { t } from '../../../shared/lib/i18n'
import { formatCheckInterval } from '../../../shared/lib/time'
import { IconButton } from '../../../shared/ui/IconButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Toggle } from '../../../shared/ui/Toggle'
import styles from './Settings.module.css'

interface SettingsPageProps {
  onBack: () => void
  settings: Settings
}

export function SettingsPage({ onBack, settings }: SettingsPageProps) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [pingError, setPingError] = useState<string | null>(null)
  const intervalOptions = useMemo(
    () =>
      CHECK_INTERVAL_OPTIONS.map((option) => ({
        label: formatCheckInterval(option.value),
        value: option.value,
      })),
    [],
  )

  const commitPingUrl = async (value: string, input: HTMLInputElement) => {
    if (isBusy) {
      return
    }

    const nextPingUrl = value.trim()

    if (!nextPingUrl || nextPingUrl === settings.pingUrl) {
      setPingError(null)
      input.value = settings.pingUrl
      return
    }

    setIsBusy(true)
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
      setIsBusy(false)
    }
  }

  const handleClearAll = async () => {
    if (isBusy) {
      return
    }

    const confirmed = window.confirm(t('settings_confirm_clear_all'))

    if (!confirmed) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await clearAllMonitoringData()
    } catch {
      setActionError(t('settings_error_unable_to_clear'))
    } finally {
      setIsBusy(false)
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

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('settings_section_notifications')}</div>
        <div className={styles.row}>
          <span className={styles.label}>{t('settings_browser_notifications')}</span>
          <button
            aria-pressed={settings.notificationsEnabled}
            className={[
              styles.switch,
              settings.notificationsEnabled ? styles.switchOn : styles.switchOff,
            ].join(' ')}
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true)
              setActionError(null)

              try {
                await setNotificationsEnabled(!settings.notificationsEnabled)
              } catch {
                setActionError(t('settings_error_unable_to_update_notifications'))
              } finally {
                setIsBusy(false)
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
          disabled={isBusy}
          onChange={async (value) => {
            setIsBusy(true)
            setActionError(null)

            try {
              await setDefaultCheckInterval(value as Settings['defaultInterval'])
            } catch {
              setActionError(t('settings_error_unable_to_update_interval'))
            } finally {
              setIsBusy(false)
            }
          }}
          options={intervalOptions}
          value={settings.defaultInterval}
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
          disabled={isBusy}
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

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('settings_section_danger')}</div>
        <button
          className={styles.clearButton}
          disabled={isBusy}
          onClick={handleClearAll}
          type="button"
        >
          {isBusy ? t('settings_button_working') : t('settings_button_clear_all')}
        </button>
      </section>

      {actionError ? (
        <div className={[styles.feedback, styles.feedbackError].join(' ')}>
          {actionError}
        </div>
      ) : null}
    </div>
  )
}
