import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    reporters: ['verbose'],
    fileParallelism: false,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
})
