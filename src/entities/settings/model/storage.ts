import { STORAGE_KEYS } from '../../../shared/constants'
import { getStorageValue } from '../../../shared/lib/storage'

import { DEFAULT_SETTINGS } from './defaults'
import { settingsSchema, type Settings } from './types'

export async function getSettings(): Promise<Settings> {
  return getStorageValue(STORAGE_KEYS.settings, settingsSchema, DEFAULT_SETTINGS)
}
