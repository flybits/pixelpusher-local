import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest-setup-canvas.ts'],
    include: ['src/**/*.test.ts'],
    deps: {
      interopDefault: false,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/demo.ts',
        '**/*.scss',
        '**/assets/**',
        'vitest-setup-canvas.ts',
      ],
    },
  },
})
