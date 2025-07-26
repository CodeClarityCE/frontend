describe('Project Management E2E Tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/projects')
    cy.waitForPageLoad()
  })

  describe('Project Creation Flow', () => {
    it('should create a new project from GitHub', () => {
      // Mock GitHub repositories
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/integrations/github/repos', projects.githubRepos)
        cy.mockApi('POST', '/api/projects', projects.newProject)
      })

      // Start project creation
      cy.getByCy('create-project-button').click()
      cy.url().should('include', '/projects/create')
      
      // Select GitHub integration
      cy.getByCy('github-integration').click()
      cy.getByCy('github-repo-list').should('be.visible')
      
      // Search for repository
      cy.getByCy('repo-search').type('test-repo')
      cy.getByCy('repo-item').should('have.length.at.least', 1)
      
      // Select repository
      cy.getByCy('repo-item').first().click()
      cy.getByCy('repo-selected').should('be.visible')
      
      // Configure project settings
      cy.getByCy('project-name-input').clear().type('Test Security Project')
      cy.getByCy('project-description').type('Automated security testing project')
      
      // Select license policy
      cy.getByCy('license-policy-dropdown').click()
      cy.getByCy('policy-option-strict').click()
      
      // Create project
      cy.getByCy('create-project-submit').click()
      cy.waitForLoading()
      
      // Verify project created
      cy.getByCy('project-created-success').should('be.visible')
      cy.url().should('match', /\/projects\/[a-f0-9-]+/)
      cy.getByCy('project-title').should('contain', 'Test Security Project')
    })

    it('should create project from GitLab', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/integrations/gitlab/repos', projects.gitlabRepos)
        cy.mockApi('POST', '/api/projects', projects.newProject)
      })

      cy.getByCy('create-project-button').click()
      
      // Select GitLab integration
      cy.getByCy('gitlab-integration').click()
      cy.getByCy('gitlab-repo-list').should('be.visible')
      
      // Select repository with namespace
      cy.getByCy('namespace-filter').select('my-organization')
      cy.getByCy('repo-item').first().click()
      
      // Configure and create
      cy.getByCy('project-name-input').clear().type('GitLab Security Project')
      cy.getByCy('create-project-submit').click()
      
      cy.waitForLoading()
      cy.getByCy('project-created-success').should('be.visible')
    })

    it('should validate project creation form', () => {
      cy.getByCy('create-project-button').click()
      
      // Try to submit without selecting integration
      cy.getByCy('create-project-submit').click()
      cy.getByCy('integration-error').should('contain', 'select an integration')
      
      // Select integration but no repository
      cy.getByCy('github-integration').click()
      cy.getByCy('create-project-submit').click()
      cy.getByCy('repository-error').should('contain', 'select a repository')
      
      // Test project name validation
      cy.getByCy('repo-item').first().click()
      cy.getByCy('project-name-input').clear()
      cy.getByCy('project-name-input').blur()
      cy.getByCy('name-error').should('contain', 'required')
    })

    it('should handle integration errors', () => {
      cy.mockApiError('GET', '/api/integrations/github/repos', 403, 'Access denied')
      
      cy.getByCy('create-project-button').click()
      cy.getByCy('github-integration').click()
      
      // Should show error message
      cy.getByCy('integration-error').should('be.visible')
      cy.getByCy('integration-error').should('contain', 'Access denied')
      
      // Should offer retry
      cy.getByCy('retry-integration').should('be.visible')
    })
  })

  describe('Project List and Management', () => {
    beforeEach(() => {
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', '/api/projects', projects.userProjects)
      })
      cy.reload()
      cy.waitForLoading()
    })

    it('should display project list', () => {
      cy.getByCy('projects-grid').should('be.visible')
      cy.getByCy('project-card').should('have.length.at.least', 1)
      
      // Verify project card information
      cy.getByCy('project-card').first().within(() => {
        cy.getByCy('project-name').should('be.visible')
        cy.getByCy('project-language').should('be.visible')
        cy.getByCy('vulnerability-count').should('be.visible')
        cy.getByCy('last-analysis-date').should('be.visible')
      })
    })

    it('should filter projects by language', () => {
      cy.getByCy('language-filter').click()
      cy.getByCy('filter-javascript').click()
      
      // Should show only JavaScript projects
      cy.getByCy('project-card').each(($card) => {
        cy.wrap($card).find('[data-cy="project-language"]').should('contain', 'JavaScript')
      })
      
      // Clear filter
      cy.getByCy('clear-filters').click()
      cy.getByCy('project-card').should('have.length.at.least', 2)
    })

    it('should search projects', () => {
      cy.getByCy('project-search').type('react')
      cy.getByCy('search-results').should('be.visible')
      
      // Should filter projects by name
      cy.getByCy('project-card').each(($card) => {
        cy.wrap($card).find('[data-cy="project-name"]').invoke('text').should('match', /react/i)
      })
    })

    it('should sort projects', () => {
      cy.getByCy('sort-dropdown').click()
      cy.getByCy('sort-by-vulnerabilities').click()
      
      // Verify sorting order
      cy.getByCy('vulnerability-count').then(($counts) => {
        const counts = Array.from($counts).map(el => parseInt(el.textContent || '0'))
        const sorted = [...counts].sort((a, b) => b - a)
        expect(counts).to.deep.equal(sorted)
      })
    })

    it('should navigate to project details', () => {
      cy.getByCy('project-card').first().click()
      
      cy.url().should('match', /\/projects\/[a-f0-9-]+/)
      cy.getByCy('project-header').should('be.visible')
      cy.getByCy('project-overview').should('be.visible')
    })
  })

  describe('Project Analysis and Monitoring', () => {
    beforeEach(() => {
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      cy.waitForPageLoad()
    })

    it('should run manual analysis', () => {
      cy.mockApi('POST', '/api/analyses', { 
        id: 'analysis-123',
        status: 'running'
      })
      
      cy.getByCy('run-analysis-button').click()
      cy.getByCy('analysis-modal').should('be.visible')
      
      // Configure analysis options
      cy.getByCy('enable-vulnerability-scan').check()
      cy.getByCy('enable-license-scan').check()
      cy.getByCy('enable-dependency-scan').check()
      
      // Start analysis
      cy.getByCy('start-analysis').click()
      
      // Verify analysis started
      cy.getByCy('analysis-started-message').should('be.visible')
      cy.getByCy('analysis-progress').should('be.visible')
    })

    it('should display analysis history', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.mockApi('GET', `/api/projects/${projects.sampleProject.id}/analyses`, 
          projects.analysisHistory)
      })
      
      cy.getByCy('analysis-history-tab').click()
      cy.getByCy('analysis-list').should('be.visible')
      
      // Verify analysis entries
      cy.getByCy('analysis-item').should('have.length.at.least', 1)
      cy.getByCy('analysis-item').first().within(() => {
        cy.getByCy('analysis-date').should('be.visible')
        cy.getByCy('analysis-status').should('be.visible')
        cy.getByCy('vulnerability-count').should('be.visible')
      })
      
      // View analysis details
      cy.getByCy('analysis-item').first().click()
      cy.url().should('include', '/analyses/')
    })

    it('should configure automated scans', () => {
      cy.getByCy('project-settings-tab').click()
      cy.getByCy('automation-settings').should('be.visible')
      
      // Enable automated scanning
      cy.getByCy('auto-scan-toggle').click()
      cy.getByCy('scan-frequency').select('weekly')
      cy.getByCy('scan-on-push').check()
      
      // Configure notifications
      cy.getByCy('email-notifications').check()
      cy.getByCy('slack-notifications').check()
      cy.getByCy('slack-webhook').type('https://hooks.slack.com/test')
      
      // Save settings
      cy.getByCy('save-automation-settings').click()
      cy.getByCy('settings-saved-message').should('be.visible')
    })
  })

  describe('Project Security Dashboard', () => {
    beforeEach(() => {
      cy.fixture('projects.json').then((projects) => {
        cy.fixture('vulnerabilities.json').then((vulns) => {
          cy.visit(`/projects/${projects.sampleProject.id}`)
          cy.mockApi('GET', `/api/projects/${projects.sampleProject.id}/vulnerabilities`, 
            vulns.projectVulnerabilities)
        })
      })
      cy.waitForPageLoad()
    })

    it('should display security overview', () => {
      cy.getByCy('security-overview').should('be.visible')
      cy.getByCy('security-score').should('be.visible')
      cy.getByCy('vulnerability-breakdown').should('be.visible')
      
      // Check vulnerability severity counts
      cy.getByCy('critical-vulns').should('contain.text', '2')
      cy.getByCy('high-vulns').should('contain.text', '5')
      cy.getByCy('medium-vulns').should('contain.text', '12')
      cy.getByCy('low-vulns').should('contain.text', '8')
    })

    it('should show vulnerability details', () => {
      cy.getByCy('vulnerabilities-tab').click()
      cy.getByCy('vulnerability-table').should('be.visible')
      
      // Filter by severity
      cy.getByCy('severity-filter').click()
      cy.getByCy('filter-critical').click()
      
      cy.getByCy('vulnerability-row').each(($row) => {
        cy.wrap($row).find('[data-cy="severity-badge"]').should('contain', 'Critical')
      })
      
      // View vulnerability details
      cy.getByCy('vulnerability-row').first().click()
      cy.getByCy('vulnerability-modal').should('be.visible')
      cy.getByCy('vulnerability-description').should('be.visible')
      cy.getByCy('vulnerability-fix').should('be.visible')
    })

    it('should display dependency information', () => {
      cy.getByCy('dependencies-tab').click()
      cy.getByCy('dependency-tree').should('be.visible')
      
      // Search dependencies
      cy.getByCy('dependency-search').type('react')
      cy.getByCy('dependency-item').should('have.length.at.least', 1)
      
      // View dependency details
      cy.getByCy('dependency-item').first().click()
      cy.getByCy('dependency-modal').should('be.visible')
      cy.getByCy('dependency-version').should('be.visible')
      cy.getByCy('dependency-license').should('be.visible')
    })
  })

  describe('Project Collaboration', () => {
    beforeEach(() => {
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      cy.waitForPageLoad()
    })

    it('should manage project members', () => {
      cy.getByCy('project-settings-tab').click()
      cy.getByCy('members-section').should('be.visible')
      
      // Add new member
      cy.getByCy('invite-member-button').click()
      cy.getByCy('member-email-input').type('newuser@example.com')
      cy.getByCy('member-role-select').select('developer')
      cy.getByCy('send-invitation').click()
      
      cy.getByCy('invitation-sent-message').should('be.visible')
      
      // View member list
      cy.getByCy('member-list').should('be.visible')
      cy.getByCy('member-item').should('have.length.at.least', 1)
    })

    it('should manage project permissions', () => {
      cy.getByCy('project-settings-tab').click()
      cy.getByCy('permissions-section').should('be.visible')
      
      // Update project visibility
      cy.getByCy('project-visibility').select('private')
      
      // Configure role permissions
      cy.getByCy('developer-permissions').within(() => {
        cy.getByCy('can-run-analysis').check()
        cy.getByCy('can-view-results').check()
        cy.getByCy('can-export-data').uncheck()
      })
      
      cy.getByCy('save-permissions').click()
      cy.getByCy('permissions-saved-message').should('be.visible')
    })
  })

  describe('Project Export and Reporting', () => {
    beforeEach(() => {
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      cy.waitForPageLoad()
    })

    it('should export vulnerability report', () => {
      cy.getByCy('export-button').click()
      cy.getByCy('export-menu').should('be.visible')
      
      // Configure export options
      cy.getByCy('export-format').select('pdf')
      cy.getByCy('include-vulnerabilities').check()
      cy.getByCy('include-dependencies').check()
      cy.getByCy('include-recommendations').check()
      
      cy.getByCy('generate-report').click()
      
      // Verify export initiated
      cy.getByCy('export-progress').should('be.visible')
      cy.getByCy('export-complete-message').should('be.visible', { timeout: 10000 })
    })

    it('should schedule recurring reports', () => {
      cy.getByCy('project-settings-tab').click()
      cy.getByCy('reports-section').should('be.visible')
      
      // Configure scheduled report
      cy.getByCy('enable-scheduled-reports').check()
      cy.getByCy('report-frequency').select('weekly')
      cy.getByCy('report-recipients').type('security-team@company.com')
      
      cy.getByCy('save-report-settings').click()
      cy.getByCy('report-scheduled-message').should('be.visible')
    })
  })

  describe('Mobile and Accessibility', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      
      // Verify mobile layout
      cy.getByCy('mobile-project-header').should('be.visible')
      cy.getByCy('mobile-tabs').should('be.visible')
      
      // Test mobile navigation
      cy.getByCy('mobile-menu').click()
      cy.getByCy('mobile-nav-vulnerabilities').click()
      cy.getByCy('vulnerability-table').should('be.visible')
    })

    it('should be accessible', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      
      cy.checkA11y()
      
      // Test keyboard navigation
      cy.testKeyboardNavigation('run-analysis-button', [
        'vulnerabilities-tab',
        'dependencies-tab',
        'settings-tab'
      ])
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle project not found', () => {
      cy.mockApiError('GET', '/api/projects/nonexistent', 404, 'Project not found')
      
      cy.visit('/projects/nonexistent')
      
      cy.getByCy('project-not-found').should('be.visible')
      cy.getByCy('back-to-projects').click()
      cy.url().should('include', '/projects')
    })

    it('should handle analysis failures', () => {
      cy.mockApiError('POST', '/api/analyses', 500, 'Analysis service unavailable')
      
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      
      cy.getByCy('run-analysis-button').click()
      cy.getByCy('start-analysis').click()
      
      cy.getByCy('analysis-error').should('be.visible')
      cy.getByCy('analysis-error').should('contain', 'service unavailable')
    })

    it('should handle network interruptions', () => {
      cy.fixture('projects.json').then((projects) => {
        cy.visit(`/projects/${projects.sampleProject.id}`)
      })
      
      // Simulate network failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('networkError')
      
      cy.getByCy('refresh-data').click()
      
      cy.getByCy('network-error-message').should('be.visible')
      cy.getByCy('retry-button').should('be.visible')
    })
  })
});