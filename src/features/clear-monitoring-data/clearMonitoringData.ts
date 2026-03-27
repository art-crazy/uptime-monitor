import { requestClearAllMonitoringData } from '@shared/lib/runtime'

export async function clearAllMonitoringData(): Promise<void> {
  await requestClearAllMonitoringData()
}
