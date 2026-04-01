import { useCallback, useMemo, useRef } from 'react'

import { setStorageValues } from '../lib/storage'

// NOTE: This hook intentionally reads and writes chrome.storage.local directly from the popup,
// without routing through the background service worker. This is an explicit exception to the
// architecture rule that popup code must not write to chrome.storage.local directly.
//
// Justification: form drafts are transient UI state, not business data. They are never read
// by the background worker, are keyed with a dedicated prefix to avoid collisions, and are
// cleaned up immediately after a successful save. Routing them through the message bus would
// add unnecessary latency and complexity with no benefit.
//
// All business-data writes (monitors, settings, incidents) still go through the background.

const FORM_DRAFT_KEY_PREFIX = 'formDraft'

// Generic hook for persisting form state as a draft in chrome.storage.local.
// The draft is keyed by `draftKey` so multiple independent forms can coexist.
// Call `saveDraft(value)` on field changes and `clearDraft()` on successful save.
export function useFormDraft<T extends object>(draftKey: string): {
  loadDraft: () => Promise<T | null>
  saveDraft: (value: T) => void
  clearDraft: () => void
} {
  const storageKey = useMemo(
    () => `${FORM_DRAFT_KEY_PREFIX}:${draftKey}`,
    [draftKey],
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadDraft = useCallback(async (): Promise<T | null> => {
    const result = await chrome.storage.local.get(storageKey)
    const raw = result[storageKey]

    if (raw === null || raw === undefined || typeof raw !== 'object') {
      return null
    }

    return raw as T
  }, [storageKey])

  const saveDraft = useCallback(
    (value: T) => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        void setStorageValues({ [storageKey]: value })
      }, 300)
    },
    [storageKey],
  )

  const clearDraft = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    void chrome.storage.local.remove(storageKey)
  }, [storageKey])

  return { loadDraft, saveDraft, clearDraft }
}
