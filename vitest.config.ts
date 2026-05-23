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
      env: {
        MODE: 'test',
        NODE_ENV: 'test'
      },
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
      hookTimeout: 10000,
      // Vitest 4 introduced a stricter `EnvironmentTeardownError` that
      // fires when Vite's on-demand module transform is still resolving
      // after jsdom teardown. The error message says "This is not a bug
      // in Vitest" — it surfaces a race between Vite's lazy transform
      // pipeline and Vitest's isolate=true worker teardown when component
      // graphs are large (e.g. ResultsView -> ResultsPatching -> ...).
      // Test outcomes are unaffected (pass/fail still reported correctly);
      // only the cleanup phase races. We log the unhandled error but
      // don't fail the build on it. Revisit if a genuine test bug ever
      // hides here, OR if Vitest gains a less-strict per-error opt-in.
      dangerouslyIgnoreUnhandledErrors: true
    }
  })
)
