import { getRuntimeLocale, t } from './i18n'

interface LocaleFormatters {
  dateTime: Intl.DateTimeFormat
  hour: Intl.NumberFormat
  minute: Intl.NumberFormat
  millisecond: Intl.NumberFormat
  percentFraction: Intl.NumberFormat
  percentWhole: Intl.NumberFormat
  relative: Intl.RelativeTimeFormat
  second: Intl.NumberFormat
  time: Intl.DateTimeFormat
}

const formatterCache = new Map<string, LocaleFormatters>()

function getLocaleFormatters(): LocaleFormatters {
  const locale = getRuntimeLocale()
  const cacheKey = locale ?? 'default'
  const cachedFormatters = formatterCache.get(cacheKey)

  if (cachedFormatters) {
    return cachedFormatters
  }

  const formatters: LocaleFormatters = {
    dateTime: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    hour: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: 'unit',
      unit: 'hour',
      unitDisplay: 'narrow',
    }),
    minute: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'narrow',
    }),
    millisecond: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: 'unit',
      unit: 'millisecond',
      unitDisplay: 'narrow',
    }),
    percentFraction: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      style: 'percent',
    }),
    percentWhole: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: 'percent',
    }),
    relative: new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
      style: 'narrow',
    }),
    second: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: 'unit',
      unit: 'second',
      unitDisplay: 'narrow',
    }),
    time: new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }

  formatterCache.set(cacheKey, formatters)
  return formatters
}

export function formatRelativeFromNow(timestamp: number, now = Date.now()): string {
  const { relative } = getLocaleFormatters()
  const diff = Math.max(0, now - timestamp)
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) {
    return relative.format(-seconds, 'second')
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return relative.format(-minutes, 'minute')
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return relative.format(-hours, 'hour')
  }

  const days = Math.floor(hours / 24)
  return relative.format(-days, 'day')
}

export function formatDuration(durationMs: number): string {
  const { hour, minute, second } = getLocaleFormatters()
  const seconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hour.format(hours)} ${minute.format(minutes)}`
  }

  if (minutes > 0) {
    return `${minute.format(minutes)} ${second.format(remainingSeconds)}`
  }

  return second.format(remainingSeconds)
}

export function formatIncidentTimestamp(
  timestamp: number,
  now = new Date(),
): string {
  const { dateTime, time } = getLocaleFormatters()
  const date = new Date(timestamp)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)

  if (date >= todayStart) {
    return t('time_today_at', time.format(date))
  }

  if (date >= yesterdayStart) {
    return t('time_yesterday_at', time.format(date))
  }

  return dateTime.format(date)
}

export function formatPercent(value: number): string {
  const { percentFraction, percentWhole } = getLocaleFormatters()

  return Number.isInteger(value)
    ? percentWhole.format(value / 100)
    : percentFraction.format(value / 100)
}

export function formatResponseTime(responseTime: number): string {
  return getLocaleFormatters().millisecond.format(responseTime)
}

export function formatTimeRange(startTimestamp: number, endTimestamp: number): string {
  const { time } = getLocaleFormatters()
  const start = time.format(new Date(startTimestamp))
  const end = time.format(new Date(endTimestamp))

  return start === end ? start : `${start} - ${end}`
}

export function formatCheckInterval(intervalSeconds: number): string {
  const { minute, second } = getLocaleFormatters()

  if (intervalSeconds < 60) {
    return second.format(intervalSeconds)
  }

  return minute.format(intervalSeconds / 60)
}
