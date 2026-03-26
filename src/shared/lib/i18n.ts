import {
  DEFAULT_MESSAGES,
  MESSAGE_KEYS,
  type MessageKey,
} from './i18n.generated'

export type TranslationKey = MessageKey
export type TranslationSubstitution = number | string

const MESSAGE_KEY_SET = new Set<string>(MESSAGE_KEYS)

function normalizeSubstitutions(
  substitutions?: TranslationSubstitution | readonly TranslationSubstitution[],
): string[] {
  if (substitutions === undefined) {
    return []
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions]
  return values.map((value) => String(value))
}

function applySubstitutions(message: string, substitutions: readonly string[]): string {
  return substitutions.reduce(
    (currentMessage, substitution, index) =>
      currentMessage.replaceAll(`$${index + 1}`, substitution),
    message,
  )
}

function getChromeI18nApi(): typeof chrome.i18n | null {
  if (typeof chrome === 'undefined' || typeof chrome.i18n?.getMessage !== 'function') {
    return null
  }

  return chrome.i18n
}

export function isTranslationKey(value: string): value is TranslationKey {
  return MESSAGE_KEY_SET.has(value)
}

export function t(
  key: TranslationKey,
  substitutions?: TranslationSubstitution | readonly TranslationSubstitution[],
): string {
  const normalizedSubstitutions = normalizeSubstitutions(substitutions)
  const chromeI18n = getChromeI18nApi()

  if (chromeI18n) {
    const message =
      normalizedSubstitutions.length > 0
        ? chromeI18n.getMessage(key, normalizedSubstitutions)
        : chromeI18n.getMessage(key)

    if (message) {
      return message
    }
  }

  return applySubstitutions(DEFAULT_MESSAGES[key], normalizedSubstitutions)
}

export function translateDynamicKey(value: string): string {
  return isTranslationKey(value) ? t(value) : value
}

export function getRuntimeLocale(): string | undefined {
  const chromeI18n = getChromeI18nApi()

  if (chromeI18n && typeof chromeI18n.getUILanguage === 'function') {
    return chromeI18n.getUILanguage()
  }

  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language
  }

  return undefined
}
