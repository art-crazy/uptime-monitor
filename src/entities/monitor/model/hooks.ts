import { STORAGE_KEYS } from '@shared/constants'
import { useStorageValue } from '@shared/hooks/useStorageValue'
import { monitorsSchema, type Monitor } from './types'

const EMPTY_MONITORS: Monitor[] = []

export function useMonitors(): { isLoaded: boolean; monitors: Monitor[] } {
  const { isLoaded, value } = useStorageValue<Monitor[]>(
    STORAGE_KEYS.monitors,
    monitorsSchema,
    EMPTY_MONITORS,
  )

  return {
    isLoaded,
    monitors: value,
  }
}
