// Basic dashboard test - replaced by comprehensive dashboard-flow.cy.ts
// This file is kept for backward compatibility

describe('Dashboard Basic Test', () => {
  beforeEach(() => {
    cy.login()
  })
  
  it('should be accessible', () => {
    cy.visit('/')
    cy.checkA11y()
  })

  it('should have the correct page title', () => {
    cy.visit('/')
    cy.get('h3').should('contain', 'Vulnerability Exposure Overview')
  })
  
  it('should redirect to comprehensive dashboard tests', () => {
    // Note: See dashboard-flow.cy.ts for comprehensive dashboard testing
    cy.visit('/dashboard')
    cy.getByCy('dashboard-header').should('exist')
  })
})