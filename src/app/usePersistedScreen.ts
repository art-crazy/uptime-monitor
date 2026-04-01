import { useCallback, useEffect, useState } from 'react'

// NOTE: This hook reads and writes chrome.storage.session directly from the popup.
// Screen state is pure UI navigation state, not business data, so routing it through
// the background service worker would be unnecessary. chrome.storage.session is used
// instead of chrome.storage.local because it resets when the browser session ends,
// which is the correct lifetime for "remember where I was" navigation state.

const SESSION_STORAGE_KEY = 'activeScreen'

export type Screen =
  | { key: 'dashboard' }
  | { key: 'settings' }
  | { key: 'details'; monitorId: string }
  | { key: 'add'; monitorId?: string }

const INITIAL_SCREEN: Screen = { key: 'dashboard' }

function isValidScreen(value: unknown): value is Screen {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  if (obj.key === 'dashboard' || obj.key === 'settings') {
    return true
  }

  if (obj.key === 'details' && typeof obj.monitorId === 'string' && obj.monitorId.length > 0) {
    return true
  }

  if (obj.key === 'add') {
    return obj.monitorId === undefined || typeof obj.monitorId === 'string'
  }

  return false
}

async function loadScreen(): Promise<Screen> {
  try {
    const result = await chrome.storage.session.get(SESSION_STORAGE_KEY)
    const raw = result[SESSION_STORAGE_KEY]

    if (isValidScreen(raw)) {
      return raw
    }
  } catch {
    // session storage unavailable — fall back to dashboard
  }

  return INITIAL_SCREEN
}

async function persistScreen(screen: Screen): Promise<void> {
  try {
    await chrome.storage.session.set({ [SESSION_STORAGE_KEY]: screen })
  } catch {
    // session storage unavailable — ignore
  }
}

// Persists the active screen across popup open/close using chrome.storage.session.
// Returns [screen, navigate] with the same API as useState<Screen>.
// On first render screen is 'dashboard'; it updates once session storage is read.
export function usePersistedScreen(): [Screen, (screen: Screen) => void] {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)

  useEffect(() => {
    void loadScreen().then((loaded) => {
      if (loaded.key !== 'dashboard') {
        setScreen(loaded)
      }
    })
  }, [])

  const navigate = useCallback((nextScreen: Screen) => {
    setScreen(nextScreen)
    void persistScreen(nextScreen)
  }, [])

  return [screen, navigate]
}
