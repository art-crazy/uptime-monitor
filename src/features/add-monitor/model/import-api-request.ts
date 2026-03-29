import {
  formatApiHeaders,
  normalizeMonitorTarget,
  type ApiMonitorConfig,
  type ApiMonitorHeader,
} from '../../../entities/monitor'
import { ensureHttpUrl, isValidNetworkHost } from '@shared/lib/network'
import {
  type ApiImportErrorReason,
  type ApiImportFormState,
  type ApiImportSource,
  type ApiImportWarning,
  API_IMPORT_AUTH_TYPES,
  API_IMPORT_ERROR_REASONS,
  API_IMPORT_METHODS,
  API_IMPORT_RESPONSE_MODES,
  API_IMPORT_SOURCES,
  API_IMPORT_WARNINGS,
} from './types'

export interface ApiImportResult {
  source: ApiImportSource
  state: ApiImportFormState
  warnings: ApiImportWarning[]
}

export interface ApiImportFailure {
  reason: ApiImportErrorReason
}

export type ParseApiImportResult =
  | { ok: true; value: ApiImportResult }
  | { ok: false; error: ApiImportFailure }

interface JsonImportPayload {
  auth?: unknown
  authPassword?: unknown
  authToken?: unknown
  authType?: unknown
  authUsername?: unknown
  body?: unknown
  expectedStatus?: unknown
  headers?: unknown
  headersText?: unknown
  method?: unknown
  response?: unknown
  responseBody?: unknown
  responseJsonPath?: unknown
  responseJsonValue?: unknown
  responseMode?: unknown
  url?: unknown
}

const CURL_COMMAND = 'curl'
const CURL_INPUT_PATTERN = /^curl\b/i
const JSON_INPUT_START = '{'
const HTTP_PROTOCOLS = ['http://', 'https://'] as const
const AUTHORIZATION_HEADER = 'authorization'
const AUTH_SCHEME_BEARER_PATTERN = /^Bearer\s+(.+)$/i
const AUTH_SCHEME_BASIC_PATTERN = /^Basic\s+(.+)$/i
const RESPONSE_MODE_NONE: ApiMonitorConfig['responseMode'] = API_IMPORT_RESPONSE_MODES.none
const RESPONSE_MODE_BODY_INCLUDES: ApiMonitorConfig['responseMode'] = API_IMPORT_RESPONSE_MODES.bodyIncludes
const RESPONSE_MODE_JSON_VALUE: ApiMonitorConfig['responseMode'] = API_IMPORT_RESPONSE_MODES.jsonValue
const METHOD_GET: ApiMonitorConfig['method'] = API_IMPORT_METHODS.get
const METHOD_POST: ApiMonitorConfig['method'] = API_IMPORT_METHODS.post

const CURL_DATA_FLAGS = new Set([
  '--data',
  '--data-ascii',
  '--data-binary',
  '--data-raw',
  '-d',
])

const CURL_HEADER_FLAGS = new Set(['--header', '-H'])
const CURL_METHOD_FLAGS = new Set(['--request', '-X'])
const CURL_URL_FLAGS = new Set(['--url'])
const CURL_BASIC_AUTH_FLAGS = new Set(['--user', '-u'])
const WHITESPACE_PATTERN = /\s/
const MISSING_PROTOCOL_COLON_PATTERN = /^(https?)\/\//i

function createEmptyImportState(): ApiImportFormState {
  return {
    authPassword: '',
    authToken: '',
    authType: API_IMPORT_AUTH_TYPES.none,
    authUsername: '',
    body: '',
    expectedStatus: '',
    headersText: '',
    method: METHOD_GET,
    responseBody: '',
    responseJsonPath: '',
    responseJsonValue: '',
    responseMode: RESPONSE_MODE_NONE,
    url: '',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toExpectedStatusValue(value: unknown): string {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599) {
    return String(value)
  }

  if (typeof value === 'string' && /^\d{3}$/.test(value.trim())) {
    return value.trim()
  }

  return ''
}

function normalizeMethod(value: unknown): ApiMonitorConfig['method'] {
  return String(value).toUpperCase() === METHOD_POST ? METHOD_POST : METHOD_GET
}

function normalizeResponseMode(value: unknown): ApiMonitorConfig['responseMode'] {
  if (value === RESPONSE_MODE_BODY_INCLUDES) {
    return RESPONSE_MODE_BODY_INCLUDES
  }

  if (value === RESPONSE_MODE_JSON_VALUE) {
    return RESPONSE_MODE_JSON_VALUE
  }

  return RESPONSE_MODE_NONE
}

function parseHeadersInput(value: unknown): ApiMonitorHeader[] {
  if (Array.isArray(value)) {
    return value
      .map((header) => {
        if (!isRecord(header)) {
          return null
        }

        const name = toStringValue(header.name).trim()
        const headerValue = toStringValue(header.value).trim()
        return name ? { name, value: headerValue } : null
      })
      .filter((header): header is ApiMonitorHeader => header !== null)
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([name, headerValue]) => ({
        name: name.trim(),
        value: String(headerValue ?? '').trim(),
      }))
      .filter((header) => header.name.length > 0)
  }

  return []
}

function tryDecodeBase64(value: string): string | null {
  try {
    if (typeof atob !== 'function') {
      return null
    }

    return atob(value)
  } catch {
    return null
  }
}

function applyAuthorizationHeader(
  state: ApiImportFormState,
  headerValue: string,
  warnings: ApiImportWarning[],
): void {
  const trimmedValue = headerValue.trim()

  if (!trimmedValue) {
    return
  }

  const bearerMatch = AUTH_SCHEME_BEARER_PATTERN.exec(trimmedValue)

  if (bearerMatch) {
    state.authType = API_IMPORT_AUTH_TYPES.bearer
    state.authToken = bearerMatch[1].trim()
    return
  }

  const basicMatch = AUTH_SCHEME_BASIC_PATTERN.exec(trimmedValue)

  if (!basicMatch) {
    warnings.push(API_IMPORT_WARNINGS.unsupportedAuthorization)
    return
  }

  const decoded = tryDecodeBase64(basicMatch[1].trim())

  if (!decoded) {
    warnings.push(API_IMPORT_WARNINGS.unsupportedAuthorization)
    return
  }

  const separatorIndex = decoded.indexOf(':')

  if (separatorIndex < 0) {
    state.authType = API_IMPORT_AUTH_TYPES.basic
    state.authUsername = decoded
    state.authPassword = ''
    return
  }

  state.authType = API_IMPORT_AUTH_TYPES.basic
  state.authUsername = decoded.slice(0, separatorIndex)
  state.authPassword = decoded.slice(separatorIndex + 1)
}

function applyHeaders(
  state: ApiImportFormState,
  headers: ApiMonitorHeader[],
  warnings: ApiImportWarning[],
): void {
  const filteredHeaders: ApiMonitorHeader[] = []

  for (const header of headers) {
    if (header.name.toLowerCase() === AUTHORIZATION_HEADER) {
      applyAuthorizationHeader(state, header.value, warnings)
      continue
    }

    filteredHeaders.push(header)
  }

  state.headersText = formatApiHeaders(filteredHeaders)
}

function tokenizeCurl(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]

    if (quote) {
      if (char === '\\' && quote === '"' && index + 1 < input.length) {
        current += input[index + 1]
        index += 1
        continue
      }

      if (char === quote) {
        quote = null
        continue
      }

      current += char
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    if (char === '\\' && index + 1 < input.length) {
      const nextChar = input[index + 1]

      if (nextChar === '\r' || nextChar === '\n') {
        index += nextChar === '\r' && input[index + 2] === '\n' ? 2 : 1
        continue
      }

      current += nextChar
      index += 1
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

function parseCurlImport(input: string): ApiImportResult | null {
  const state = createEmptyImportState()
  const warnings: ApiImportWarning[] = []
  const headers: ApiMonitorHeader[] = []
  const tokens = tokenizeCurl(input)
  let hasExplicitMethod = false

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (index === 0 && token === CURL_COMMAND) {
      continue
    }

    if (CURL_URL_FLAGS.has(token)) {
      state.url = sanitizeImportedUrl(tokens[index + 1] ?? state.url)
      index += 1
      continue
    }

    if (CURL_METHOD_FLAGS.has(token)) {
      state.method = normalizeMethod(tokens[index + 1])
      hasExplicitMethod = true
      index += 1
      continue
    }

    if (CURL_HEADER_FLAGS.has(token)) {
      const headerToken = tokens[index + 1] ?? ''
      const colonIndex = headerToken.indexOf(':')

      if (colonIndex > 0) {
        headers.push({
          name: headerToken.slice(0, colonIndex).trim(),
          value: headerToken.slice(colonIndex + 1).trim(),
        })
      } else {
        warnings.push(API_IMPORT_WARNINGS.invalidHeader)
      }

      index += 1
      continue
    }

    if (CURL_DATA_FLAGS.has(token)) {
      state.body = tokens[index + 1] ?? ''

      if (!hasExplicitMethod) {
        state.method = METHOD_POST
      }

      index += 1
      continue
    }

    if (CURL_BASIC_AUTH_FLAGS.has(token)) {
      const credentials = tokens[index + 1] ?? ''
      const separatorIndex = credentials.indexOf(':')
      state.authType = API_IMPORT_AUTH_TYPES.basic
      state.authUsername = separatorIndex >= 0 ? credentials.slice(0, separatorIndex) : credentials
      state.authPassword = separatorIndex >= 0 ? credentials.slice(separatorIndex + 1) : ''
      index += 1
      continue
    }

    if (HTTP_PROTOCOLS.some((protocol) => token.startsWith(protocol))) {
      state.url = sanitizeImportedUrl(token)
    }
  }

  if (!state.url) {
    return null
  }

  applyHeaders(state, headers, warnings)

  return {
    source: API_IMPORT_SOURCES.curl,
    state,
    warnings,
  }
}

function parseJsonImport(input: string): ApiImportResult | null {
  let parsed: JsonImportPayload

  try {
    parsed = JSON.parse(input) as JsonImportPayload
  } catch {
    return null
  }

  if (!isRecord(parsed)) {
    return null
  }

  const state = createEmptyImportState()
  const warnings: ApiImportWarning[] = []
  state.url = sanitizeImportedUrl(toStringValue(parsed.url))
  state.method = normalizeMethod(parsed.method)
  state.body = toStringValue(parsed.body)
  state.expectedStatus = toExpectedStatusValue(parsed.expectedStatus)

  if (typeof parsed.headersText === 'string') {
    state.headersText = parsed.headersText.trim()
  } else {
    applyHeaders(state, parseHeadersInput(parsed.headers), warnings)
  }

  const auth = isRecord(parsed.auth) ? parsed.auth : null
  const authType = auth?.type ?? parsed.authType

  if (authType === API_IMPORT_AUTH_TYPES.bearer) {
    state.authType = API_IMPORT_AUTH_TYPES.bearer
    state.authToken = toStringValue(auth?.token ?? parsed.authToken).trim()
  } else if (authType === API_IMPORT_AUTH_TYPES.basic) {
    state.authType = API_IMPORT_AUTH_TYPES.basic
    state.authUsername = toStringValue(auth?.username ?? parsed.authUsername).trim()
    state.authPassword = toStringValue(auth?.password ?? parsed.authPassword)
  }

  const response = isRecord(parsed.response) ? parsed.response : null
  state.responseMode = normalizeResponseMode(response?.mode ?? parsed.responseMode)

  if (state.responseMode === RESPONSE_MODE_BODY_INCLUDES) {
    state.responseBody = toStringValue(response?.body ?? parsed.responseBody)
  }

  if (state.responseMode === RESPONSE_MODE_JSON_VALUE) {
    state.responseJsonPath = toStringValue(response?.path ?? parsed.responseJsonPath)
    state.responseJsonValue = toStringValue(response?.value ?? parsed.responseJsonValue)
  }

  if (!state.url) {
    return null
  }

  return {
    source: API_IMPORT_SOURCES.json,
    state,
    warnings,
  }
}

function parseUrlImport(input: string): ApiImportResult {
  const state = createEmptyImportState()
  state.url = sanitizeImportedUrl(input)

  return {
    source: API_IMPORT_SOURCES.url,
    state,
    warnings: [],
  }
}

function sanitizeImportedUrl(input: string): string {
  const trimmed = input.trim()

  if (!trimmed) {
    return ''
  }

  const outerProtocolMatch = /^(https?):\/\//i.exec(trimmed)

  if (outerProtocolMatch) {
    const outerProtocol = outerProtocolMatch[1]
    const remainder = trimmed.slice(outerProtocolMatch[0].length)
    const nestedProtocolMatch = /^(https?)(?::\/\/|\/\/)/i.exec(remainder)

    if (nestedProtocolMatch) {
      return `${outerProtocol}://${remainder.slice(nestedProtocolMatch[0].length)}`
    }
  }

  if (MISSING_PROTOCOL_COLON_PATTERN.test(trimmed)) {
    return trimmed.replace(MISSING_PROTOCOL_COLON_PATTERN, '$1://')
  }

  return trimmed
}

function extractRawUrlHost(input: string): string | null {
  let candidate = sanitizeImportedUrl(input)

  if (!candidate) {
    return null
  }

  if (HTTP_PROTOCOLS.some((protocol) => candidate.startsWith(protocol))) {
    candidate = candidate.replace(/^https?:\/\//i, '')
  }

  const pathIndex = candidate.search(/[/?#]/)

  if (pathIndex >= 0) {
    candidate = candidate.slice(0, pathIndex)
  }

  const authSeparatorIndex = candidate.lastIndexOf('@')

  if (authSeparatorIndex >= 0) {
    candidate = candidate.slice(authSeparatorIndex + 1)
  }

  if (!candidate || candidate.startsWith('[')) {
    return null
  }

  return candidate.replace(/:\d+$/, '')
}

function isValidUrlImportInput(input: string): boolean {
  const trimmed = input.trim()

  if (!trimmed || WHITESPACE_PATTERN.test(trimmed)) {
    return false
  }

  const rawHost = extractRawUrlHost(trimmed)

  if (!rawHost || !isValidNetworkHost(rawHost)) {
    return false
  }

  try {
    const parsed = new URL(ensureHttpUrl(trimmed))

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function parseApiImport(input: string): ParseApiImportResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      ok: false,
      error: { reason: API_IMPORT_ERROR_REASONS.empty },
    }
  }

  let result: ApiImportResult | null

  if (trimmed.startsWith(JSON_INPUT_START)) {
    result = parseJsonImport(trimmed)
  } else if (CURL_INPUT_PATTERN.test(trimmed)) {
    result = parseCurlImport(trimmed)
  } else if (isValidUrlImportInput(trimmed)) {
    result = parseUrlImport(trimmed)
  } else {
    result = null
  }

  if (!result) {
    return {
      ok: false,
      error: { reason: API_IMPORT_ERROR_REASONS.invalid },
    }
  }

  const normalizedUrl = normalizeMonitorTarget(result.state.url, 'api')

  if (!normalizedUrl) {
    return {
      ok: false,
      error: { reason: API_IMPORT_ERROR_REASONS.invalid },
    }
  }

  result.state.url = normalizedUrl
  return {
    ok: true,
    value: result,
  }
}
