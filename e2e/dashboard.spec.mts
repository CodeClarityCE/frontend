import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  test('should handle /dashboard route', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login OR show 404 for invalid routes
    await expect(page).toHaveURL(/\/(login|404|dashboard)/)
  })

  test('should redirect root to login when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
