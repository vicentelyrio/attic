import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = (p: string) => fileURLToPath(new URL(`src/${p}`, import.meta.url))

// Single source of truth for the version shown in the UI — bump package.json
// (and Cargo.toml, which names the released binary) and this follows.
const { version } = JSON.parse(
  readFileSync(new URL('package.json', import.meta.url), 'utf8'),
)

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': src(''),
      '@domain': src('domain'),
      '@features': src('features'),
      '@i18n': src('i18n'),
      '@infrastructure': src('infrastructure'),
      '@templates': src('templates'),
      '@theme': src('theme'),
    },
  },
  server: {
    // Forward API calls to the Rust backend in dev. The frontend always talks
    // to a same-origin "/api" — no CORS — which mirrors production, where the
    // SPA is embedded in the Rust binary and served from the same origin.
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
