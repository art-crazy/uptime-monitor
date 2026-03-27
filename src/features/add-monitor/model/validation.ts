import {
  normalizeMonitorTarget,
  parseApiHeadersText,
  type ApiMonitorAuthType,
  type ApiMonitorResponseMode,
  type MonitorType,
} from '../../../entities/monitor'
import { t, type TranslationKey } from '@shared/lib/i18n'

type MonitorValidationErrorKey =
  | 'add_monitor_error_invalid_host'
  | 'add_monitor_error_invalid_url'
  | 'add_monitor_error_invalid_api_headers'
  | 'add_monitor_error_invalid_api_authorization_header'
  | 'add_monitor_error_invalid_api_bearer_token'
  | 'add_monitor_error_invalid_api_basic_auth_username'
  | 'add_monitor_error_invalid_api_status'
  | 'add_monitor_error_invalid_api_response_body'
  | 'add_monitor_error_invalid_api_response_json_path'
  | 'add_monitor_error_invalid_api_response_json_value'

export type ApiMonitorValidationField =
  | 'headers'
  | 'authToken'
  | 'authUsername'
  | 'expectedStatus'
  | 'responseBody'
  | 'responseJsonPath'
  | 'responseJsonValue'

interface MonitorValidationResult {
  errorKey: MonitorValidationErrorKey | null
  normalized: string | null
}

export interface ApiMonitorValidationInput {
  authToken: string
  authType: ApiMonitorAuthType
  authUsername: string
  expectedStatus: string
  headersText: string
  responseBody: string
  responseJsonPath: string
  responseJsonValue: string
  responseMode: ApiMonitorResponseMode
}

interface ApiMonitorValidationResult {
  errors: Partial<Record<ApiMonitorValidationField, MonitorValidationErrorKey>>
  expectedStatus: number | null
  parsedHeaders: ReturnType<typeof parseApiHeadersText>['headers']
}

export function translateFieldMessages<TField extends string>(
  messages: Partial<Record<TField, TranslationKey>>,
): Partial<Record<TField, string>> {
  const translated: Partial<Record<TField, string>> = {}

  for (const field of Object.keys(messages) as TField[]) {
    const messageKey = messages[field]

    if (messageKey) {
      translated[field] = t(messageKey)
    }
  }

  return translated
}

export function validateMonitorInput(
  value: string,
  type: MonitorType,
): MonitorValidationResult {
  const normalized = normalizeMonitorTarget(value, type)

  if (!normalized) {
    return {
      errorKey:
        type === 'host'
          ? 'add_monitor_error_invalid_host'
          : 'add_monitor_error_invalid_url',
      normalized: null,
    }
  }

  return {
    errorKey: null,
    normalized,
  }
}

export function validateApiMonitorInput(
  input: ApiMonitorValidationInput,
): ApiMonitorValidationResult {
  const parsedHeaders = parseApiHeadersText(input.headersText)

  if (parsedHeaders.error) {
    return {
      errors: {
        headers: 'add_monitor_error_invalid_api_headers',
      },
      expectedStatus: null,
      parsedHeaders: [],
    }
  }

  const hasAuthorizationHeader = parsedHeaders.headers.some(
    (header) => header.name.toLowerCase() === 'authorization',
  )

  if (input.authType !== 'none' && hasAuthorizationHeader) {
    return {
      errors: {
        headers: 'add_monitor_error_invalid_api_authorization_header',
      },
      expectedStatus: null,
      parsedHeaders: parsedHeaders.headers,
    }
  }

  if (input.authType === 'bearer' && input.authToken.trim().length === 0) {
    return {
      errors: {
        authToken: 'add_monitor_error_invalid_api_bearer_token',
      },
      expectedStatus: null,
      parsedHeaders: parsedHeaders.headers,
    }
  }

  if (input.authType === 'basic' && input.authUsername.trim().length === 0) {
    return {
      errors: {
        authUsername: 'add_monitor_error_invalid_api_basic_auth_username',
      },
      expectedStatus: null,
      parsedHeaders: parsedHeaders.headers,
    }
  }

  let expectedStatus: number | null = null
  const trimmedExpectedStatus = input.expectedStatus.trim()

  if (trimmedExpectedStatus.length > 0) {
    if (!/^\d{3}$/.test(trimmedExpectedStatus)) {
      return {
        errors: {
          expectedStatus: 'add_monitor_error_invalid_api_status',
        },
        expectedStatus: null,
        parsedHeaders: parsedHeaders.headers,
      }
    }

    expectedStatus = Number(trimmedExpectedStatus)

    if (expectedStatus < 100 || expectedStatus > 599) {
      return {
        errors: {
          expectedStatus: 'add_monitor_error_invalid_api_status',
        },
        expectedStatus: null,
        parsedHeaders: parsedHeaders.headers,
      }
    }
  }

  if (input.responseMode === 'body_includes' && input.responseBody.trim().length === 0) {
    return {
      errors: {
        responseBody: 'add_monitor_error_invalid_api_response_body',
      },
      expectedStatus,
      parsedHeaders: parsedHeaders.headers,
    }
  }

  if (input.responseMode === 'json_value') {
    const errors: Partial<Record<ApiMonitorValidationField, MonitorValidationErrorKey>> = {}

    if (input.responseJsonPath.trim().length === 0) {
      errors.responseJsonPath = 'add_monitor_error_invalid_api_response_json_path'
    }

    if (input.responseJsonValue.trim().length === 0) {
      errors.responseJsonValue = 'add_monitor_error_invalid_api_response_json_value'
    }

    if (Object.keys(errors).length > 0) {
      return {
        errors,
        expectedStatus,
        parsedHeaders: parsedHeaders.headers,
      }
    }
  }

  return {
    errors: {},
    expectedStatus,
    parsedHeaders: parsedHeaders.headers,
  }
}
