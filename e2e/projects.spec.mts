import { test, expect } from '@playwright/test'

test.describe('Projects E2E Tests', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/projects')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect project details to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/some-project-id')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
