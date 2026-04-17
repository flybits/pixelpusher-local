import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  publicDir: false,
  plugins: [
    dts({
      include: ['src/pixel-pusher.ts'],
      // Rollup merge can drop the class export for decorated Lit components; per-file emit keeps `PixelPusher`.
      rollupTypes: false,
    }),
  ],
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/pixel-pusher.ts'),
      formats: ['es'],
      fileName: 'pixel-pusher',
    },
    rollupOptions: {
      // Lit and cropperjs stay importable from node_modules; vite.lib.bundle.config.ts inlines both.
      external: (id) =>
        id === 'lit' ||
        id.startsWith('lit/') ||
        id === 'cropperjs' ||
        id.startsWith('cropperjs/'),
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
