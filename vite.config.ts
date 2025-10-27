import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mdx from '@mdx-js/rollup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX support - handle .mdx files
    mdx({
      jsxImportSource: 'vue',
      // Configure MDX to work with Vue
      jsx: true,
      // Add any MDX plugins here
      remarkPlugins: [],
      rehypePlugins: []
    }),
    vue({
      // Include .mdx files in Vue processing
      include: [/\.vue$/, /\.mdx$/]
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
