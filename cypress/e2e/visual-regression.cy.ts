describe('Visual Regression Tests', () => {
  beforeEach(() => {
    // Set up consistent test environment
    cy.viewport(1280, 720)
    cy.clearLocalStorage()
  })

  describe('Authentication Pages', () => {
    it('should capture login page variations', () => {
      cy.visit('/login')
      
      // Basic login page
      cy.percySnapshot('Login Page - Initial State')
      
      // With validation errors
      cy.getByCy('login-submit').click()
      cy.percySnapshot('Login Page - Validation Errors')
      
      // With filled form
      cy.getByCy('email-input').type('test@example.com')
      cy.getByCy('password-input').type('testpassword123')
      cy.percySnapshot('Login Page - Filled Form')
      
      // Mobile view
      cy.viewport(375, 667) // iPhone dimensions
      cy.percySnapshot('Login Page - Mobile')
      
      // Tablet view
      cy.viewport(768, 1024) // iPad dimensions
      cy.percySnapshot('Login Page - Tablet')
    })

    it('should capture password reset page', () => {
      cy.visit('/password-reset')
      
      cy.percySnapshot('Password Reset - Initial')
      
      // With email filled
      cy.getByCy('email-input').type('user@example.com')
      cy.percySnapshot('Password Reset - Email Filled')
      
      // Success state (mocked)
      cy.mockApi('POST', '/api/auth/password-reset', { success: true })
      cy.getByCy('reset-submit').click()
      cy.percySnapshot('Password Reset - Success State')
    })
  })

  describe('Dashboard Views', () => {
    beforeEach(() => {
      cy.login()
      
      // Mock consistent dashboard data
      cy.fixture('vulnerabilities.json').then((vulns) => {
        cy.mockApi('GET', '/api/vulnerabilities/summary', vulns.dashboardSummary)
      })
      
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/analyses/recent', projects.recentAnalyses)
      })
    })

    it('should capture main dashboard states', () => {
      cy.visit('/dashboard')
      cy.waitForLoading()
      
      // Main dashboard view
      cy.percySnapshot('Dashboard - Main View')
      
      // With filters applied
      cy.getByCy('critical-vulnerabilities-filter').click()
      cy.percySnapshot('Dashboard - Critical Filter Applied')
      
      // Mobile dashboard
      cy.viewport(375, 667)
      cy.percySnapshot('Dashboard - Mobile View')
      
      // Dark mode (if implemented)
      cy.getByCy('theme-toggle').click()
      cy.percySnapshot('Dashboard - Dark Mode')
    })

    it('should capture dashboard with different data states', () => {
      // Empty state
      cy.mockApi('GET', '/api/vulnerabilities/summary', {
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 }
      })
      
      cy.visit('/dashboard')
      cy.waitForLoading()
      cy.percySnapshot('Dashboard - Empty State')
      
      // Loading state
      cy.intercept('GET', '/api/vulnerabilities/summary', {
        delay: 5000,
        statusCode: 200,
        body: {}
      }).as('slowData')
      
      cy.reload()
      cy.percySnapshot('Dashboard - Loading State')
    })

    it('should capture error states', () => {
      cy.mockApiError('GET', '/api/vulnerabilities/summary', 500)
      
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.percySnapshot('Dashboard - Error State')
    })
  })

  describe('Project Management Views', () => {
    beforeEach(() => {
      cy.login()
      
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/projects', projects.userProjects)
      })
    })

    it('should capture project list variations', () => {
      cy.visit('/projects')
      cy.waitForLoading()
      
      // Grid view
      cy.percySnapshot('Projects - Grid View')
      
      // List view
      cy.getByCy('view-toggle-list').click()
      cy.percySnapshot('Projects - List View')
      
      // With filters
      cy.getByCy('language-filter').click()
      cy.getByCy('filter-javascript').click()
      cy.percySnapshot('Projects - Filtered View')
      
      // Mobile view
      cy.viewport(375, 667)
      cy.percySnapshot('Projects - Mobile Grid')
    })

    it('should capture project creation flow', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/integrations/github/repos', projects.githubRepos)
      })
      
      cy.visit('/projects/create')
      
      // Initial state
      cy.percySnapshot('Project Creation - Initial')
      
      // GitHub integration selected
      cy.getByCy('github-integration').click()
      cy.waitForLoading()
      cy.percySnapshot('Project Creation - GitHub Repos')
      
      // Repository selected
      cy.getByCy('repo-item').first().click()
      cy.percySnapshot('Project Creation - Repo Selected')
      
      // Form filled
      cy.getByCy('project-name-input').type('Test Security Project')
      cy.getByCy('project-description').type('Automated security testing')
      cy.percySnapshot('Project Creation - Form Completed')
    })

    it('should capture project details page', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.fixture('vulnerabilities.json').then((vulns) => {
          cy.mockApi('GET', `/api/projects/${projects.sampleProject.id}/vulnerabilities`, 
            vulns.projectVulnerabilities)
        })
        
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      
      cy.waitForLoading()
      
      // Overview tab
      cy.percySnapshot('Project Details - Overview')
      
      // Vulnerabilities tab
      cy.getByCy('vulnerabilities-tab').click()
      cy.percySnapshot('Project Details - Vulnerabilities')
      
      // Dependencies tab
      cy.getByCy('dependencies-tab').click()
      cy.percySnapshot('Project Details - Dependencies')
      
      // Settings tab
      cy.getByCy('settings-tab').click()
      cy.percySnapshot('Project Details - Settings')
      
      // Mobile view
      cy.viewport(375, 667)
      cy.percySnapshot('Project Details - Mobile')
    })
  })

  describe('Component Library', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should capture data table components', () => {
      cy.fixture('vulnerabilities.json').then((vulns) => {
        cy.mockApi('GET', '/api/vulnerabilities', vulns.tableData)
      })
      
      cy.visit('/vulnerabilities')
      cy.waitForLoading()
      
      // Default table state
      cy.percySnapshot('Data Table - Default State')
      
      // Sorted state
      cy.getByCy('sort-severity').click()
      cy.percySnapshot('Data Table - Sorted by Severity')
      
      // Filtered state
      cy.getByCy('search-input').type('react')
      cy.percySnapshot('Data Table - Filtered Results')
      
      // Pagination
      cy.getByCy('page-size-select').select('50')
      cy.percySnapshot('Data Table - 50 Items Per Page')
      
      // Row selection
      cy.getByCy('select-all-checkbox').click()
      cy.percySnapshot('Data Table - All Rows Selected')
    })

    it('should capture form components', () => {
      cy.visit('/settings/profile')
      
      // Empty form
      cy.percySnapshot('Forms - Profile Settings Empty')
      
      // Filled form
      cy.getByCy('name-input').type('John Doe')
      cy.getByCy('email-input').type('john@example.com')
      cy.getByCy('company-input').type('Example Corp')
      cy.percySnapshot('Forms - Profile Settings Filled')
      
      // With validation errors
      cy.getByCy('name-input').clear()
      cy.getByCy('submit-button').click()
      cy.percySnapshot('Forms - Validation Errors')
    })

    it('should capture modal components', () => {
      cy.visit('/projects')
      
      // Analysis modal
      cy.getByCy('project-card').first().click()
      cy.getByCy('run-analysis-button').click()
      cy.percySnapshot('Modal - Analysis Configuration')
      
      // Confirmation modal
      cy.getByCy('delete-project-button').click()
      cy.percySnapshot('Modal - Delete Confirmation')
      
      // Large content modal
      cy.getByCy('view-full-report').click()
      cy.percySnapshot('Modal - Full Report View')
    })

    it('should capture navigation components', () => {
      cy.visit('/dashboard')
      
      // Main navigation
      cy.percySnapshot('Navigation - Main Menu')
      
      // User menu opened
      cy.getByCy('user-nav').click()
      cy.percySnapshot('Navigation - User Menu Open')
      
      // Mobile navigation
      cy.viewport(375, 667)
      cy.getByCy('mobile-menu-toggle').click()
      cy.percySnapshot('Navigation - Mobile Menu Open')
      
      // Breadcrumb navigation
      cy.visit('/projects/test-project/analyses/test-analysis')
      cy.percySnapshot('Navigation - Breadcrumbs')
    })
  })

  describe('Theme and Responsive Variations', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should capture dark mode variations', () => {
      cy.visit('/dashboard')
      
      // Enable dark mode
      cy.getByCy('theme-toggle').click()
      
      // Dashboard dark mode
      cy.percySnapshot('Dark Mode - Dashboard')
      
      // Project list dark mode
      cy.visit('/projects')
      cy.percySnapshot('Dark Mode - Projects')
      
      // Forms dark mode
      cy.visit('/settings')
      cy.percySnapshot('Dark Mode - Settings')
    })

    it('should capture responsive breakpoints', () => {
      const viewports = [
        { name: 'Mobile Small', width: 320, height: 568 },
        { name: 'Mobile Large', width: 414, height: 896 },
        { name: 'Tablet Portrait', width: 768, height: 1024 },
        { name: 'Tablet Landscape', width: 1024, height: 768 },
        { name: 'Desktop Small', width: 1280, height: 720 },
        { name: 'Desktop Large', width: 1920, height: 1080 }
      ]
      
      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/dashboard')
        cy.waitForLoading()
        cy.percySnapshot(`Responsive - Dashboard ${viewport.name}`)
        
        cy.visit('/projects')
        cy.waitForLoading()
        cy.percySnapshot(`Responsive - Projects ${viewport.name}`)
      })
    })

    it('should capture high contrast mode', () => {
      // Enable high contrast (if implemented)
      cy.visit('/settings/accessibility')
      cy.getByCy('high-contrast-toggle').click()
      
      cy.visit('/dashboard')
      cy.percySnapshot('Accessibility - High Contrast Dashboard')
      
      cy.visit('/projects')
      cy.percySnapshot('Accessibility - High Contrast Projects')
    })
  })

  describe('Error and Edge Cases', () => {
    it('should capture error pages', () => {
      // 404 page
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      cy.percySnapshot('Error - 404 Page')
      
      // Network error page
      cy.intercept('GET', '/api/**', { forceNetworkError: true })
      cy.visit('/dashboard')
      cy.percySnapshot('Error - Network Error')
      
      // Maintenance mode
      cy.mockApiError('GET', '/api/health', 503, 'Service unavailable')
      cy.visit('/dashboard')
      cy.percySnapshot('Error - Maintenance Mode')
    })

    it('should capture loading states', () => {
      // Long loading simulation
      cy.intercept('GET', '/api/projects', {
        delay: 5000,
        statusCode: 200,
        body: []
      })
      
      cy.visit('/projects')
      cy.percySnapshot('Loading - Projects Loading')
      
      // Partial loading (some components loaded)
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/projects', projects.userProjects)
        cy.intercept('GET', '/api/projects/*/vulnerabilities', {
          delay: 3000,
          statusCode: 200,
          body: []
        })
      })
      
      cy.visit('/projects/test-project')
      cy.percySnapshot('Loading - Partial Data Loaded')
    })

    it('should capture empty states', () => {
      // Empty project list
      cy.mockApi('GET', '/api/projects', [])
      cy.visit('/projects')
      cy.waitForLoading()
      cy.percySnapshot('Empty - No Projects')
      
      // Empty vulnerability list
      cy.mockApi('GET', '/api/vulnerabilities', [])
      cy.visit('/vulnerabilities')
      cy.waitForLoading()
      cy.percySnapshot('Empty - No Vulnerabilities')
      
      // Empty search results
      cy.visit('/search?q=nonexistent')
      cy.percySnapshot('Empty - No Search Results')
    })
  })

  describe('Interactive States', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should capture hover and focus states', () => {
      cy.visit('/projects')
      
      // Button hover states
      cy.getByCy('create-project-button').trigger('mouseover')
      cy.percySnapshot('Interactive - Button Hover')
      
      // Card hover states
      cy.getByCy('project-card').first().trigger('mouseover')
      cy.percySnapshot('Interactive - Card Hover')
      
      // Form field focus
      cy.visit('/settings')
      cy.getByCy('name-input').focus()
      cy.percySnapshot('Interactive - Form Field Focus')
      
      // Dropdown open
      cy.getByCy('sort-dropdown').click()
      cy.percySnapshot('Interactive - Dropdown Open')
    })

    it('should capture selection states', () => {
      cy.visit('/vulnerabilities')
      cy.waitForLoading()
      
      // Single row selected
      cy.getByCy('table-row').first().click()
      cy.percySnapshot('Interactive - Single Row Selected')
      
      // Multiple rows selected
      cy.getByCy('table-row').eq(1).click({ ctrlKey: true })
      cy.getByCy('table-row').eq(2).click({ ctrlKey: true })
      cy.percySnapshot('Interactive - Multiple Rows Selected')
      
      // Bulk actions visible
      cy.getByCy('bulk-actions-bar').should('be.visible')
      cy.percySnapshot('Interactive - Bulk Actions Visible')
    })
  })

  describe('Print Styles', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should capture print-optimized layouts', () => {
      cy.visit('/projects/test-project/reports/security-summary')
      
      // Regular view
      cy.percySnapshot('Print - Security Report Screen')
      
      // Print preview simulation
      cy.window().then((win) => {
        const printStyles = win.document.createElement('style')
        printStyles.textContent = '@media print { .no-print { display: none !important; } }'
        win.document.head.appendChild(printStyles)
      })
      
      cy.percySnapshot('Print - Security Report Print Preview')
    })
  })
});