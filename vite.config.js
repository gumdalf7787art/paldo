import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    minify: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // 빌드가 다운되는 것을 방지하기 위해 과도한 경고 출력을 억제합니다.
        return;
      }
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
