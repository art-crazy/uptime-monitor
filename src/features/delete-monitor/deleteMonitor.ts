import { requestDeleteMonitor } from '@shared/lib/runtime'

export async function deleteMonitor(monitorId: string): Promise<void> {
  await requestDeleteMonitor(monitorId)
}
