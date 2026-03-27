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
import type { MonitorFormDraft } from '../model/types'
import {
  translateFieldMessages,
  validateApiMonitorInput,
  validateMonitorInput,
  type ApiMonitorValidationField,
} from '../model/validation'

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
  const [interval, setInterval] = useState(initialState.interval)
  const [apiMethod, setApiMethod] = useState(initialState.method)
  const [apiHeadersText, setApiHeadersText] = useState(initialState.headersText)
  const [apiAuthType, setApiAuthType] = useState(initialState.authType)
  const [apiAuthToken, setApiAuthToken] = useState(initialState.authToken)
  const [apiAuthUsername, setApiAuthUsername] = useState(initialState.authUsername)
  const [apiAuthPassword, setApiAuthPassword] = useState(initialState.authPassword)
  const [apiBody, setApiBody] = useState(initialState.body)
  const [apiExpectedStatus, setApiExpectedStatus] = useState(initialState.expectedStatus)
  const [apiResponseMode, setApiResponseMode] = useState(initialState.responseMode)
  const [apiResponseBody, setApiResponseBody] = useState(initialState.responseBody)
  const [apiResponseJsonPath, setApiResponseJsonPath] = useState(initialState.responseJsonPath)
  const [apiResponseJsonValue, setApiResponseJsonValue] = useState(initialState.responseJsonValue)
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
  const apiMethodOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_method_get'), value: 'GET' },
        { label: t('add_monitor_api_method_post'), value: 'POST' },
      ] as const,
    [],
  )
  const apiAuthOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_auth_none'), value: 'none' },
        { label: t('add_monitor_api_auth_bearer'), value: 'bearer' },
        { label: t('add_monitor_api_auth_basic'), value: 'basic' },
      ] as const,
    [],
  )
  const apiResponseOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_response_none'), value: 'none' },
        { label: t('add_monitor_api_response_body_includes'), value: 'body_includes' },
        { label: t('add_monitor_api_response_json_value'), value: 'json_value' },
      ] as const,
    [],
  )
  const isUrlEmpty = url.trim().length === 0
  const isApiType = type === 'api'

  useEffect(() => {
    onStateChange({ isDisabled: isUrlEmpty, isSaving })
  }, [isSaving, isUrlEmpty, onStateChange])

  const isApiPostMethod = isApiType && apiMethod === 'POST'
  const isBearerAuth = isApiType && apiAuthType === 'bearer'
  const isBasicAuth = isApiType && apiAuthType === 'basic'
  const isBodyResponseCheck = isApiType && apiResponseMode === 'body_includes'
  const isJsonResponseCheck = isApiType && apiResponseMode === 'json_value'
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
        authToken: apiAuthToken,
        authType: apiAuthType,
        authUsername: apiAuthUsername,
        expectedStatus: apiExpectedStatus,
        headersText: apiHeadersText,
        responseBody: apiResponseBody,
        responseJsonPath: apiResponseJsonPath,
        responseJsonValue: apiResponseJsonValue,
        responseMode: apiResponseMode,
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
            authPassword: apiAuthPassword,
            authToken: apiAuthToken,
            authType: apiAuthType,
            authUsername: apiAuthUsername,
            body: apiBody,
            expectedStatus,
            headers: parsedHeaders,
            method: apiMethod,
            responseBody: apiResponseBody,
            responseJsonPath: apiResponseJsonPath,
            responseJsonValue: apiResponseJsonValue,
            responseMode: apiResponseMode,
          })
        : DEFAULT_API_MONITOR_CONFIG

      const [response] = await Promise.all([
        saveMonitorDraft({ apiConfig, id: monitor?.id, interval, type, url: normalizedUrl }),
        delay(MIN_LOADING_MS),
      ])

      onSaved(response.monitorId)
    } catch (saveError) {
      console.error('[popup] saveMonitorDraft', saveError)
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
        <label className={styles.label} htmlFor="monitor-url">
          {fieldLabel}
        </label>
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
        <>
          <div className={styles.sectionTitle}>{t('add_monitor_section_api_request')}</div>

          <div className={styles.field}>
            <div className={styles.label}>{t('add_monitor_field_api_method')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                clearErrors('save')
                setApiMethod(value)
              }}
              options={apiMethodOptions}
              value={apiMethod}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="api-headers">
              {t('add_monitor_field_api_headers')}
            </label>
            <textarea
              aria-invalid={fieldErrors.headers ? 'true' : 'false'}
              className={getInputClassName('headers', styles.textarea)}
              disabled={isSaving}
              id="api-headers"
              onChange={(event) => {
                clearErrors('headers', 'save')
                setApiHeadersText(event.target.value)
              }}
              placeholder={t('add_monitor_placeholder_api_headers')}
              spellCheck={false}
              value={apiHeadersText}
            />
            <div className={getHintClassName('headers')}>
              {getFieldHint('headers', t('add_monitor_hint_api_headers'))}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>{t('add_monitor_field_api_auth')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                clearErrors('headers', 'authToken', 'authUsername', 'save')
                setApiAuthType(value)
              }}
              options={apiAuthOptions}
              value={apiAuthType}
            />
          </div>

          {isBearerAuth ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="api-auth-token">
                {t('add_monitor_field_api_auth_token')}
              </label>
              <input
                aria-invalid={fieldErrors.authToken ? 'true' : 'false'}
                className={getInputClassName('authToken')}
                disabled={isSaving}
                id="api-auth-token"
                onChange={(event) => {
                  clearErrors('authToken', 'headers', 'save')
                  setApiAuthToken(event.target.value)
                }}
                spellCheck={false}
                type="password"
                value={apiAuthToken}
              />
              <div className={getHintClassName('authToken')}>
                {getFieldHint('authToken', t('add_monitor_hint_api_auth_token'))}
              </div>
            </div>
          ) : null}

          {isBasicAuth ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-auth-username">
                  {t('add_monitor_field_api_auth_username')}
                </label>
                <input
                  aria-invalid={fieldErrors.authUsername ? 'true' : 'false'}
                  className={getInputClassName('authUsername')}
                  disabled={isSaving}
                  id="api-auth-username"
                  onChange={(event) => {
                    clearErrors('authUsername', 'headers', 'save')
                    setApiAuthUsername(event.target.value)
                  }}
                  spellCheck={false}
                  type="text"
                  value={apiAuthUsername}
                />
                <div className={getHintClassName('authUsername')}>
                  {getFieldHint('authUsername', t('add_monitor_hint_api_auth_username'))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-auth-password">
                  {t('add_monitor_field_api_auth_password')}
                </label>
                <input
                  aria-invalid="false"
                  className={styles.input}
                  disabled={isSaving}
                  id="api-auth-password"
                  onChange={(event) => {
                    clearErrors('save')
                    setApiAuthPassword(event.target.value)
                  }}
                  spellCheck={false}
                  type="password"
                  value={apiAuthPassword}
                />
                <div className={styles.hint}>{t('add_monitor_hint_api_auth_password')}</div>
              </div>
            </>
          ) : null}

          {isApiPostMethod ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="api-body">
                {t('add_monitor_field_api_body')}
              </label>
              <textarea
                className={styles.textarea}
                disabled={isSaving}
                id="api-body"
                onChange={(event) => {
                  clearErrors('save')
                  setApiBody(event.target.value)
                }}
                placeholder='{"status":"ok"}'
                spellCheck={false}
                value={apiBody}
              />
              <div className={styles.hint}>{t('add_monitor_hint_api_body')}</div>
            </div>
          ) : null}

          <div className={styles.sectionTitle}>{t('add_monitor_section_api_response')}</div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="api-expected-status">
              {t('add_monitor_field_api_expected_status')}
            </label>
            <input
              aria-invalid={fieldErrors.expectedStatus ? 'true' : 'false'}
              className={getInputClassName('expectedStatus')}
              disabled={isSaving}
              id="api-expected-status"
              inputMode="numeric"
              maxLength={3}
              onChange={(event) => {
                clearErrors('expectedStatus', 'save')
                setApiExpectedStatus(event.target.value.replace(/[^\d]/g, ''))
              }}
              placeholder={t('add_monitor_placeholder_api_expected_status')}
              spellCheck={false}
              type="text"
              value={apiExpectedStatus}
            />
            <div className={getHintClassName('expectedStatus')}>
              {getFieldHint('expectedStatus', t('add_monitor_hint_api_expected_status'))}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>{t('add_monitor_field_api_response_check')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                clearErrors('responseBody', 'responseJsonPath', 'responseJsonValue', 'save')
                setApiResponseMode(value)
              }}
              options={apiResponseOptions}
              value={apiResponseMode}
            />
          </div>

          {isBodyResponseCheck ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="api-response-body">
                {t('add_monitor_field_api_response_body')}
              </label>
              <input
                aria-invalid={fieldErrors.responseBody ? 'true' : 'false'}
                className={getInputClassName('responseBody')}
                disabled={isSaving}
                id="api-response-body"
                onChange={(event) => {
                  clearErrors('responseBody', 'save')
                  setApiResponseBody(event.target.value)
                }}
                spellCheck={false}
                type="text"
                value={apiResponseBody}
              />
              <div className={getHintClassName('responseBody')}>
                {getFieldHint('responseBody', t('add_monitor_hint_api_response_body'))}
              </div>
            </div>
          ) : null}

          {isJsonResponseCheck ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-response-json-path">
                  {t('add_monitor_field_api_response_json_path')}
                </label>
                <input
                  aria-invalid={fieldErrors.responseJsonPath ? 'true' : 'false'}
                  className={getInputClassName('responseJsonPath')}
                  disabled={isSaving}
                  id="api-response-json-path"
                  onChange={(event) => {
                    clearErrors('responseJsonPath', 'save')
                    setApiResponseJsonPath(event.target.value)
                  }}
                  placeholder="data.status"
                  spellCheck={false}
                  type="text"
                  value={apiResponseJsonPath}
                />
                <div className={getHintClassName('responseJsonPath')}>
                  {getFieldHint('responseJsonPath', '')}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-response-json-value">
                  {t('add_monitor_field_api_response_json_value')}
                </label>
                <input
                  aria-invalid={fieldErrors.responseJsonValue ? 'true' : 'false'}
                  className={getInputClassName('responseJsonValue')}
                  disabled={isSaving}
                  id="api-response-json-value"
                  onChange={(event) => {
                    clearErrors('responseJsonValue', 'save')
                    setApiResponseJsonValue(event.target.value)
                  }}
                  placeholder="ok"
                  spellCheck={false}
                  type="text"
                  value={apiResponseJsonValue}
                />
                <div className={getHintClassName('responseJsonValue')}>
                  {getFieldHint('responseJsonValue', t('add_monitor_hint_api_response_json'))}
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {fieldErrors.save ? (
        <div className={[styles.hint, styles.hintError].join(' ')}>{fieldErrors.save}</div>
      ) : null}
    </form>
  )
}
