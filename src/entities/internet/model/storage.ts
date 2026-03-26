import type { InternetStatus } from './types'

export const DEFAULT_INTERNET_STATUS: InternetStatus = {
  online: false,
  pingMs: null,
  lastChecked: 0,
}
