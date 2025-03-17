describe('Dashboard page', () => {
	
  beforeEach(() => {
    cy.login()
  })
	
  it('should actually be accessible', () => {
    cy.visit('/')
  })

  it('should have the correct page title', () => {
    cy.visit('/')
    cy.get('h3').should('contain', 'Vulnerability Exposure Overview')
  })
  
})