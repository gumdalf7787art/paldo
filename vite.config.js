import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    minify: false,
    cssMinify: false,
    sourcemap: true,
    rollupOptions: {
      // onwarn 생략하여 경고가 콘솔에 출력되게 함
    }
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
