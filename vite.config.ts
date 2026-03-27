import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import prerender from './scripts/vite-plugin-prerender.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    prerender({
      distDir: 'dist'
    })
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
