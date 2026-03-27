import { DEFAULT_PING_URL } from '@shared/constants'

import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  notifications: {
    browser: {
      enabled: true,
    },
    telegram: {
      enabled: false,
      chatId: '',
      sendRecovery: true,
    },
  },
  defaultInterval: 60,
  pingUrl: DEFAULT_PING_URL,
}
