describe('Dashboard Flow E2E Tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard')
    cy.waitForPageLoad()
  })

  describe('Dashboard Overview', () => {
    it('should display main dashboard elements', () => {
      // Verify page structure
      cy.getByCy('dashboard-header').should('be.visible')
      cy.getByCy('vulnerability-overview').should('be.visible')
      cy.getByCy('security-metrics').should('be.visible')
      cy.getByCy('recent-analyses').should('be.visible')
      
      // Check page title
      cy.get('h3').should('contain', 'Vulnerability Exposure Overview')
      cy.title().should('contain', 'Dashboard')
    })

    it('should load and display vulnerability metrics', () => {
      // Mock vulnerability data
      cy.fixture('vulnerabilities.json').then((vulns) => {
        cy.mockApi('GET', '/api/vulnerabilities/summary', vulns.summary)
      })
      
      cy.reload()
      cy.waitForLoading()
      
      // Verify metrics are displayed
      cy.getByCy('critical-count').should('be.visible')
      cy.getByCy('high-count').should('be.visible')
      cy.getByCy('medium-count').should('be.visible')
      cy.getByCy('low-count').should('be.visible')
      
      // Verify chart is rendered
      cy.getByCy('vulnerability-chart').should('be.visible')
    })

    it('should display recent analyses', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/analyses/recent', projects.recentAnalyses)
      })
      
      cy.reload()
      cy.waitForLoading()
      
      // Verify recent analyses section
      cy.getByCy('recent-analyses-list').should('be.visible')
      cy.getByCy('analysis-item').should('have.length.at.least', 1)
      
      // Test analysis item interaction
      cy.getByCy('analysis-item').first().click()
      cy.url().should('include', '/analyses/')
    })

    it('should be accessible', () => {
      cy.checkA11y()
    })
  })

  describe('Navigation and Interaction', () => {
    it('should navigate to projects from dashboard', () => {
      cy.getByCy('view-all-projects').click()
      cy.url().should('include', '/projects')
      cy.getByCy('projects-header').should('be.visible')
    })

    it('should navigate to vulnerabilities from dashboard', () => {
      cy.getByCy('view-vulnerabilities').click()
      cy.url().should('include', '/vulnerabilities')
      cy.getByCy('vulnerabilities-header').should('be.visible')
    })

    it('should support quick actions', () => {
      // Test create project quick action
      cy.getByCy('quick-create-project').click()
      cy.url().should('include', '/projects/create')
      
      // Go back to dashboard
      cy.go('back')
      cy.url().should('include', '/dashboard')
      
      // Test run analysis quick action
      cy.getByCy('quick-run-analysis').click()
      cy.getByCy('analysis-modal').should('be.visible')
      
      // Close modal
      cy.getByCy('modal-close').click()
      cy.getByCy('analysis-modal').should('not.exist')
    })
  })

  describe('Data Filtering and Search', () => {
    it('should filter vulnerabilities by severity', () => {
      // Click on critical vulnerabilities
      cy.getByCy('critical-vulnerabilities-filter').click()
      
      // Verify filtered view
      cy.getByCy('filtered-vulnerabilities').should('be.visible')
      cy.getByCy('severity-filter-badge').should('contain', 'Critical')
      
      // Clear filter
      cy.getByCy('clear-filters').click()
      cy.getByCy('severity-filter-badge').should('not.exist')
    })

    it('should search across dashboard content', () => {
      cy.getByCy('dashboard-search').type('react')
      cy.getByCy('search-results').should('be.visible')
      cy.getByCy('search-result-item').should('have.length.at.least', 1)
      
      // Click on search result
      cy.getByCy('search-result-item').first().click()
      cy.url().should('not.include', '/dashboard')
    })

    it('should filter by date range', () => {
      cy.getByCy('date-filter').click()
      cy.getByCy('date-picker').should('be.visible')
      
      // Select last 7 days
      cy.getByCy('last-7-days').click()
      cy.getByCy('apply-date-filter').click()
      
      // Verify filtered data
      cy.getByCy('date-filter-badge').should('contain', 'Last 7 days')
      cy.waitForLoading()
      
      // Data should be updated
      cy.getByCy('filtered-analyses').should('be.visible')
    })
  })

  describe('Real-time Updates', () => {
    it('should update when new analysis completes', () => {
      // Mock WebSocket or polling updates
      cy.window().then((win) => {
        // Simulate real-time update
        win.postMessage({
          type: 'ANALYSIS_COMPLETE',
          data: {
            id: 'new-analysis-123',
            status: 'completed',
            vulnerabilities: 5
          }
        }, '*')
      })
      
      // Verify dashboard updates
      cy.getByCy('notification').should('be.visible')
      cy.getByCy('notification').should('contain', 'Analysis completed')
      
      // Metrics should update
      cy.getByCy('total-vulnerabilities').should('not.contain', '0')
    })

    it('should handle analysis failure notifications', () => {
      cy.window().then((win) => {
        win.postMessage({
          type: 'ANALYSIS_FAILED',
          data: {
            id: 'failed-analysis-456',
            error: 'Repository access denied'
          }
        }, '*')
      })
      
      cy.getByCy('error-notification').should('be.visible')
      cy.getByCy('error-notification').should('contain', 'Analysis failed')
    })
  })

  describe('Organization Context', () => {
    it('should switch organization context', () => {
      cy.fixture('organizations.json').then((orgs) => {
        cy.mockApi('GET', '/api/organizations', orgs.userOrganizations)
      })
      
      cy.selectOrganization('TestOrg2')
      cy.waitForLoading()
      
      // Verify organization switch
      cy.getByCy('current-org-name').should('contain', 'TestOrg2')
      
      // Dashboard data should reload for new org
      cy.getByCy('vulnerability-overview').should('be.visible')
    })

    it('should maintain organization context across navigation', () => {
      cy.selectOrganization('TestOrg2')
      cy.getByCy('view-all-projects').click()
      
      // Verify org context is maintained
      cy.getByCy('current-org-name').should('contain', 'TestOrg2')
      
      // Go back to dashboard
      cy.visit('/dashboard')
      cy.getByCy('current-org-name').should('contain', 'TestOrg2')
    })
  })

  describe('Dashboard Widgets and Customization', () => {
    it('should allow widget reordering', () => {
      // Test drag and drop (if implemented)
      cy.getByCy('vulnerability-widget')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 200 })
        .trigger('mouseup')
      
      // Verify new position (would need specific implementation)
      cy.getByCy('widget-container').should('have.attr', 'data-reordered', 'true')
    })

    it('should save widget preferences', () => {
      // Hide a widget
      cy.getByCy('widget-settings').click()
      cy.getByCy('hide-metrics-widget').click()
      cy.getByCy('save-preferences').click()
      
      // Refresh and verify preference is saved
      cy.reload()
      cy.getByCy('security-metrics').should('not.exist')
      
      // Restore widget
      cy.getByCy('widget-settings').click()
      cy.getByCy('show-metrics-widget').click()
      cy.getByCy('save-preferences').click()
      
      cy.getByCy('security-metrics').should('be.visible')
    })
  })

  describe('Performance and Loading', () => {
    it('should load dashboard efficiently', () => {
      const startTime = Date.now()
      
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
      })
    })

    it('should handle large datasets gracefully', () => {
      // Mock large vulnerability dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `vuln-${i}`,
        severity: ['critical', 'high', 'medium', 'low'][i % 4],
        package: `package-${i}`,
        title: `Vulnerability ${i}`
      }))
      
      cy.mockApi('GET', '/api/vulnerabilities/summary', {
        vulnerabilities: largeDataset,
        summary: {
          critical: 250,
          high: 250,
          medium: 250,
          low: 250
        }
      })
      
      cy.reload()
      cy.waitForLoading()
      
      // Should render without performance issues
      cy.getByCy('vulnerability-chart').should('be.visible')
      cy.getByCy('critical-count').should('contain', '250')
    })

    it('should handle API errors gracefully', () => {
      cy.mockApiError('GET', '/api/vulnerabilities/summary', 500)
      
      cy.reload()
      cy.waitForLoading()
      
      // Should show error state
      cy.getByCy('api-error-message').should('be.visible')
      cy.getByCy('retry-button').should('be.visible')
      
      // Test retry functionality
      cy.fixture('vulnerabilities.json').then((vulns) => {
        cy.mockApi('GET', '/api/vulnerabilities/summary', vulns.summary)
      })
      
      cy.getByCy('retry-button').click()
      cy.waitForLoading()
      
      // Should recover and show data
      cy.getByCy('vulnerability-overview').should('be.visible')
      cy.getByCy('api-error-message').should('not.exist')
    })
  })

  describe('Mobile and Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport('iphone-x')
      cy.reload()
      
      // Verify mobile layout
      cy.getByCy('mobile-dashboard').should('be.visible')
      cy.getByCy('mobile-navigation').should('be.visible')
      
      // Test mobile interactions
      cy.getByCy('mobile-menu').click()
      cy.getByCy('mobile-nav-projects').click()
      cy.url().should('include', '/projects')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.reload()
      
      // Verify tablet layout
      cy.getByCy('dashboard-header').should('be.visible')
      cy.getByCy('vulnerability-overview').should('be.visible')
      
      // Test touch interactions
      cy.getByCy('vulnerability-chart').should('be.visible')
      cy.checkA11y()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', () => {
      cy.testKeyboardNavigation('dashboard-search', [
        'quick-create-project',
        'view-all-projects',
        'critical-vulnerabilities-filter',
        'high-vulnerabilities-filter'
      ])
    })

    it('should support keyboard shortcuts', () => {
      // Test global shortcuts
      cy.get('body').realPress(['meta', 'k']) // Command+K for search
      cy.getByCy('global-search-modal').should('be.visible')
      
      cy.realPress('Escape')
      cy.getByCy('global-search-modal').should('not.exist')
      
      // Test navigation shortcuts
      cy.get('body').realPress(['meta', '1']) // Go to dashboard
      cy.url().should('include', '/dashboard')
      
      cy.get('body').realPress(['meta', '2']) // Go to projects
      cy.url().should('include', '/projects')
    })
  })

  describe('Data Export and Sharing', () => {
    it('should export dashboard data', () => {
      cy.getByCy('export-button').click()
      cy.getByCy('export-menu').should('be.visible')
      
      // Test PDF export
      cy.getByCy('export-pdf').click()
      
      // Verify download (mock or check that download was triggered)
      cy.window().then((win) => {
        // In a real implementation, you'd verify the download
        expect(win.document.querySelector('[data-cy="download-initiated"]')).to.exist
      })
    })

    it('should share dashboard via URL', () => {
      cy.getByCy('share-button').click()
      cy.getByCy('share-modal').should('be.visible')
      
      // Generate shareable link
      cy.getByCy('generate-share-link').click()
      cy.getByCy('share-url').should('be.visible')
      
      // Copy to clipboard
      cy.getByCy('copy-share-url').click()
      cy.getByCy('copy-success-message').should('be.visible')
    })
  })
});