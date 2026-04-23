import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Demo app: output to `dist-app/` so `dist/` is reserved for the npm library bundle.
// `base: './'` keeps asset URLs relative so the same build works at site root (dev, preview) and
// under any path (e.g. GitHub project Pages) without hardcoding the repo segment.
const demoProdBase = './'

export default defineConfig(({ command, mode }) => {
  const isViteDev = command === 'serve' && mode === 'development'

  return {
    base: isViteDev ? '/' : demoProdBase,
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
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Demo uses the published-style bundle. `build:demo` runs `build:lib` first so `dist/` exists; dev maps to source.
        '@flybits/pixelpusher/bundle': isViteDev
          ? fileURLToPath(new URL('./src/pixel-pusher.ts', import.meta.url))
          : fileURLToPath(new URL('./dist/pixel-pusher.bundle.js', import.meta.url)),
      },
    },
  }
})
