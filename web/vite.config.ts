import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Rust backend in dev. The frontend always talks
    // to a same-origin "/api" — no CORS — which mirrors production, where the
    // SPA is embedded in the Rust binary and served from the same origin.
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
})
