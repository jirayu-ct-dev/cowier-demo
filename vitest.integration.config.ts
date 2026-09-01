import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: ['./tests/integration/global-setup.ts'],
    include: ['**/*.integration.test.ts'],
  },
})
