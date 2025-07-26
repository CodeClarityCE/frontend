// Basic sign in test - replaced by comprehensive auth-flow.cy.ts
// This file is kept for backward compatibility

describe('Sign In Basic Test', () => {
  it('should display sign in page', () => {
    cy.visit('/')
    cy.contains('h1', 'Sign In')
    
    // Basic form elements should be present
    cy.getByCy('email-input').should('exist')
    cy.getByCy('password-input').should('exist')
    cy.getByCy('login-submit').should('exist')
  })
  
  it('should redirect to comprehensive auth flow tests', () => {
    // Note: See auth-flow.cy.ts for comprehensive authentication testing
    cy.visit('/login')
    cy.get('form').should('be.visible')
  })
})
