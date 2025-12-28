import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Projects pages
 */
export class ProjectsPage {
  readonly page: Page

  // List page elements
  readonly createProjectButton: Locator
  readonly projectsGrid: Locator
  readonly projectCard: Locator
  readonly projectSearch: Locator
  readonly languageFilter: Locator
  readonly sortDropdown: Locator
  readonly clearFilters: Locator

  // Project creation
  readonly githubIntegration: Locator
  readonly gitlabIntegration: Locator
  readonly repoSearch: Locator
  readonly repoItem: Locator
  readonly projectNameInput: Locator
  readonly projectDescription: Locator
  readonly licensePolicyDropdown: Locator
  readonly createProjectSubmit: Locator
  readonly projectCreatedSuccess: Locator

  // Project details
  readonly projectHeader: Locator
  readonly projectTitle: Locator
  readonly projectOverview: Locator
  readonly runAnalysisButton: Locator
  readonly analysisModal: Locator
  readonly startAnalysisButton: Locator

  // Tabs
  readonly analysisHistoryTab: Locator
  readonly vulnerabilitiesTab: Locator
  readonly dependenciesTab: Locator
  readonly projectSettingsTab: Locator

  // Security dashboard
  readonly securityOverview: Locator
  readonly securityScore: Locator
  readonly vulnerabilityBreakdown: Locator
  readonly vulnerabilityTable: Locator
  readonly vulnerabilityRow: Locator

  constructor(page: Page) {
    this.page = page

    // List
    this.createProjectButton = page.getByTestId('create-project-button')
    this.projectsGrid = page.getByTestId('projects-grid')
    this.projectCard = page.getByTestId('project-card')
    this.projectSearch = page.getByTestId('project-search')
    this.languageFilter = page.getByTestId('language-filter')
    this.sortDropdown = page.getByTestId('sort-dropdown')
    this.clearFilters = page.getByTestId('clear-filters')

    // Creation
    this.githubIntegration = page.getByTestId('github-integration')
    this.gitlabIntegration = page.getByTestId('gitlab-integration')
    this.repoSearch = page.getByTestId('repo-search')
    this.repoItem = page.getByTestId('repo-item')
    this.projectNameInput = page.getByTestId('project-name-input')
    this.projectDescription = page.getByTestId('project-description')
    this.licensePolicyDropdown = page.getByTestId('license-policy-dropdown')
    this.createProjectSubmit = page.getByTestId('create-project-submit')
    this.projectCreatedSuccess = page.getByTestId('project-created-success')

    // Details
    this.projectHeader = page.getByTestId('project-header')
    this.projectTitle = page.getByTestId('project-title')
    this.projectOverview = page.getByTestId('project-overview')
    this.runAnalysisButton = page.getByTestId('run-analysis-button')
    this.analysisModal = page.getByTestId('analysis-modal')
    this.startAnalysisButton = page.getByTestId('start-analysis')

    // Tabs
    this.analysisHistoryTab = page.getByTestId('analysis-history-tab')
    this.vulnerabilitiesTab = page.getByTestId('vulnerabilities-tab')
    this.dependenciesTab = page.getByTestId('dependencies-tab')
    this.projectSettingsTab = page.getByTestId('project-settings-tab')

    // Security
    this.securityOverview = page.getByTestId('security-overview')
    this.securityScore = page.getByTestId('security-score')
    this.vulnerabilityBreakdown = page.getByTestId('vulnerability-breakdown')
    this.vulnerabilityTable = page.getByTestId('vulnerability-table')
    this.vulnerabilityRow = page.getByTestId('vulnerability-row')
  }

  async goto() {
    await this.page.goto('/projects')
  }

  async gotoProject(projectId: string) {
    await this.page.goto(`/projects/${projectId}`)
  }

  async gotoCreate() {
    await this.page.goto('/projects/create')
  }

  async expectListLoaded() {
    await expect(this.projectsGrid).toBeVisible()
  }

  async expectProjectDetailLoaded() {
    await expect(this.projectHeader).toBeVisible()
    await expect(this.projectOverview).toBeVisible()
  }

  async searchProjects(query: string) {
    await this.projectSearch.fill(query)
  }

  async selectGitHubIntegration() {
    await this.githubIntegration.click()
  }

  async selectGitLabIntegration() {
    await this.gitlabIntegration.click()
  }

  async selectFirstRepo() {
    await this.repoItem.first().click()
  }

  async fillProjectDetails(name: string, description?: string) {
    await this.projectNameInput.clear()
    await this.projectNameInput.fill(name)
    if (description) {
      await this.projectDescription.fill(description)
    }
  }

  async submitCreateProject() {
    await this.createProjectSubmit.click()
  }

  async startAnalysis() {
    await this.runAnalysisButton.click()
    await expect(this.analysisModal).toBeVisible()
    await this.startAnalysisButton.click()
  }

  async filterByLanguage(language: string) {
    await this.languageFilter.click()
    await this.page.getByTestId(`filter-${language.toLowerCase()}`).click()
  }

  async getProjectCount(): Promise<number> {
    return await this.projectCard.count()
  }
}
