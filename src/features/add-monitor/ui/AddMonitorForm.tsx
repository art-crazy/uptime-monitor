import { useMemo, useState } from 'react'

import { type CheckInterval } from '../../../entities/monitor'
import { CHECK_INTERVAL_OPTIONS } from '../../../shared/constants'
import { saveMonitorDraft } from '../../../shared/lib/runtime'
import { Button } from '../../../shared/ui/Button'
import { Toggle } from '../../../shared/ui/Toggle'
import styles from './AddMonitorForm.module.css'
import { getInitialMonitorFormState } from '../model/defaults'
import type { MonitorFormDraft } from '../model/types'
import { validateMonitorInput } from '../model/validation'

const TYPE_OPTIONS = [
  { label: 'Website', value: 'website' },
  { label: 'API', value: 'api' },
  { label: 'Host / IP', value: 'host' },
] as const

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
  const isUrlEmpty = url.trim().length === 0
  const fieldLabel = type === 'host' ? 'Host' : 'URL'
  const placeholder =
    type === 'host' ? 'example.com or 192.168.0.10' : 'https://example.com'
  const hint =
    type === 'host'
      ? 'Checks HTTP/HTTPS availability for this host'
      : 'Name will be set automatically from domain'

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    const result = validateMonitorInput(url, type)

    if (!result.normalized) {
      setError(result.error)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const normalizedUrl = result.normalized

      const response = await saveMonitorDraft({
        id: monitor?.id,
        interval,
        type,
        url: normalizedUrl,
      })

      onSaved(response.monitorId)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save monitor',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <div className={styles.label}>Type</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            setError(null)
            setType(value)
          }}
          options={TYPE_OPTIONS}
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
        <div className={styles.label}>Check every</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            setError(null)
            setInterval(value as CheckInterval)
          }}
          options={CHECK_INTERVAL_OPTIONS}
          value={interval}
        />
      </div>

      <Button
        disabled={isSaving || isUrlEmpty}
        fullWidth
        onClick={handleSave}
        type="button"
        variant="primary"
      >
        {isSaving ? 'Saving...' : monitor ? 'Save changes' : 'Save monitor'}
      </Button>
    </div>
  )
}
