import type { MonitorType } from '../../../entities/monitor'
import { normalizeMonitorTarget } from '../../../entities/monitor'

export function validateMonitorInput(value: string, type: MonitorType) {
  const normalized = normalizeMonitorTarget(value, type)

  if (!normalized) {
    return {
      error:
        type === 'host'
          ? 'Enter a valid host, IP, or HTTP/HTTPS URL'
          : 'Enter a valid http or https URL',
      normalized: null,
    }
  }

  return {
    error: null,
    normalized,
  }
}
