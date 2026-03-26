const HTTP_PROTOCOL_RE = /^https?:\/\//i
const HOSTNAME_LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function hasHttpProtocol(value: string): boolean {
  return HTTP_PROTOCOL_RE.test(value)
}

export function ensureHttpUrl(value: string): string {
  return hasHttpProtocol(value) ? value : `https://${value}`
}

export function isValidIpv4Address(value: string): boolean {
  const parts = value.split('.')

  if (parts.length !== 4) {
    return false
  }

  return parts.every((part) => {
    if (!/^(0|[1-9]\d{0,2})$/.test(part)) {
      return false
    }

    const parsed = Number(part)
    return parsed >= 0 && parsed <= 255
  })
}

export function isValidHostname(value: string): boolean {
  const normalizedValue = value.trim()

  if (!normalizedValue || normalizedValue.length > 253) {
    return false
  }

  return normalizedValue.split('.').every((label) => HOSTNAME_LABEL_RE.test(label))
}

export function isValidNetworkHost(value: string): boolean {
  return (
    value.toLowerCase() === 'localhost' ||
    isValidIpv4Address(value) ||
    isValidHostname(value)
  )
}

export function normalizeHttpTarget(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const normalized = ensureHttpUrl(trimmed)
  const parsed = parseUrl(normalized)

  if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
    return null
  }

  return normalized
}

export function normalizeNetworkTarget(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const candidate = hasHttpProtocol(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = parseUrl(candidate)

  if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
    return null
  }

  if (!isValidNetworkHost(parsed.hostname)) {
    return null
  }

  return trimmed
}

export function getDisplayHost(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Monitor'
  }

  const parsed = parseUrl(ensureHttpUrl(trimmed))
  return parsed?.hostname.replace(/^www\./i, '') || trimmed
}
