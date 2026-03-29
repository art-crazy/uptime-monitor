import { useEffect, useMemo, useState } from 'react'

import {
  DEFAULT_API_MONITOR_CONFIG,
  normalizeApiMonitorConfig,
  type CheckInterval,
} from '../../../entities/monitor'
import { CHECK_INTERVAL_OPTIONS, MIN_LOADING_MS } from '@shared/constants'
import { delay } from '@shared/lib/async'
import { t } from '@shared/lib/i18n'
import { saveMonitorDraft } from '@shared/lib/runtime'
import { formatCheckInterval } from '@shared/lib/time'
import { Toggle } from '@shared/ui/Toggle'
import styles from './AddMonitorForm.module.css'
import { getInitialMonitorFormState } from '../model/defaults'
import { createApiImportPatch } from '../model/createApiImportPatch'
import type {
  ApiImportFormState,
  ApiMonitorFormFields,
  MonitorFormDraft,
} from '../model/types'
import {
  translateFieldMessages,
  validateApiMonitorInput,
  validateMonitorInput,
  type ApiMonitorValidationField,
} from '../model/validation'
import {
  ApiRequestImportPanel,
  ApiRequestImportTrigger,
} from './ApiRequestImport'
import { ApiMonitorFields } from './ApiMonitorFields'
import { useApiRequestImport } from './useApiRequestImport'

interface AddMonitorFormProps {
  defaultInterval: CheckInterval
  formId: string
  monitor?: MonitorFormDraft
  onSaved: (monitorId: string) => void
  onStateChange: (state: { isDisabled: boolean; isSaving: boolean }) => void
}

type FieldErrorKey =
  | 'url'
  | ApiMonitorValidationField
  | 'save'

export function AddMonitorForm({
  defaultInterval,
  formId,
  monitor,
  onSaved,
  onStateChange,
}: AddMonitorFormProps) {
  const initialState = useMemo(
    () => getInitialMonitorFormState(defaultInterval, monitor),
    [defaultInterval, monitor],
  )
  const [type, setType] = useState(initialState.type)
  const [url, setUrl] = useState(initialState.url)
  const [name, setName] = useState(initialState.name)
  const [interval, setInterval] = useState(initialState.interval)
  const [apiFields, setApiFields] = useState<ApiMonitorFormFields>({
    authPassword: initialState.authPassword,
    authToken: initialState.authToken,
    authType: initialState.authType,
    authUsername: initialState.authUsername,
    body: initialState.body,
    expectedStatus: initialState.expectedStatus,
    headersText: initialState.headersText,
    method: initialState.method,
    responseBody: initialState.responseBody,
    responseJsonPath: initialState.responseJsonPath,
    responseJsonValue: initialState.responseJsonValue,
    responseMode: initialState.responseMode,
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const typeOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_type_website'), value: 'website' },
        { label: t('add_monitor_type_host'), value: 'host' },
        { label: t('add_monitor_type_api'), value: 'api' },
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
  const isApiType = type === 'api'

  useEffect(() => {
    onStateChange({ isDisabled: isUrlEmpty, isSaving })
  }, [isSaving, isUrlEmpty, onStateChange])

  const fieldLabel =
    type === 'host' ? t('add_monitor_field_host') : t('add_monitor_field_url')
  const placeholder =
    type === 'host'
      ? t('add_monitor_placeholder_host')
      : type === 'api'
        ? t('add_monitor_placeholder_api')
        : t('add_monitor_placeholder_url')
  const hint =
    type === 'host'
      ? t('add_monitor_hint_host')
      : type === 'api'
        ? t('add_monitor_hint_api')
        : t('add_monitor_hint_url')

  const getFieldHint = (field: FieldErrorKey, fallback: string) => fieldErrors[field] ?? fallback
  const getHintClassName = (field: FieldErrorKey) =>
    [styles.hint, fieldErrors[field] ? styles.hintError : ''].filter(Boolean).join(' ')
  const getInputClassName = (field: FieldErrorKey, baseClassName = styles.input) =>
    [baseClassName, fieldErrors[field] ? styles.inputError : ''].filter(Boolean).join(' ')
  const updateApiFields = (patch: Partial<ApiMonitorFormFields>) => {
    setApiFields((current) => ({
      ...current,
      ...patch,
    }))
  }
  const clearErrors = (...fields: FieldErrorKey[]) => {
    if (fields.length === 0) {
      setFieldErrors({})
      return
    }

    setFieldErrors((current) => {
      const next = { ...current }

      for (const field of fields) {
        delete next[field]
      }

      return next
    })
  }

  const handleImportedApiState = (state: ApiImportFormState) => {
    clearErrors()
    const imported = createApiImportPatch(state)

    setUrl(imported.url)
    setApiFields(imported.apiFields)
  }
  const apiImport = useApiRequestImport({ onImported: handleImportedApiState })

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    clearErrors()
    const result = validateMonitorInput(url, type)

    if (!result.normalized) {
      setFieldErrors(
        translateFieldMessages({
          url: result.errorKey ?? 'add_monitor_error_unable_to_save',
        }),
      )
      return
    }

    let expectedStatus: number | null = null
    let parsedHeaders: ReturnType<typeof validateApiMonitorInput>['parsedHeaders'] = []

    if (isApiType) {
      const apiValidation = validateApiMonitorInput({
        authToken: apiFields.authToken,
        authType: apiFields.authType,
        authUsername: apiFields.authUsername,
        expectedStatus: apiFields.expectedStatus,
        headersText: apiFields.headersText,
        responseBody: apiFields.responseBody,
        responseJsonPath: apiFields.responseJsonPath,
        responseJsonValue: apiFields.responseJsonValue,
        responseMode: apiFields.responseMode,
      })
      parsedHeaders = apiValidation.parsedHeaders
      expectedStatus = apiValidation.expectedStatus

      if (Object.keys(apiValidation.errors).length > 0) {
        setFieldErrors(translateFieldMessages(apiValidation.errors))
        return
      }
    }

    setIsSaving(true)

    try {
      const normalizedUrl = result.normalized
      const apiConfig = isApiType
        ? normalizeApiMonitorConfig({
            authPassword: apiFields.authPassword,
            authToken: apiFields.authToken,
            authType: apiFields.authType,
            authUsername: apiFields.authUsername,
            body: apiFields.body,
            expectedStatus,
            headers: parsedHeaders,
            method: apiFields.method,
            responseBody: apiFields.responseBody,
            responseJsonPath: apiFields.responseJsonPath,
            responseJsonValue: apiFields.responseJsonValue,
            responseMode: apiFields.responseMode,
          })
        : DEFAULT_API_MONITOR_CONFIG

      const [response] = await Promise.all([
        saveMonitorDraft({ apiConfig, id: monitor?.id, interval, name: name.trim() || undefined, type, url: normalizedUrl }),
        delay(MIN_LOADING_MS),
      ])

      onSaved(response.monitorId)
    } catch {
      setFieldErrors(translateFieldMessages({ save: 'add_monitor_error_unable_to_save' }))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className={styles.form}
      id={formId}
      onSubmit={(e) => { e.preventDefault(); void handleSave() }}
    >
      <div className={styles.field}>
        <div className={styles.label}>{t('add_monitor_field_type')}</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            clearErrors()
            setType(value)
          }}
          options={typeOptions}
          value={type}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="monitor-url">
            {fieldLabel}
          </label>
          {isApiType ? (
            <ApiRequestImportTrigger
              disabled={isSaving}
              isOpen={apiImport.isOpen}
              onToggle={apiImport.handleToggle}
            />
          ) : null}
        </div>
        {isApiType ? (
          <ApiRequestImportPanel
            disabled={isSaving}
            isOpen={apiImport.isOpen}
            onApply={apiImport.handleApply}
            onPasteFromClipboard={() => {
              void apiImport.handlePasteFromClipboard()
            }}
            onValueChange={apiImport.handleValueChange}
            value={apiImport.value}
          />
        ) : null}
        <input
          aria-invalid={fieldErrors.url ? 'true' : 'false'}
          autoFocus
          className={getInputClassName('url')}
          disabled={isSaving}
          id="monitor-url"
          onChange={(event) => {
            clearErrors('url', 'save')
            setUrl(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          type="text"
          value={url}
        />
        <div className={getHintClassName('url')}>{getFieldHint('url', hint)}</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="monitor-name">
          {t('add_monitor_field_name')}
        </label>
        <input
          className={styles.input}
          disabled={isSaving}
          id="monitor-name"
          onChange={(event) => {
            clearErrors('save')
            setName(event.target.value)
          }}
          placeholder={t('add_monitor_placeholder_name')}
          spellCheck={false}
          type="text"
          value={name}
        />
        <div className={styles.hint}>{t('add_monitor_hint_name')}</div>
      </div>

      <div className={styles.field}>
        <div className={styles.label}>{t('add_monitor_field_interval')}</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            clearErrors('save')
            setInterval(value as CheckInterval)
          }}
          options={intervalOptions}
          value={interval}
        />
      </div>

      {isApiType ? (
        <ApiMonitorFields
          apiFields={apiFields}
          fieldErrors={fieldErrors}
          isSaving={isSaving}
          onClearErrors={(...fields) => {
            clearErrors(...fields, 'save')
          }}
          onUpdateApiFields={updateApiFields}
        />
      ) : null}

      {fieldErrors.save ? (
        <div className={[styles.hint, styles.hintError].join(' ')}>{fieldErrors.save}</div>
      ) : null}
    </form>
  )
}
