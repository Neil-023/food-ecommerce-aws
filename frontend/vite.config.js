import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || env.VITE_API_URL
  const basePath = env.VITE_BASE_PATH || '/'

  return {
    base: basePath,
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: [
        'foodhub.mooo.com'
      ],
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
      port: 5173,
      watch: {
        usePolling: true,
      },
    },
  }
})