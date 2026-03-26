import { crx, defineManifest } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Uptime Monitor',
  short_name: 'Uptime Monitor',
  description:
    'Track uptime for websites, APIs, and servers with local checks and browser alerts.',
  version: '1.0.0',
  minimum_chrome_version: '120',
  action: {
    default_title: 'Uptime Monitor',
    default_popup: 'index.html',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'alarms', 'notifications'],
  host_permissions: ['<all_urls>'],
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})
