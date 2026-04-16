import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Demo app: output to `dist-app/` so `dist/` is reserved for the npm library bundle.
export default defineConfig({
  server: {
    port: 5530,
  },  
  build: {
    outDir: 'dist-app',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
