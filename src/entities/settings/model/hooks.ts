import { STORAGE_KEYS } from '../../../shared/constants'
import { useStorageValue } from '../../../shared/hooks/useStorageValue'

import { DEFAULT_SETTINGS } from './defaults'
import { settingsSchema, type Settings } from './types'

export function useSettings(): { isLoaded: boolean; settings: Settings } {
  const { isLoaded, value } = useStorageValue(
    STORAGE_KEYS.settings,
    settingsSchema,
    DEFAULT_SETTINGS,
  )

  return {
    isLoaded,
    settings: value,
  }
}
