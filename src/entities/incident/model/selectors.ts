import type { Incident } from './types'

export function countIncidentsInRange(
  incidents: Incident[],
  range: { end: number; start: number } | null,
): number {
  if (range === null) {
    return 0
  }

  return incidents.filter((incident) => {
    const incidentEnd = incident.endTime ?? range.end
    return incident.startTime < range.end && incidentEnd >= range.start
  }).length
}
