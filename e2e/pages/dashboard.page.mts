import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Dashboard page
 */
export class DashboardPage {
  readonly page: Page

  // Header elements
  readonly dashboardHeader: Locator
  readonly pageTitle: Locator

  // Quick stats
  readonly quickStats: Locator
  readonly totalProjects: Locator
  readonly totalVulnerabilities: Locator
  readonly criticalVulnerabilities: Locator
  readonly openIssues: Locator

  // Charts
  readonly vulnerabilityOverview: Locator
  readonly exposureChart: Locator
  readonly trendChart: Locator

  // Recent activity
  readonly recentActivity: Locator
  readonly activityItem: Locator

  // Project cards
  readonly projectCards: Locator
  readonly projectCard: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.dashboardHeader = page.getByTestId('dashboard-header')
    this.pageTitle = page.locator('h3').filter({ hasText: 'Vulnerability Exposure Overview' })

    // Quick stats
    this.quickStats = page.getByTestId('quick-stats')
    this.totalProjects = page.getByTestId('total-projects')
    this.totalVulnerabilities = page.getByTestId('total-vulnerabilities')
    this.criticalVulnerabilities = page.getByTestId('critical-vulnerabilities')
    this.openIssues = page.getByTestId('open-issues')

    // Charts
    this.vulnerabilityOverview = page.getByTestId('vulnerability-overview')
    this.exposureChart = page.getByTestId('exposure-chart')
    this.trendChart = page.getByTestId('trend-chart')

    // Recent activity
    this.recentActivity = page.getByTestId('recent-activity')
    this.activityItem = page.getByTestId('activity-item')

    // Projects
    this.projectCards = page.getByTestId('project-cards')
    this.projectCard = page.getByTestId('project-card')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async expectLoaded() {
    await expect(this.dashboardHeader).toBeVisible()
    await expect(this.pageTitle).toBeVisible()
  }

  async expectQuickStatsVisible() {
    await expect(this.quickStats).toBeVisible()
  }

  async expectChartsVisible() {
    await expect(this.vulnerabilityOverview).toBeVisible()
  }

  async getProjectCount(): Promise<number> {
    return await this.projectCard.count()
  }

  async clickFirstProject() {
    await this.projectCard.first().click()
  }
}
