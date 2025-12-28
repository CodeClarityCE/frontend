import { test, expect } from '@playwright/test'

test.describe('Analysis E2E Tests', () => {
  test('should handle analysis route', async ({ page }) => {
    await page.goto('/projects/test-project/analyses')

    // Should redirect to login OR show 404 for unknown routes
    await expect(page).toHaveURL(/\/(login|404)/)
  })
})
