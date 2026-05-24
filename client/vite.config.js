import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // amazon-cognito-identity-js (and a few of its deps) reference `global`,
  // which doesn't exist in browsers. Aliasing it to `globalThis` keeps the
  // SDK from blowing up at import time and white-screening the app.
  define: { global: 'globalThis' },
  server: { port: 5173, host: true, open: true }
})
