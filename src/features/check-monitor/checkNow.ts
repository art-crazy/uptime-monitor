import { requestMonitorCheck } from '../../shared/lib/runtime'

export async function checkNow(monitorId: string): Promise<void> {
  await requestMonitorCheck(monitorId)
}
