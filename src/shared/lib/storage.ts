import { z } from 'zod'

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

export async function getStorageValue<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<T> {
  const result = await chrome.storage.local.get(key)
  const parsed = schema.safeParse(result[key])

  if (parsed.success) {
    return parsed.data
  }

  return cloneValue(fallback)
}

export async function setStorageValues(
  values: Record<string, unknown>,
): Promise<void> {
  await chrome.storage.local.set(values)
}

export function parseStorageChangeValue<T>(
  change: chrome.storage.StorageChange | undefined,
  schema: z.ZodType<T>,
): T | null {
  if (!change) {
    return null
  }

  const parsed = schema.safeParse(change.newValue)
  return parsed.success ? parsed.data : null
}

export function subscribeToStorageKeys(
  keys: readonly string[],
  onChange: (changes: Record<string, chrome.storage.StorageChange>) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'local') {
      return
    }

    if (keys.some((key) => key in changes)) {
      onChange(changes)
    }
  }

  chrome.storage.onChanged.addListener(listener)

  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
