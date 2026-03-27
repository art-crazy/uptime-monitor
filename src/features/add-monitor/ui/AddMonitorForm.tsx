import { useMemo, useState } from 'react'

import {
  DEFAULT_API_MONITOR_CONFIG,
  normalizeApiMonitorConfig,
  parseApiHeadersText,
  type CheckInterval,
} from '../../../entities/monitor'
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
  const [apiMethod, setApiMethod] = useState(initialState.method)
  const [apiHeadersText, setApiHeadersText] = useState(initialState.headersText)
  const [apiAuthType, setApiAuthType] = useState(initialState.authType)
  const [apiAuthToken, setApiAuthToken] = useState(initialState.authToken)
  const [apiAuthUsername, setApiAuthUsername] = useState(initialState.authUsername)
  const [apiAuthPassword, setApiAuthPassword] = useState(initialState.authPassword)
  const [apiBody, setApiBody] = useState(initialState.body)
  const [apiResponseMode, setApiResponseMode] = useState(initialState.responseMode)
  const [apiResponseBody, setApiResponseBody] = useState(initialState.responseBody)
  const [apiResponseJsonPath, setApiResponseJsonPath] = useState(initialState.responseJsonPath)
  const [apiResponseJsonValue, setApiResponseJsonValue] = useState(initialState.responseJsonValue)
  const [error, setError] = useState<string | null>(null)
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

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    const result = validateMonitorInput(url, type)

    if (!result.normalized) {
      setError(result.errorKey ? t(result.errorKey) : t('add_monitor_error_unable_to_save'))
      return
    }

    const parsedApiHeaders = parseApiHeadersText(apiHeadersText)

    if (isApiType && parsedApiHeaders.error) {
      setError(t('add_monitor_error_invalid_api_headers'))
      return
    }

    if (
      isApiType &&
      (
        (apiAuthType === 'bearer' && apiAuthToken.trim().length === 0) ||
        (apiAuthType === 'basic' && apiAuthUsername.trim().length === 0)
      )
    ) {
      setError(t('add_monitor_error_invalid_api_auth'))
      return
    }

    if (
      isApiType &&
      (
        (apiResponseMode === 'body_includes' && apiResponseBody.trim().length === 0) ||
        (
          apiResponseMode === 'json_value' &&
          (
            apiResponseJsonPath.trim().length === 0 ||
            apiResponseJsonValue.trim().length === 0
          )
        )
      )
    ) {
      setError(t('add_monitor_error_invalid_api_response'))
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const normalizedUrl = result.normalized
      const apiConfig = isApiType
        ? normalizeApiMonitorConfig({
            authPassword: apiAuthPassword,
            authToken: apiAuthToken,
            authType: apiAuthType,
            authUsername: apiAuthUsername,
            body: apiBody,
            headers: parsedApiHeaders.headers,
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

      {isApiType ? (
        <>
          <div className={styles.sectionTitle}>{t('add_monitor_section_api_request')}</div>

          <div className={styles.field}>
            <div className={styles.label}>{t('add_monitor_field_api_method')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                setError(null)
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
              className={styles.textarea}
              disabled={isSaving}
              id="api-headers"
              onChange={(event) => {
                setError(null)
                setApiHeadersText(event.target.value)
              }}
              placeholder={t('add_monitor_placeholder_api_headers')}
              spellCheck={false}
              value={apiHeadersText}
            />
            <div className={styles.hint}>{t('add_monitor_hint_api_headers')}</div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>{t('add_monitor_field_api_auth')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                setError(null)
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
                className={styles.input}
                disabled={isSaving}
                id="api-auth-token"
                onChange={(event) => {
                  setError(null)
                  setApiAuthToken(event.target.value)
                }}
                spellCheck={false}
                type="password"
                value={apiAuthToken}
              />
            </div>
          ) : null}

          {isBasicAuth ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-auth-username">
                  {t('add_monitor_field_api_auth_username')}
                </label>
                <input
                  className={styles.input}
                  disabled={isSaving}
                  id="api-auth-username"
                  onChange={(event) => {
                    setError(null)
                    setApiAuthUsername(event.target.value)
                  }}
                  spellCheck={false}
                  type="text"
                  value={apiAuthUsername}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-auth-password">
                  {t('add_monitor_field_api_auth_password')}
                </label>
                <input
                  className={styles.input}
                  disabled={isSaving}
                  id="api-auth-password"
                  onChange={(event) => {
                    setError(null)
                    setApiAuthPassword(event.target.value)
                  }}
                  spellCheck={false}
                  type="password"
                  value={apiAuthPassword}
                />
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
                  setError(null)
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
            <div className={styles.label}>{t('add_monitor_field_api_response_check')}</div>
            <Toggle
              disabled={isSaving}
              onChange={(value) => {
                setError(null)
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
                className={styles.input}
                disabled={isSaving}
                id="api-response-body"
                onChange={(event) => {
                  setError(null)
                  setApiResponseBody(event.target.value)
                }}
                spellCheck={false}
                type="text"
                value={apiResponseBody}
              />
              <div className={styles.hint}>{t('add_monitor_hint_api_response_body')}</div>
            </div>
          ) : null}

          {isJsonResponseCheck ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-response-json-path">
                  {t('add_monitor_field_api_response_json_path')}
                </label>
                <input
                  className={styles.input}
                  disabled={isSaving}
                  id="api-response-json-path"
                  onChange={(event) => {
                    setError(null)
                    setApiResponseJsonPath(event.target.value)
                  }}
                  placeholder="data.status"
                  spellCheck={false}
                  type="text"
                  value={apiResponseJsonPath}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="api-response-json-value">
                  {t('add_monitor_field_api_response_json_value')}
                </label>
                <input
                  className={styles.input}
                  disabled={isSaving}
                  id="api-response-json-value"
                  onChange={(event) => {
                    setError(null)
                    setApiResponseJsonValue(event.target.value)
                  }}
                  placeholder="ok"
                  spellCheck={false}
                  type="text"
                  value={apiResponseJsonValue}
                />
                <div className={styles.hint}>{t('add_monitor_hint_api_response_json')}</div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

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
