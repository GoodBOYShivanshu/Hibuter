import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is a static SPA: no backend, all state lives in localStorage.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allows the sandbox preview host (https://<port>-<id>.e2b.app).
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
})
