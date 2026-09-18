import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['rocky-irritant-pointless.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:5106',
        changeOrigin: true,
      },
    },
  },
})