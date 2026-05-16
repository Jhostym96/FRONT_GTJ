import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    sourcemap: false, // quita los mapas en producción (menos peso)
    chunkSizeWarningLimit: 1000, // evita warnings con bundles grandes
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'], // divide dependencias grandes en chunks
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
