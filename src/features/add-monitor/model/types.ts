import {
  type ApiMonitorAuthType,
  type ApiMonitorConfig,
  type ApiMonitorResponseMode,
  type CheckInterval,
  type MonitorType,
} from '../../../entities/monitor'

export interface MonitorFormDraft {
  apiConfig: ApiMonitorConfig
  id?: string
  interval: CheckInterval
  name?: string
  type: MonitorType
  url: string
}

export interface ApiMonitorFormFields {
  authPassword: string
  authToken: string
  authType: ApiMonitorAuthType
  authUsername: string
  body: string
  expectedStatus: string
  headersText: string
  method: ApiMonitorConfig['method']
  responseBody: string
  responseJsonPath: string
  responseJsonValue: string
  responseMode: ApiMonitorResponseMode
}

export type ApiImportFormState = ApiMonitorFormFields & {
  url: string
}

export type ApiImportWarning =
  | 'invalid_header'
  | 'unsupported_authorization'

export type ApiImportErrorReason =
  | 'empty'
  | 'invalid'

export type ApiImportSource = 'url' | 'curl' | 'json'

export const API_IMPORT_SOURCES = {
  curl: 'curl',
  json: 'json',
  url: 'url',
} as const

export const API_IMPORT_AUTH_TYPES = {
  basic: 'basic',
  bearer: 'bearer',
  none: 'none',
} as const

export const API_IMPORT_METHODS = {
  get: 'GET',
  post: 'POST',
} as const

export const API_IMPORT_RESPONSE_MODES = {
  bodyIncludes: 'body_includes',
  jsonValue: 'json_value',
  none: 'none',
} as const

export const API_IMPORT_ERROR_REASONS = {
  empty: 'empty',
  invalid: 'invalid',
} as const

export const API_IMPORT_WARNINGS = {
  invalidHeader: 'invalid_header',
  unsupportedAuthorization: 'unsupported_authorization',
} as const
