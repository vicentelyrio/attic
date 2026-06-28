import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'

const src = (p: string) => fileURLToPath(new URL(`src/${p}`, import.meta.url))

export default defineConfig({
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
      '/api': 'http://127.0.0.1:3000',
    },
  },
})
