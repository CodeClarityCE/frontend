import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Authentication pages
 * Uses actual selectors from the CodeClarity Vue application
 */
export class AuthPage {
  readonly page: Page

  // Login form elements
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly authError: Locator
  readonly loginLoading: Locator

  // Form validation messages (vee-validate FormMessage)
  readonly formMessages: Locator

  constructor(page: Page) {
    this.page = page

    // Login form - using actual placeholders from UserAuthForm.vue
    this.emailInput = page.getByPlaceholder('Enter your email')
    this.passwordInput = page.getByPlaceholder('Enter your password')
    this.loginButton = page.getByRole('button', { name: 'Sign in' })

    // Error states - the app uses Alert component for errors
    this.authError = page.locator('[role="alert"]')
    this.loginLoading = page.getByText('Connecting')

    // Form validation messages from vee-validate
    this.formMessages = page.locator('[id$="-form-item-message"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async gotoPasswordReset() {
    await this.page.goto('/password-reset')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async loginWithValidCredentials() {
    await this.login('john.doe@codeclarity.io', 'ThisIs4Str0ngP4ssW0rd?')
  }

  async expectLoggedIn() {
    await expect(this.page).not.toHaveURL(/\/login/)
  }

  async expectLoggedOut() {
    await expect(this.page).toHaveURL(/\/login/)
  }

  async expectOnLoginPage() {
    await expect(this.loginButton).toBeVisible()
    await expect(this.emailInput).toBeVisible()
  }

  async expectFormVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.loginButton).toBeVisible()
  }

  async expectLoading() {
    await expect(this.loginLoading).toBeVisible()
  }

  async expectError() {
    await expect(this.authError).toBeVisible()
  }

  async expectValidationMessage() {
    await expect(this.formMessages.first()).toBeVisible()
  }
}
