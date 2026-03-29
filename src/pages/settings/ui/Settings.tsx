import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Settings } from '../../../entities/settings'
import { clearAllMonitoringData } from '../../../features/clear-monitoring-data'
import {
  sendTelegramTestMessage,
  setDefaultCheckInterval,
  setNotificationsEnabled as saveNotificationsEnabled,
  setPingUrl,
  setTelegramChatId,
  setTelegramEnabled as saveTelegramEnabled,
  setTelegramRecoveryEnabled,
} from '../../../features/update-settings'
import { CHECK_INTERVAL_OPTIONS, MIN_LOADING_MS } from '@shared/constants'
import { delay } from '@shared/lib/async'
import { t } from '@shared/lib/i18n'
import { formatCheckInterval } from '@shared/lib/time'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { PageHeader } from '@shared/ui/PageHeader'
import { PageLayout } from '@shared/ui/PageLayout'
import { HintTooltip } from '@shared/ui/HintTooltip'
import { Toggle } from '@shared/ui/Toggle'
import { useToast } from '@shared/ui/toast'
import styles from './Settings.module.css'
import { TelegramSettingsSection } from './TelegramSettingsSection'

interface SettingsPageProps {
  onBack: () => void
  settings: Settings
}

export function SettingsPage({ onBack, settings }: SettingsPageProps) {
  const [isNotificationsBusy, setIsNotificationsBusy] = useState(false)
  const [isTelegramChatIdBusy, setIsTelegramChatIdBusy] = useState(false)
  const [isTelegramToggleBusy, setIsTelegramToggleBusy] = useState(false)
  const [isTelegramRecoveryBusy, setIsTelegramRecoveryBusy] = useState(false)
  const [isTelegramTestBusy, setIsTelegramTestBusy] = useState(false)
  const [isClearBusy, setIsClearBusy] = useState(false)
  const [isPingBusy, setIsPingBusy] = useState(false)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    settings.notifications.browser.enabled,
  )
  const [telegramEnabled, setTelegramEnabled] = useState(
    settings.notifications.telegram.enabled,
  )
  const [telegramSendRecovery, setTelegramSendRecovery] = useState(
    settings.notifications.telegram.sendRecovery,
  )
  const [defaultInterval, setDefaultInterval] = useState(settings.defaultInterval)
  const [pingError, setPingError] = useState<string | null>(null)
  const [telegramChatIdError, setTelegramChatIdError] = useState<string | null>(null)
  const { showError, showSuccess } = useToast()
  const intervalOptions = useMemo(
    () =>
      CHECK_INTERVAL_OPTIONS.map((option) => ({
        label: formatCheckInterval(option.value),
        value: option.value,
      })),
    [],
  )

  useEffect(() => {
    setBrowserNotificationsEnabled(settings.notifications.browser.enabled)
  }, [settings.notifications.browser.enabled])

  useEffect(() => {
    setTelegramEnabled(settings.notifications.telegram.enabled)
  }, [settings.notifications.telegram.enabled])

  useEffect(() => {
    setTelegramSendRecovery(settings.notifications.telegram.sendRecovery)
  }, [settings.notifications.telegram.sendRecovery])

  useEffect(() => {
    setDefaultInterval(settings.defaultInterval)
  }, [settings.defaultInterval])

  const hasConfiguredTelegramChatId = settings.notifications.telegram.chatId.trim().length > 0
  const isTelegramConfigured = telegramEnabled && hasConfiguredTelegramChatId

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

  const handleTextFieldKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    fallbackValue: string,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.currentTarget.value = fallbackValue
      event.currentTarget.blur()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const commitTelegramChatId = async (value: string, input: HTMLInputElement) => {
    if (isTelegramChatIdBusy) {
      return
    }

    const currentChatId = settings.notifications.telegram.chatId
    const nextChatId = value.trim()

    if (!nextChatId) {
      setTelegramChatIdError(
        currentChatId ? t('settings_error_invalid_telegram_chat_id') : null,
      )
      input.value = currentChatId
      return
    }

    if (nextChatId === currentChatId) {
      setTelegramChatIdError(null)
      input.value = currentChatId
      return
    }

    setIsTelegramChatIdBusy(true)

    try {
      const result = await setTelegramChatId(nextChatId)

      if (result === 'invalid') {
        setTelegramChatIdError(t('settings_error_invalid_telegram_chat_id'))
        input.value = currentChatId
        return
      }

      setTelegramChatIdError(null)
      input.value = nextChatId
    } catch {
      setTelegramChatIdError(t('settings_error_unable_to_update_telegram'))
      input.value = currentChatId
    } finally {
      setIsTelegramChatIdBusy(false)
    }
  }

  const handleSendTelegramTest = async () => {
    if (isTelegramChatIdBusy || isTelegramToggleBusy || isTelegramRecoveryBusy || isTelegramTestBusy) {
      return
    }

    if (!isTelegramConfigured) {
      setTelegramChatIdError(t('settings_error_invalid_telegram_chat_id'))
      return
    }

    setIsTelegramTestBusy(true)

    try {
      await sendTelegramTestMessage()
      showSuccess(t('settings_telegram_test_success'))
    } catch {
      showError(t('settings_error_unable_to_send_telegram_test'))
    } finally {
      setIsTelegramTestBusy(false)
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

    try {
      await Promise.all([clearAllMonitoringData(), delay(MIN_LOADING_MS)])
    } catch {
      showError(t('settings_error_unable_to_clear'))
    } finally {
      setIsClearBusy(false)
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
          title={t('settings_title')}
        />
      }
      footer={
        <>
          <Button
            fullWidth
            loading={isClearBusy}
            onClick={handleClearAll}
            variant="danger"
          >
            {t('settings_button_clear_all')}
          </Button>
        </>
      }
    >
      <section className={styles.section}>
          <div className={styles.row}>
            <span className={styles.labelWithHint}>
              {t('settings_browser_notifications')}
              <HintTooltip text={t('settings_browser_notifications_hint')} />
            </span>
            <button
              aria-pressed={browserNotificationsEnabled}
              className={[
                styles.switch,
                browserNotificationsEnabled ? styles.switchOn : styles.switchOff,
              ].join(' ')}
              disabled={isNotificationsBusy}
              onClick={async () => {
                const next = !browserNotificationsEnabled
                setBrowserNotificationsEnabled(next)
                setIsNotificationsBusy(true)

                try {
                  await saveNotificationsEnabled(next)
                } catch {
                  setBrowserNotificationsEnabled(!next)
                  showError(t('settings_error_unable_to_update_notifications'))
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

              try {
                await setDefaultCheckInterval(next)
              } catch {
                setDefaultInterval(settings.defaultInterval)
                showError(t('settings_error_unable_to_update_interval'))
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
              handleTextFieldKeyDown(event, settings.pingUrl)
            }}
            placeholder="8.8.8.8"
            spellCheck={false}
            type="text"
          />
          <div className={styles.hint}>
            {pingError ?? t('settings_connectivity_hint')}
          </div>
        </section>

        <TelegramSettingsSection
          chatId={settings.notifications.telegram.chatId}
          chatIdError={telegramChatIdError}
          isChatIdBusy={isTelegramChatIdBusy}
          isRecoveryBusy={isTelegramRecoveryBusy}
          isTelegramToggleBusy={isTelegramToggleBusy}
          isTestBusy={isTelegramTestBusy}
          onChatIdBlur={(event) => {
            void commitTelegramChatId(event.currentTarget.value, event.currentTarget)
          }}
          onChatIdChange={() => setTelegramChatIdError(null)}
          onChatIdKeyDown={(event) => {
            handleTextFieldKeyDown(event, settings.notifications.telegram.chatId)
          }}
          onSendRecoveryToggle={async () => {
            const next = !telegramSendRecovery
            setTelegramSendRecovery(next)
            setIsTelegramRecoveryBusy(true)

            try {
              await setTelegramRecoveryEnabled(next)
            } catch {
              setTelegramSendRecovery(!next)
              showError(t('settings_error_unable_to_update_telegram'))
            } finally {
              setIsTelegramRecoveryBusy(false)
            }
          }}
          onSendTest={handleSendTelegramTest}
          onTelegramToggle={async () => {
            const next = !telegramEnabled
            setTelegramEnabled(next)
            setIsTelegramToggleBusy(true)

            try {
              await saveTelegramEnabled(next)
            } catch {
              setTelegramEnabled(!next)
              showError(t('settings_error_unable_to_update_telegram'))
            } finally {
              setIsTelegramToggleBusy(false)
            }
          }}
          sendRecovery={telegramSendRecovery}
          telegramEnabled={telegramEnabled}
        />
    </PageLayout>
  )
}
