import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server config.
  // The proxy below will be enabled in Phase 3 to forward API calls to FastAPI.
  // Uncomment it when the backend is running.
  //
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})
