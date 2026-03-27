import { useMemo, useState } from 'react'

import { type CheckInterval } from '../../../entities/monitor'
import { CHECK_INTERVAL_OPTIONS, MIN_LOADING_MS } from '@shared/constants'
import { delay } from '@shared/lib/async'
import { t } from '@shared/lib/i18n'
import { saveMonitorDraft } from '@shared/lib/runtime'
import { formatCheckInterval } from '@shared/lib/time'
import { Button } from '@shared/ui/Button'
import { Toggle } from '@shared/ui/Toggle'
import styles from './AddMonitorForm.module.css'
import { getInitialMonitorFormState } from '../model/defaults'
import type { MonitorFormDraft } from '../model/types'
import { validateMonitorInput } from '../model/validation'

interface AddMonitorFormProps {
  defaultInterval: CheckInterval
  monitor?: MonitorFormDraft
  onSaved: (monitorId: string) => void
}

export function AddMonitorForm({
  defaultInterval,
  monitor,
  onSaved,
}: AddMonitorFormProps) {
  const initialState = useMemo(
    () => getInitialMonitorFormState(defaultInterval, monitor),
    [defaultInterval, monitor],
  )
  const [type, setType] = useState(initialState.type)
  const [url, setUrl] = useState(initialState.url)
  const [interval, setInterval] = useState(initialState.interval)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const typeOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_type_website'), value: 'website' },
        { label: t('add_monitor_type_api'), value: 'api' },
        { label: t('add_monitor_type_host'), value: 'host' },
      ] as const,
    [],
  )
  const intervalOptions = useMemo(
    () =>
      CHECK_INTERVAL_OPTIONS.map((option) => ({
        label: formatCheckInterval(option.value),
        value: option.value,
      })),
    [],
  )
  const isUrlEmpty = url.trim().length === 0
  const fieldLabel =
    type === 'host' ? t('add_monitor_field_host') : t('add_monitor_field_url')
  const placeholder =
    type === 'host'
      ? t('add_monitor_placeholder_host')
      : t('add_monitor_placeholder_url')
  const hint =
    type === 'host'
      ? t('add_monitor_hint_host')
      : t('add_monitor_hint_url')

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    const result = validateMonitorInput(url, type)

    if (!result.normalized) {
      setError(result.errorKey ? t(result.errorKey) : t('add_monitor_error_unable_to_save'))
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const normalizedUrl = result.normalized

      const [response] = await Promise.all([
        saveMonitorDraft({ id: monitor?.id, interval, type, url: normalizedUrl }),
        delay(MIN_LOADING_MS),
      ])

      onSaved(response.monitorId)
    } catch (saveError) {
      console.error('[popup] saveMonitorDraft', saveError)
      setError(t('add_monitor_error_unable_to_save'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <div className={styles.label}>{t('add_monitor_field_type')}</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            setError(null)
            setType(value)
          }}
          options={typeOptions}
          value={type}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="monitor-url">
          {fieldLabel}
        </label>
        <input
          aria-invalid={error !== null}
          autoFocus
          className={[styles.input, error ? styles.inputError : '']
            .filter(Boolean)
            .join(' ')}
          disabled={isSaving}
          id="monitor-url"
          onChange={(event) => {
            setError(null)
            setUrl(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSave()
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          type="text"
          value={url}
        />
        <div className={styles.hint}>{error ?? hint}</div>
      </div>

      <div className={styles.field}>
        <div className={styles.label}>{t('add_monitor_field_interval')}</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            setError(null)
            setInterval(value as CheckInterval)
          }}
          options={intervalOptions}
          value={interval}
        />
      </div>

      <Button
        className={styles.saveButton}
        disabled={isUrlEmpty}
        fullWidth
        loading={isSaving}
        onClick={handleSave}
        type="button"
        variant="primary"
      >
        {monitor ? t('add_monitor_button_save_changes') : t('add_monitor_button_save')}
      </Button>
    </div>
  )
}
