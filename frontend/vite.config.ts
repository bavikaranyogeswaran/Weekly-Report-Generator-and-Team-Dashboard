import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    // '@/' maps to 'src/' so imports stay short: '@/stores/auth' instead of '../../stores/auth'
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Read PORT from the environment so preview tools and CI can control it
    port: parseInt(process.env.PORT ?? '5173'),
    strictPort: false,
  },
})
