import { type CheckInterval, type MonitorType } from '../../../entities/monitor'

export interface MonitorFormDraft {
  id?: string
  interval: CheckInterval
  type: MonitorType
  url: string
}
