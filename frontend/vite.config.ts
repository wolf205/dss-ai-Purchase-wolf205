import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/recharts/')) {
              return 'vendor-recharts';
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-query';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            if (
              id.includes('node_modules/axios/') ||
              id.includes('node_modules/sonner/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/')
            ) {
              return 'vendor-utils';
            }
          },
        },
      },
    },
  }
})
