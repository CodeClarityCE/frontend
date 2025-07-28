describe('Authentication Flow E2E Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Sign In Process', () => {
    it('should successfully sign in with valid credentials', () => {
      cy.fixture('auth.json').then((auth) => {
        // Visit sign in page
        cy.visit('/login')
        cy.contains('h1', 'Sign In').should('be.visible')
        
        // Fill form
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        
        // Submit form
        cy.getByCy('login-submit').click()
        
        // Verify successful login
        cy.url().should('not.include', '/login')
        cy.getByCy('user-nav').should('be.visible')
        cy.url().should('include', '/dashboard')
      })
    })

    it('should show error for invalid credentials', () => {
      cy.fixture('auth.json').then((auth) => {
        cy.visit('/login')
        
        // Fill with invalid credentials
        cy.getByCy('email-input').type(auth.invalidUser.email)
        cy.getByCy('password-input').type(auth.invalidUser.password)
        cy.getByCy('login-submit').click()
        
        // Verify error message
        cy.getByCy('auth-error').should('be.visible')
        cy.getByCy('auth-error').should('contain', 'Invalid credentials')
        cy.url().should('include', '/login')
      })
    })

    it('should validate form fields', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.getByCy('login-submit').click()
      
      // Check validation messages
      cy.getByCy('email-error').should('be.visible')
      cy.getByCy('password-error').should('be.visible')
      
      // Test invalid email format
      cy.getByCy('email-input').type('invalid-email')
      cy.getByCy('email-input').blur()
      cy.getByCy('email-error').should('contain', 'Invalid email')
      
      // Test short password
      cy.getByCy('password-input').type('short')
      cy.getByCy('password-input').blur()
      cy.getByCy('password-error').should('contain', 'at least 10 character')
    })

    it('should support keyboard navigation', () => {
      cy.visit('/login')
      
      // Test tab navigation
      cy.testKeyboardNavigation('email-input', [
        'password-input',
        'login-submit',
        'google-auth-button',
        'github-auth-button'
      ])
      
      // Test Enter key submission
      cy.fixture('auth.json').then((auth) => {
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        cy.getByCy('password-input').realPress('Enter')
        
        cy.url().should('not.include', '/login')
      })
    })

    it('should be accessible', () => {
      cy.visit('/login')
      cy.checkA11y()
    })
  })

  describe('Social Authentication', () => {
    it('should initiate Google OAuth flow', () => {
      cy.visit('/login')
      
      // Mock OAuth window
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
      })
      
      cy.getByCy('google-auth-button').click()
      
      // Verify OAuth window is opened
      cy.get('@windowOpen').should('have.been.calledWith', 
        Cypress.sinon.match(/google\.com.*oauth/), 
        'oauth',
        Cypress.sinon.match.any
      )
    })

    it('should initiate GitHub OAuth flow', () => {
      cy.visit('/login')
      
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
      })
      
      cy.getByCy('github-auth-button').click()
      
      cy.get('@windowOpen').should('have.been.calledWith', 
        Cypress.sinon.match(/github\.com.*oauth/), 
        'oauth',
        Cypress.sinon.match.any
      )
    })
  })

  describe('Sign Out Process', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should successfully log out', () => {
      cy.getByCy('user-nav').click()
      cy.getByCy('logout-button').click()
      
      // Verify redirect to login
      cy.url().should('include', '/login')
      cy.getByCy('user-nav').should('not.exist')
    })

    it('should clear user session data', () => {
      cy.logout()
      
      // Try to access protected route
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
      
      // Verify local storage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.be.null
      })
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email', () => {
      cy.visit('/login')
      cy.getByCy('forgot-password-link').click()
      
      cy.url().should('include', '/password-reset')
      cy.getByCy('email-input').type('test@example.com')
      cy.getByCy('reset-submit').click()
      
      cy.getByCy('reset-success-message').should('be.visible')
      cy.getByCy('reset-success-message').should('contain', 'reset link sent')
    })

    it('should validate email for password reset', () => {
      cy.visit('/password-reset')
      
      cy.getByCy('reset-submit').click()
      cy.getByCy('email-error').should('be.visible')
      
      cy.getByCy('email-input').type('invalid-email')
      cy.getByCy('email-input').blur()
      cy.getByCy('email-error').should('contain', 'Invalid email')
    })
  })

  describe('Session Management', () => {
    it('should handle session expiration', () => {
      cy.login()
      
      // Mock expired token API response
      cy.mockApiError('GET', '/api/user/profile', 401, 'Token expired')
      
      // Try to access a protected resource
      cy.visit('/settings')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.getByCy('session-expired-message').should('be.visible')
    })

    it('should refresh token automatically', () => {
      cy.login()
      
      // Mock token refresh
      cy.fixture('auth.json').then((auth) => {
        cy.mockApi('POST', '/api/auth/refresh', {
          access_token: auth.tokens.accessToken,
          refresh_token: auth.tokens.refreshToken
        })
      })
      
      // Simulate token near expiration
      cy.setLocalStorage('token_expires', (Date.now() + 60000).toString())
      
      // Navigate to trigger refresh
      cy.visit('/dashboard')
      
      // Verify token was refreshed
      cy.wait('@apiPOSTapiauthrefresh')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Loading States and Error Handling', () => {
    it('should show loading state during authentication', () => {
      cy.visit('/login')
      
      // Delay the auth request
      cy.intercept('POST', '/api/auth/login', {
        delay: 2000,
        statusCode: 200,
        body: { success: true }
      }).as('slowLogin')
      
      cy.fixture('auth.json').then((auth) => {
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        cy.getByCy('login-submit').click()
        
        // Verify loading state
        cy.getByCy('login-loading').should('be.visible')
        cy.getByCy('login-submit').should('be.disabled')
        
        cy.wait('@slowLogin')
        cy.getByCy('login-loading').should('not.exist')
      })
    })

    it('should handle network errors gracefully', () => {
      cy.visit('/login')
      
      // Mock network failure
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('networkError')
      
      cy.fixture('auth.json').then((auth) => {
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        cy.getByCy('login-submit').click()
        
        cy.wait('@networkError')
        cy.getByCy('network-error').should('be.visible')
        cy.getByCy('network-error').should('contain', 'connection')
      })
    })

    it('should allow retry after error', () => {
      cy.visit('/login')
      
      // First attempt fails
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('serverError')
      
      cy.fixture('auth.json').then((auth) => {
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        cy.getByCy('login-submit').click()
        
        cy.wait('@serverError')
        cy.getByCy('server-error').should('be.visible')
        
        // Mock successful retry
        cy.intercept('POST', '/api/auth/login', {
          statusCode: 200,
          body: { success: true, token: auth.tokens.accessToken }
        }).as('successfulLogin')
        
        // Retry
        cy.getByCy('login-submit').click()
        cy.wait('@successfulLogin')
        cy.url().should('not.include', '/login')
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile viewports', () => {
      cy.viewport('iphone-x')
      cy.visit('/login')
      
      // Verify mobile layout
      cy.getByCy('mobile-login-form').should('be.visible')
      cy.getByCy('email-input').should('be.visible')
      cy.getByCy('password-input').should('be.visible')
      
      // Test mobile form submission
      cy.fixture('auth.json').then((auth) => {
        cy.getByCy('email-input').type(auth.validUser.email)
        cy.getByCy('password-input').type(auth.validUser.password)
        cy.getByCy('login-submit').click()
        
        cy.url().should('not.include', '/login')
      })
    })

    it('should handle tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.visit('/login')
      
      cy.getByCy('login-form').should('be.visible')
      cy.checkA11y()
    })
  })
});