import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          ...(configDefaults.coverage?.exclude || []),
          'tests/**',
          'e2e/**',
          'src/**/*.stories.ts',
          'src/**/*.d.ts',
          'cypress/**'
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80
        }
      },
      globals: true,
      isolate: true,
      testTimeout: 10000,
      hookTimeout: 10000
    }
  })
)
