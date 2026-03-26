import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import type { Settings } from '../../../entities/settings'
import { clearAllMonitoringData } from '../../../features/clear-monitoring-data'
import {
  setDefaultCheckInterval,
  setNotificationsEnabled,
  setPingUrl,
} from '../../../features/update-settings'
import { CHECK_INTERVAL_OPTIONS } from '../../../shared/constants'
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
        setPingError('Enter a valid host, IP, or HTTP/HTTPS URL')
        input.value = settings.pingUrl
        return
      }

      setPingError(null)
      input.value = nextPingUrl
    } catch {
      setPingError('Unable to save ping URL right now')
      input.value = settings.pingUrl
    } finally {
      setIsBusy(false)
    }
  }

  const handleClearAll = async () => {
    if (isBusy) {
      return
    }

    const confirmed = window.confirm('Clear all monitors and incidents?')

    if (!confirmed) {
      return
    }

    setIsBusy(true)
    setActionError(null)

    try {
      await clearAllMonitoringData()
    } catch {
      setActionError('Unable to clear monitors right now')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        leading={
          <IconButton aria-label="Go back" onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </IconButton>
        }
        title="Settings"
      />

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Notifications</div>
        <div className={styles.row}>
          <span className={styles.label}>Browser notifications</span>
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
                setActionError('Unable to update notifications right now')
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
        <div className={styles.sectionTitle}>Default check interval</div>
        <Toggle
          disabled={isBusy}
          onChange={async (value) => {
            setIsBusy(true)
            setActionError(null)

            try {
              await setDefaultCheckInterval(value as Settings['defaultInterval'])
            } catch {
              setActionError('Unable to update the default interval right now')
            } finally {
              setIsBusy(false)
            }
          }}
          options={CHECK_INTERVAL_OPTIONS}
          value={settings.defaultInterval}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Advanced</div>
        <label className={styles.fieldLabel} htmlFor="ping-url">
          Connectivity target
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
          {pingError ??
            'Uses an HTTP/HTTPS check in Chromium. Change if Google DNS is blocked'}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Danger</div>
        <button
          className={styles.clearButton}
          disabled={isBusy}
          onClick={handleClearAll}
          type="button"
        >
          {isBusy ? 'Working...' : 'Clear all monitors'}
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
