import type React from 'react'

import { TELEGRAM_BOT_USERNAME, TELEGRAM_BOT_URL, TELEGRAM_CHAT_ID_HELPER_URL } from '@shared/constants'
import { t } from '@shared/lib/i18n'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { TelegramIcon } from '@shared/ui/TelegramIcon'
import styles from './Settings.module.css'

interface TelegramSettingsSectionProps {
  chatId: string
  chatIdError: string | null
  isBusy: boolean
  isConfigured: boolean
  isTestBusy: boolean
  sendRecovery: boolean
  statusLabel: string
  statusTone: 'muted' | 'success'
  telegramEnabled: boolean
  onChatIdBlur: (event: React.FocusEvent<HTMLInputElement>) => void
  onChatIdChange: () => void
  onChatIdKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onSendRecoveryToggle: () => void
  onSendTest: () => void
  onTelegramToggle: () => void
}

export function TelegramSettingsSection({
  chatId,
  chatIdError,
  isBusy,
  isConfigured,
  isTestBusy,
  sendRecovery,
  statusLabel,
  statusTone,
  telegramEnabled,
  onChatIdBlur,
  onChatIdChange,
  onChatIdKeyDown,
  onSendRecoveryToggle,
  onSendTest,
  onTelegramToggle,
}: TelegramSettingsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionTitle}>{t('settings_telegram_enabled')}</div>
      <div className={[styles.stack, styles.telegramCard].join(' ')}>
        <div className={[styles.row, styles.telegramHeaderRow].join(' ')}>
          <div className={styles.telegramHeader}>
            <span className={styles.telegramIconBadge}>
              <TelegramIcon />
            </span>
            <div className={styles.telegramHeaderContent}>
              <span className={styles.label}>{t('settings_telegram_enabled')}</span>
              <Badge className={styles.telegramStatusBadge} tone={statusTone}>
                {statusLabel}
              </Badge>
            </div>
          </div>
          <button
            aria-pressed={telegramEnabled}
            className={[
              styles.switch,
              telegramEnabled ? styles.switchOn : styles.switchOff,
            ].join(' ')}
            disabled={isBusy}
            onClick={onTelegramToggle}
            type="button"
          >
            <span className={styles.thumb} />
          </button>
        </div>

        <div className={styles.telegramBody}>
          <div className={styles.telegramSetup}>
            <div className={styles.telegramSetupTitle}>
              {t('settings_telegram_setup_title')}
            </div>
            <div className={styles.telegramSetupSteps}>
              <div className={styles.telegramSetupStep}>{t('settings_telegram_setup_step_1')}</div>
              <div className={styles.telegramSetupStep}>{t('settings_telegram_setup_step_2')}</div>
              <div className={styles.telegramSetupStep}>{t('settings_telegram_setup_step_3')}</div>
            </div>
            <div className={styles.telegramBotUsername}>
              <span>{t('settings_telegram_bot_username_label')}</span>
              <code>@{TELEGRAM_BOT_USERNAME}</code>
            </div>
            <div className={styles.telegramLinks}>
              <a
                className={styles.telegramLink}
                href={TELEGRAM_BOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                {t('settings_telegram_open_bot')}
              </a>
              <a
                className={styles.telegramLinkSecondary}
                href={TELEGRAM_CHAT_ID_HELPER_URL}
                rel="noreferrer"
                target="_blank"
              >
                {t('settings_telegram_open_chat_id_helper')}
              </a>
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel} htmlFor="telegram-chat-id">
              {t('settings_telegram_chat_id')}
            </label>
            <input
              aria-invalid={chatIdError !== null}
              className={styles.input}
              defaultValue={chatId}
              disabled={isBusy}
              id="telegram-chat-id"
              key={chatId}
              onBlur={onChatIdBlur}
              onChange={onChatIdChange}
              onKeyDown={onChatIdKeyDown}
              placeholder="-1001234567890"
              spellCheck={false}
              type="text"
            />
            <div
              className={[
                styles.hint,
                chatIdError ? styles.hintError : '',
              ].join(' ')}
            >
              {chatIdError ?? t('settings_telegram_chat_id_hint')}
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>{t('settings_telegram_send_recovery')}</span>
            <button
              aria-pressed={sendRecovery}
              className={[
                styles.switch,
                sendRecovery ? styles.switchOn : styles.switchOff,
              ].join(' ')}
              disabled={isBusy}
              onClick={onSendRecoveryToggle}
              type="button"
            >
              <span className={styles.thumb} />
            </button>
          </div>

          <div className={styles.buttonRow}>
            <Button
              disabled={!isConfigured}
              fullWidth
              loading={isTestBusy}
              onClick={onSendTest}
              size="sm"
              variant="telegram"
            >
              {t('settings_telegram_test_button')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
