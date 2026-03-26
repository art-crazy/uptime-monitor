import { STORAGE_KEYS } from '../../../shared/constants'
import { getStorageValue } from '../../../shared/lib/storage'

import { monitorsSchema, type Monitor } from './types'

export async function getMonitors(): Promise<Monitor[]> {
  return getStorageValue(STORAGE_KEYS.monitors, monitorsSchema, [])
}
