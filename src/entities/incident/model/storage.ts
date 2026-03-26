import { STORAGE_KEYS } from '../../../shared/constants'
import { getStorageValue } from '../../../shared/lib/storage'

import { incidentsSchema, type Incident } from './types'

export async function getIncidents(): Promise<Incident[]> {
  return getStorageValue(STORAGE_KEYS.incidents, incidentsSchema, [])
}

export function getActiveIncident(
  incidents: Incident[],
  monitorId: string,
): Incident | null {
  return incidents.find(
    (incident) => incident.monitorId === monitorId && incident.endTime === null,
  ) ?? null
}
