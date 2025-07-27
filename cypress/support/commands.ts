/// <reference types="cypress" />
/// <reference types="cypress-axe" />
/// <reference types="cypress-real-events" />

import 'cypress-axe'
import 'cypress-real-events'

// Authentication Commands
Cypress.Commands.add('login', (email?: string, password?: string) => {
  cy.fixture('user.json').then((user) => {
    const loginEmail = email || user.email
    const loginPassword = password || user.password
    
    cy.visit('/login')
    cy.getByCy('email-input').type(loginEmail)
    cy.getByCy('password-input').type(loginPassword)
    cy.getByCy('login-submit').click()
    
    // Wait for successful login redirect
    cy.url().should('not.include', '/login')
    cy.getByCy('user-nav').should('be.visible')
  })
})

Cypress.Commands.add('logout', () => {
  cy.getByCy('user-nav').click()
  cy.getByCy('logout-button').click()
  cy.url().should('include', '/login')
})

// Data Testing Commands
Cypress.Commands.add('getByCy', (selector: string, ...args: any[]) => {
  return cy.get(`[data-cy=${selector}]`, ...args)
})

Cypress.Commands.add('getByTestId', (selector: string, ...args: any[]) => {
  return cy.get(`[data-testid=${selector}]`, ...args)
})

// API Mocking Commands
Cypress.Commands.add('mockApi', (method: Cypress.HttpMethod, url: string, response: any, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as(`api${method}${url.replace(/[^a-zA-Z0-9]/g, '')}`)
})

Cypress.Commands.add('mockApiError', (method: Cypress.HttpMethod, url: string, statusCode = 500, message = 'Server Error') => {
  cy.intercept(method, url, {
    statusCode,
    body: { error: message }
  }).as(`apiError${method}${url.replace(/[^a-zA-Z0-9]/g, '')}`)
})

// Navigation Commands
Cypress.Commands.add('visitWithAuth', (url: string, user?: { email: string; password: string }) => {
  if (user) {
    cy.login(user.email, user.password)
  } else {
    cy.login()
  }
  cy.visit(url)
})

// Form Commands
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.getByCy(`${field}-input`).clear().type(value)
  })
})

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.getByCy(formSelector).submit()
})

// Table Commands
Cypress.Commands.add('getTableRow', (rowIndex: number) => {
  return cy.getByCy('data-table').find('tbody tr').eq(rowIndex)
})

Cypress.Commands.add('sortTableBy', (columnName: string) => {
  cy.getByCy(`sort-${columnName}`).click()
})

// Loading and Wait Commands
Cypress.Commands.add('waitForLoading', () => {
  cy.getByCy('loading-spinner').should('not.exist')
})

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.getByCy('loading-spinner').should('not.exist')
})

// Accessibility Commands
Cypress.Commands.add('checkPageA11y', (context?: string, options?: any) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

Cypress.Commands.add('testKeyboardNavigation', (startSelector: string, expectedSelectors: string[]) => {
  cy.getByCy(startSelector).focus()
  
  expectedSelectors.forEach((selector) => {
    cy.realPress('Tab')
    cy.getByCy(selector).should('have.focus')
  })
})

// File Upload Commands
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType = 'text/plain') => {
  cy.fixture(fileName).then(fileContent => {
    cy.getByCy(selector).selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName,
      mimeType: fileType
    })
  })
})

// Local Storage Commands
Cypress.Commands.add('setLocalStorage', (key: string, value: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, value)
  })
})

// clearLocalStorage is already a built-in Cypress command, no need to override

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible')
})

Cypress.Commands.add('shouldHaveText', { prevSubject: 'element' }, (subject, text: string) => {
  cy.wrap(subject).should('contain.text', text)
})

// Organization/Project specific commands
Cypress.Commands.add('createProject', (projectName: string) => {
  cy.visitWithAuth('/projects')
  cy.getByCy('create-project-button').click()
  cy.getByCy('project-name-input').type(projectName)
  cy.getByCy('create-project-submit').click()
  cy.getByCy('project-created-message').should('be.visible')
})

Cypress.Commands.add('selectOrganization', (orgName: string) => {
  cy.getByCy('organization-selector').click()
  cy.getByCy(`org-option-${orgName}`).click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      
      // Data attributes
      getByCy(selector: string, ...args: any[]): Chainable<JQuery<HTMLElement>>
      getByTestId(selector: string, ...args: any[]): Chainable<JQuery<HTMLElement>>
      
      // API mocking
      mockApi(method: Cypress.HttpMethod, url: string, response: any, statusCode?: number): Chainable<void>
      mockApiError(method: Cypress.HttpMethod, url: string, statusCode?: number, message?: string): Chainable<void>
      
      // Navigation
      visitWithAuth(url: string, user?: { email: string; password: string }): Chainable<void>
      
      // Forms
      fillForm(formData: Record<string, string>): Chainable<void>
      submitForm(formSelector?: string): Chainable<void>
      
      // Tables
      getTableRow(rowIndex: number): Chainable<JQuery<HTMLElement>>
      sortTableBy(columnName: string): Chainable<void>
      
      // Loading
      waitForLoading(): Chainable<void>
      waitForPageLoad(): Chainable<void>
      
      // Accessibility
      checkPageA11y(context?: string, options?: any): Chainable<void>
      testKeyboardNavigation(startSelector: string, expectedSelectors: string[]): Chainable<void>
      
      // File upload
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>
      
      // Local storage
      setLocalStorage(key: string, value: string): Chainable<void>
      // clearLocalStorage is a built-in Cypress command
      
      // Custom assertions
      shouldBeVisible(): Chainable<JQuery<HTMLElement>>
      shouldHaveText(text: string): Chainable<JQuery<HTMLElement>>
      
      // Application specific
      createProject(projectName: string): Chainable<void>
      selectOrganization(orgName: string): Chainable<void>
    }
  }
}

export {}
