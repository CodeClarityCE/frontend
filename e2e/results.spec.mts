import { test, expect } from '@playwright/test'

test.describe('Results E2E Tests', () => {
  test('should handle results route', async ({ page }) => {
    await page.goto('/projects/test-project/analyses/test-analysis/results')

    // Should redirect to login OR show 404 for unknown routes
    await expect(page).toHaveURL(/\/(login|404)/)
  })
})
