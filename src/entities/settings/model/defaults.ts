import { DEFAULT_PING_URL } from '@shared/constants'

import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  defaultInterval: 60,
  pingUrl: DEFAULT_PING_URL,
}
