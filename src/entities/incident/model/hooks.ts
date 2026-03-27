import { STORAGE_KEYS } from '@shared/constants'
import { useStorageValue } from '@shared/hooks/useStorageValue'
import { incidentsSchema, type Incident } from './types'

const EMPTY_INCIDENTS: Incident[] = []

export function useIncidents(): { incidents: Incident[]; isLoaded: boolean } {
  const { isLoaded, value } = useStorageValue<Incident[]>(
    STORAGE_KEYS.incidents,
    incidentsSchema,
    EMPTY_INCIDENTS,
  )

  return {
    incidents: value,
    isLoaded,
  }
}
