import { STORAGE_KEYS } from '@shared/constants'
import { useStorageValue } from '@shared/hooks/useStorageValue'

import { DEFAULT_INTERNET_STATUS } from './storage'
import { internetStatusSchema, type InternetStatus } from './types'

export function useInternetStatus(): {
  internetStatus: InternetStatus
  isLoaded: boolean
} {
  const { isLoaded, value } = useStorageValue<InternetStatus>(
    STORAGE_KEYS.internetStatus,
    internetStatusSchema,
    DEFAULT_INTERNET_STATUS,
  )

  return {
    internetStatus: value,
    isLoaded,
  }
}
