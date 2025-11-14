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
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/services/frontend/**',
    ],
  },
})
