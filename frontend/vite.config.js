import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  define: {
    'process.env.ROUTER_FUTURE_v7_startTransition': 'true',
    'process.env.ROUTER_FUTURE_v7_relativeSplatPath': 'true'
  }
})
