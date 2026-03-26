import { type CheckInterval } from '../../../entities/monitor'

import type { MonitorFormDraft } from './types'

export interface MonitorFormState {
  interval: CheckInterval
  type: MonitorFormDraft['type']
  url: string
}

export function getInitialMonitorFormState(
  defaultInterval: CheckInterval,
  monitor?: MonitorFormDraft,
): MonitorFormState {
  return {
    type: monitor?.type ?? 'website',
    url: monitor?.url ?? '',
    interval: monitor?.interval ?? defaultInterval,
  }
}
