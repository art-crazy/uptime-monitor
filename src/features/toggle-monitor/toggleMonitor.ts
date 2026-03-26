import { requestToggleMonitor } from '../../shared/lib/runtime'

export async function toggleMonitor(monitorId: string): Promise<void> {
  await requestToggleMonitor(monitorId)
}
