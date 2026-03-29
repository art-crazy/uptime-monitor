import { useMemo } from 'react'

import { t } from '@shared/lib/i18n'
import { Toggle } from '@shared/ui/Toggle'
import styles from './AddMonitorForm.module.css'
import {
  API_IMPORT_AUTH_TYPES,
  API_IMPORT_METHODS,
  API_IMPORT_RESPONSE_MODES,
} from '../model/types'
import type { ApiMonitorFormFields } from '../model/types'
import type { ApiMonitorValidationField } from '../model/validation'

interface ApiMonitorFieldsProps {
  apiFields: ApiMonitorFormFields
  fieldErrors: Partial<Record<ApiMonitorValidationField, string>>
  isSaving: boolean
  onClearErrors: (...fields: ApiMonitorValidationField[]) => void
  onUpdateApiFields: (patch: Partial<ApiMonitorFormFields>) => void
}

export function ApiMonitorFields({
  apiFields,
  fieldErrors,
  isSaving,
  onClearErrors,
  onUpdateApiFields,
}: ApiMonitorFieldsProps) {
  const apiMethodOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_method_get'), value: API_IMPORT_METHODS.get },
        { label: t('add_monitor_api_method_post'), value: API_IMPORT_METHODS.post },
      ] as const,
    [],
  )
  const apiAuthOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_auth_none'), value: API_IMPORT_AUTH_TYPES.none },
        { label: t('add_monitor_api_auth_bearer'), value: API_IMPORT_AUTH_TYPES.bearer },
        { label: t('add_monitor_api_auth_basic'), value: API_IMPORT_AUTH_TYPES.basic },
      ] as const,
    [],
  )
  const apiResponseOptions = useMemo(
    () =>
      [
        { label: t('add_monitor_api_response_none'), value: API_IMPORT_RESPONSE_MODES.none },
        {
          label: t('add_monitor_api_response_body_includes'),
          value: API_IMPORT_RESPONSE_MODES.bodyIncludes,
        },
        {
          label: t('add_monitor_api_response_json_value'),
          value: API_IMPORT_RESPONSE_MODES.jsonValue,
        },
      ] as const,
    [],
  )

  const isApiPostMethod = apiFields.method === API_IMPORT_METHODS.post
  const isBearerAuth = apiFields.authType === API_IMPORT_AUTH_TYPES.bearer
  const isBasicAuth = apiFields.authType === API_IMPORT_AUTH_TYPES.basic
  const isBodyResponseCheck =
    apiFields.responseMode === API_IMPORT_RESPONSE_MODES.bodyIncludes
  const isJsonResponseCheck =
    apiFields.responseMode === API_IMPORT_RESPONSE_MODES.jsonValue

  const getFieldHint = (field: ApiMonitorValidationField, fallback: string) =>
    fieldErrors[field] ?? fallback
  const getHintClassName = (field: ApiMonitorValidationField) =>
    [styles.hint, fieldErrors[field] ? styles.hintError : ''].filter(Boolean).join(' ')
  const getInputClassName = (
    field: ApiMonitorValidationField,
    baseClassName = styles.input,
  ) => [baseClassName, fieldErrors[field] ? styles.inputError : ''].filter(Boolean).join(' ')

  return (
    <>
      <div className={styles.sectionTitle}>{t('add_monitor_section_api_request')}</div>

      <div className={styles.field}>
        <div className={styles.label}>{t('add_monitor_field_api_method')}</div>
        <Toggle
          disabled={isSaving}
          onChange={(value) => {
            onClearErrors()
            onUpdateApiFields({ method: value })
          }}
          options={apiMethodOptions}
          value={apiFields.method}
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
            onClearErrors('headers')
            onUpdateApiFields({ headersText: event.target.value })
          }}
          placeholder={t('add_monitor_placeholder_api_headers')}
          spellCheck={false}
          value={apiFields.headersText}
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
            onClearErrors('headers', 'authToken', 'authUsername')
            onUpdateApiFields({ authType: value })
          }}
          options={apiAuthOptions}
          value={apiFields.authType}
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
              onClearErrors('authToken', 'headers')
              onUpdateApiFields({ authToken: event.target.value })
            }}
            spellCheck={false}
            type="password"
            value={apiFields.authToken}
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
                onClearErrors('authUsername', 'headers')
                onUpdateApiFields({ authUsername: event.target.value })
              }}
              spellCheck={false}
              type="text"
              value={apiFields.authUsername}
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
                onUpdateApiFields({ authPassword: event.target.value })
              }}
              spellCheck={false}
              type="password"
              value={apiFields.authPassword}
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
              onUpdateApiFields({ body: event.target.value })
            }}
            placeholder='{"status":"ok"}'
            spellCheck={false}
            value={apiFields.body}
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
            onClearErrors('expectedStatus')
            onUpdateApiFields({ expectedStatus: event.target.value.replace(/[^\d]/g, '') })
          }}
          placeholder={t('add_monitor_placeholder_api_expected_status')}
          spellCheck={false}
          type="text"
          value={apiFields.expectedStatus}
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
            onClearErrors('responseBody', 'responseJsonPath', 'responseJsonValue')
            onUpdateApiFields({ responseMode: value })
          }}
          options={apiResponseOptions}
          value={apiFields.responseMode}
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
              onClearErrors('responseBody')
              onUpdateApiFields({ responseBody: event.target.value })
            }}
            spellCheck={false}
            type="text"
            value={apiFields.responseBody}
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
                onClearErrors('responseJsonPath')
                onUpdateApiFields({ responseJsonPath: event.target.value })
              }}
              placeholder="data.status"
              spellCheck={false}
              type="text"
              value={apiFields.responseJsonPath}
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
                onClearErrors('responseJsonValue')
                onUpdateApiFields({ responseJsonValue: event.target.value })
              }}
              placeholder="ok"
              spellCheck={false}
              type="text"
              value={apiFields.responseJsonValue}
            />
            <div className={getHintClassName('responseJsonValue')}>
              {getFieldHint('responseJsonValue', t('add_monitor_hint_api_response_json'))}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
