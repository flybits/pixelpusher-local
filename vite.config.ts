import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Demo app: output to `dist-app/` so `dist/` is reserved for the npm library bundle.
// GitHub project Pages serves at /<repository-name>/; use `/` only during `vite dev`.
const pagesBase = '/pixelpusher-local/'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : pagesBase,
  server: {
    port: 5530,
  },
  build: {
    outDir: 'dist-app',
    // Broader than `es2023` default so GitHub Pages visitors on slightly older browsers still run the demo.
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
}))
