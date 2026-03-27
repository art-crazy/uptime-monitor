import type { Monitor } from '../../entities/monitor'

export interface MonitorStatusChangeNotificationEvent {
  checkedAt: number
  errorMessage: string | null
  eventId: string
  monitorId: string
  monitorName: string
  monitorUrl: string
  nextStatus: Extract<Monitor['status'], 'down' | 'online'>
  previousStatus: Monitor['status']
  responseTime: number | null
}
