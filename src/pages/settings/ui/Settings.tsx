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
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { PageHeader } from '@shared/ui/PageHeader'
import { PageLayout } from '@shared/ui/PageLayout'
import { TelegramIcon } from '@shared/ui/TelegramIcon'
import { Toggle } from '@shared/ui/Toggle'
import styles from './Settings.module.css'

interface SettingsPageProps {
  onBack: () => void
  settings: Settings
}

interface FeedbackState {
  message: string
  type: 'error' | 'success'
}

export function SettingsPage({ onBack, settings }: SettingsPageProps) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isNotificationsBusy, setIsNotificationsBusy] = useState(false)
  const [isTelegramBusy, setIsTelegramBusy] = useState(false)
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

  const clearFeedback = () => {
    setFeedback(null)
  }

  const hasConfiguredTelegramChatId = settings.notifications.telegram.chatId.trim().length > 0
  const isTelegramConfigured = telegramEnabled && hasConfiguredTelegramChatId
  const telegramStatusTone = hasConfiguredTelegramChatId ? 'success' : 'muted'
  const telegramStatusLabel = hasConfiguredTelegramChatId
    ? t('settings_telegram_status_connected')
    : t('settings_telegram_status_not_configured')

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
    clearFeedback()

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
    if (isTelegramBusy) {
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

    setIsTelegramBusy(true)
    clearFeedback()

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
      setIsTelegramBusy(false)
    }
  }

  const handleSendTelegramTest = async () => {
    if (isTelegramBusy || isTelegramTestBusy) {
      return
    }

    if (!isTelegramConfigured) {
      setTelegramChatIdError(t('settings_error_invalid_telegram_chat_id'))
      setFeedback(null)
      return
    }

    setIsTelegramTestBusy(true)
    clearFeedback()

    try {
      await sendTelegramTestMessage()
      setFeedback({
        type: 'success',
        message: t('settings_telegram_test_success'),
      })
    } catch {
      setFeedback({
        type: 'error',
        message: t('settings_error_unable_to_send_telegram_test'),
      })
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
    clearFeedback()

    try {
      await Promise.all([clearAllMonitoringData(), delay(MIN_LOADING_MS)])
    } catch {
      setFeedback({
        type: 'error',
        message: t('settings_error_unable_to_clear'),
      })
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
          {feedback ? (
            <div
              className={[
                styles.feedback,
                feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
              ].join(' ')}
            >
              {feedback.message}
            </div>
          ) : null}
        </>
      }
    >
      <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('settings_section_notifications')}</div>
          <div className={styles.row}>
            <span className={styles.label}>{t('settings_browser_notifications')}</span>
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
                clearFeedback()

                try {
                  await saveNotificationsEnabled(next)
                } catch {
                  setBrowserNotificationsEnabled(!next)
                  setFeedback({
                    type: 'error',
                    message: t('settings_error_unable_to_update_notifications'),
                  })
                } finally {
                  setIsNotificationsBusy(false)
                }
              }}
              type="button"
            >
              <span className={styles.thumb} />
            </button>
          </div>

          <div className={[styles.stack, styles.telegramCard].join(' ')}>
            <div className={[styles.row, styles.telegramHeaderRow].join(' ')}>
              <div className={styles.telegramHeader}>
                <span className={styles.telegramIconBadge}>
                  <TelegramIcon />
                </span>
                <div className={styles.telegramHeaderContent}>
                  <span className={styles.label}>{t('settings_telegram_enabled')}</span>
                  <Badge className={styles.telegramStatusBadge} tone={telegramStatusTone}>
                    {telegramStatusLabel}
                  </Badge>
                </div>
              </div>
              <button
                aria-pressed={telegramEnabled}
                className={[
                  styles.switch,
                  telegramEnabled ? styles.switchOn : styles.switchOff,
                ].join(' ')}
                disabled={isTelegramBusy}
                onClick={async () => {
                  const next = !telegramEnabled
                  setTelegramEnabled(next)
                  setIsTelegramBusy(true)
                  clearFeedback()

                  try {
                    await saveTelegramEnabled(next)
                  } catch {
                    setTelegramEnabled(!next)
                    setFeedback({
                      type: 'error',
                      message: t('settings_error_unable_to_update_telegram'),
                    })
                  } finally {
                    setIsTelegramBusy(false)
                  }
                }}
                type="button"
              >
                <span className={styles.thumb} />
              </button>
            </div>

            <div className={styles.telegramBody}>
              <div>
              <label className={styles.fieldLabel} htmlFor="telegram-chat-id">
                {t('settings_telegram_chat_id')}
              </label>
              <input
                aria-invalid={telegramChatIdError !== null}
                className={styles.input}
                defaultValue={settings.notifications.telegram.chatId}
                disabled={isTelegramBusy}
                id="telegram-chat-id"
                key={settings.notifications.telegram.chatId}
                onChange={() => setTelegramChatIdError(null)}
                onBlur={(event) => {
                  void commitTelegramChatId(event.currentTarget.value, event.currentTarget)
                }}
                onKeyDown={(event) => {
                  handleTextFieldKeyDown(event, settings.notifications.telegram.chatId)
                }}
                placeholder="-1001234567890"
                spellCheck={false}
                type="text"
              />
              <div
                className={[
                  styles.hint,
                  telegramChatIdError ? styles.hintError : '',
                ].join(' ')}
              >
                {telegramChatIdError ?? t('settings_telegram_chat_id_hint')}
              </div>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>{t('settings_telegram_send_recovery')}</span>
                <button
                  aria-pressed={telegramSendRecovery}
                  className={[
                    styles.switch,
                    telegramSendRecovery ? styles.switchOn : styles.switchOff,
                  ].join(' ')}
                  disabled={isTelegramBusy}
                  onClick={async () => {
                    const next = !telegramSendRecovery
                    setTelegramSendRecovery(next)
                    setIsTelegramBusy(true)
                    clearFeedback()

                    try {
                      await setTelegramRecoveryEnabled(next)
                    } catch {
                      setTelegramSendRecovery(!next)
                      setFeedback({
                        type: 'error',
                        message: t('settings_error_unable_to_update_telegram'),
                      })
                    } finally {
                      setIsTelegramBusy(false)
                    }
                  }}
                  type="button"
                >
                  <span className={styles.thumb} />
                </button>
              </div>

              <div className={styles.buttonRow}>
                <Button
                  disabled={!isTelegramConfigured}
                  fullWidth
                  loading={isTelegramTestBusy}
                  onClick={handleSendTelegramTest}
                  size="sm"
                  variant="telegram"
                >
                  {t('settings_telegram_test_button')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('settings_section_default_interval')}</div>
          <Toggle
            onChange={async (value) => {
              const next = value as Settings['defaultInterval']
              setDefaultInterval(next)
              clearFeedback()

              try {
                await setDefaultCheckInterval(next)
              } catch {
                setDefaultInterval(settings.defaultInterval)
                setFeedback({
                  type: 'error',
                  message: t('settings_error_unable_to_update_interval'),
                })
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
    </PageLayout>
  )
}
