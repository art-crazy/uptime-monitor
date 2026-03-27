import { crx, defineManifest } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import type { MinifyOptions } from 'terser'
import { defineConfig } from 'vite'

const manifest = defineManifest({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_ext_name__',
  short_name: '__MSG_ext_short_name__',
  description: '__MSG_ext_description__',
  version: '1.0.0',
  minimum_chrome_version: '120',
  action: {
    default_title: '__MSG_ext_action_title__',
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

const terserOptions: MinifyOptions = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2,
  },
  format: {
    comments: false,
  },
  mangle: {
    safari10: true,
  },
}

export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    terserOptions,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  plugins: [react(), crx({ manifest })],
})
