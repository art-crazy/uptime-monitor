import type { MonitorType } from '../../../entities/monitor'
import { normalizeMonitorTarget } from '../../../entities/monitor'

type MonitorValidationErrorKey =
  | 'add_monitor_error_invalid_host'
  | 'add_monitor_error_invalid_url'

interface MonitorValidationResult {
  errorKey: MonitorValidationErrorKey | null
  normalized: string | null
}

export function validateMonitorInput(
  value: string,
  type: MonitorType,
): MonitorValidationResult {
  const normalized = normalizeMonitorTarget(value, type)

  if (!normalized) {
    return {
      errorKey:
        type === 'host'
          ? 'add_monitor_error_invalid_host'
          : 'add_monitor_error_invalid_url',
      normalized: null,
    }
  }

  return {
    errorKey: null,
    normalized,
  }
}
