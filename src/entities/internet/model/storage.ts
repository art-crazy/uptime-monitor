import { STORAGE_KEYS } from '../../../shared/constants'
import { getStorageValue } from '../../../shared/lib/storage'

import { internetStatusSchema, type InternetStatus } from './types'

export const DEFAULT_INTERNET_STATUS: InternetStatus = {
  online: false,
  pingMs: null,
  lastChecked: 0,
}

export async function getInternetStatus(): Promise<InternetStatus> {
  return getStorageValue(STORAGE_KEYS.internetStatus, internetStatusSchema, DEFAULT_INTERNET_STATUS)
}
