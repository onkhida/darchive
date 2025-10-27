import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['gray-matter', 'buffer']
  },
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  }
})
