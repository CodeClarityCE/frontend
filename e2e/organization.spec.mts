import { test, expect } from '@playwright/test'

test.describe('Organization E2E Tests', () => {
  test('should handle organization route', async ({ page }) => {
    await page.goto('/organizations/test-org/settings')

    // Should redirect to login OR show 404 for unknown routes
    await expect(page).toHaveURL(/\/(login|404)/)
  })
})
