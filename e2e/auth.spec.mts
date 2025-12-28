import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/auth.page.mjs'

test.describe('Authentication E2E Tests', () => {
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
  })

  test.describe('Login Page', () => {
    test('should display login form', async () => {
      await authPage.goto()
      await authPage.expectFormVisible()
    })

    test('should have correct page title', async ({ page }) => {
      await authPage.goto()
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    })

    test('should show validation errors for empty form submission', async () => {
      await authPage.goto()
      await authPage.expectFormVisible()

      // Click submit without filling form
      await authPage.loginButton.click()

      // Should show validation messages (vee-validate)
      await authPage.expectValidationMessage()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await authPage.goto()

      await authPage.emailInput.fill('invalid-email')
      await authPage.emailInput.blur()

      // Wait for validation message
      await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show validation error for short password', async ({ page }) => {
      await authPage.goto()

      await authPage.passwordInput.fill('short')
      await authPage.passwordInput.blur()

      // Password validation requires at least 10 characters
      await expect(page.getByText(/at least|too short|minimum/i)).toBeVisible({ timeout: 5000 })
    })

    test('should accept valid form inputs', async () => {
      await authPage.goto()

      await authPage.emailInput.fill('test@example.com')
      await authPage.passwordInput.fill('ValidPassword123!')

      // Form should be submittable (button not disabled)
      await expect(authPage.loginButton).toBeEnabled()
    })
  })

  test.describe('Login Flow', () => {

    test('should display error message on failed login', async ({ page }) => {
      await authPage.goto()

      // Mock failed auth response
      await page.route('**/api/v1/auth/login', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error_code: 'WrongCredentials',
            message: 'Wrong credentials'
          })
        })
      )

      await authPage.login('wrong@example.com', 'WrongPassword123!')

      // Should show error message (either in alert or text)
      await expect(
        page.getByText(/wrong|invalid|error/i).first()
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through form fields', async ({ page }) => {
      await authPage.goto()

      // Focus on email input
      await authPage.emailInput.focus()
      await expect(authPage.emailInput).toBeFocused()

      // Tab to password
      await page.keyboard.press('Tab')
      await expect(authPage.passwordInput).toBeFocused()

      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(authPage.loginButton).toBeFocused()
    })

    test('should allow Enter key in password field', async ({ page }) => {
      await authPage.goto()

      await authPage.emailInput.fill('test@example.com')
      await authPage.passwordInput.fill('ValidPassword123!')

      // Verify Enter key is accepted (doesn't throw)
      await authPage.passwordInput.press('Enter')

      // Form should respond (either submit or show loading/error)
      // Just verify page didn't crash
      await expect(authPage.emailInput).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await authPage.goto()

      await authPage.expectFormVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await authPage.goto()

      await authPage.expectFormVisible()
    })
  })
})
