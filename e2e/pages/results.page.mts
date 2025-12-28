import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Results pages
 */
export class ResultsPage {
  readonly page: Page

  // Tabs
  readonly sbomTab: Locator
  readonly vulnerabilitiesTab: Locator
  readonly licensesTab: Locator

  // SBOM
  readonly dependencyList: Locator
  readonly dependencyItem: Locator
  readonly dependencySearch: Locator
  readonly ecosystemFilter: Locator
  readonly exportSbomButton: Locator

  // Vulnerabilities
  readonly vulnerabilityList: Locator
  readonly vulnerabilityItem: Locator
  readonly severityFilter: Locator
  readonly statusFilter: Locator
  readonly vulnerabilityDetails: Locator
  readonly cvssBreakdown: Locator
  readonly remediationInfo: Locator
  readonly viewToggle: Locator

  // Licenses
  readonly licenseList: Locator
  readonly licenseItem: Locator
  readonly licenseFilter: Locator
  readonly licensePolicyStatus: Locator

  // Common
  readonly resultsHeader: Locator
  readonly analysisInfo: Locator
  readonly exportButton: Locator
  readonly loadingIndicator: Locator

  constructor(page: Page) {
    this.page = page

    // Tabs
    this.sbomTab = page.getByTestId('sbom-tab')
    this.vulnerabilitiesTab = page.getByTestId('vulnerabilities-tab')
    this.licensesTab = page.getByTestId('licenses-tab')

    // SBOM
    this.dependencyList = page.getByTestId('dependency-list')
    this.dependencyItem = page.getByTestId('dependency-item')
    this.dependencySearch = page.getByTestId('dependency-search')
    this.ecosystemFilter = page.getByTestId('ecosystem-filter')
    this.exportSbomButton = page.getByTestId('export-sbom')

    // Vulnerabilities
    this.vulnerabilityList = page.getByTestId('vulnerability-list')
    this.vulnerabilityItem = page.getByTestId('vulnerability-item')
    this.severityFilter = page.getByTestId('severity-filter')
    this.statusFilter = page.getByTestId('status-filter')
    this.vulnerabilityDetails = page.getByTestId('vulnerability-details')
    this.cvssBreakdown = page.getByTestId('cvss-breakdown')
    this.remediationInfo = page.getByTestId('remediation-info')
    this.viewToggle = page.getByTestId('view-toggle')

    // Licenses
    this.licenseList = page.getByTestId('license-list')
    this.licenseItem = page.getByTestId('license-item')
    this.licenseFilter = page.getByTestId('license-filter')
    this.licensePolicyStatus = page.getByTestId('license-policy-status')

    // Common
    this.resultsHeader = page.getByTestId('results-header')
    this.analysisInfo = page.getByTestId('analysis-info')
    this.exportButton = page.getByTestId('export-button')
    this.loadingIndicator = page.getByTestId('loading')
  }

  async goto(projectId: string, analysisId: string) {
    await this.page.goto(`/projects/${projectId}/analyses/${analysisId}/results`)
  }

  async expectLoaded() {
    await expect(this.resultsHeader).toBeVisible()
  }

  async switchToSbom() {
    await this.sbomTab.click()
    await expect(this.dependencyList).toBeVisible()
  }

  async switchToVulnerabilities() {
    await this.vulnerabilitiesTab.click()
    await expect(this.vulnerabilityList).toBeVisible()
  }

  async switchToLicenses() {
    await this.licensesTab.click()
    await expect(this.licenseList).toBeVisible()
  }

  async filterBySeverity(severity: 'critical' | 'high' | 'medium' | 'low') {
    await this.severityFilter.click()
    await this.page.getByTestId(`filter-${severity}`).click()
  }

  async searchDependencies(query: string) {
    await this.dependencySearch.fill(query)
  }

  async toggleView() {
    await this.viewToggle.click()
  }

  async openVulnerabilityDetails(index: number = 0) {
    await this.vulnerabilityItem.nth(index).click()
    await expect(this.vulnerabilityDetails).toBeVisible()
  }

  async exportResults(format: 'pdf' | 'json' | 'csv') {
    await this.exportButton.click()
    await this.page.getByTestId(`export-${format}`).click()
  }

  async getVulnerabilityCount(): Promise<number> {
    return await this.vulnerabilityItem.count()
  }

  async getDependencyCount(): Promise<number> {
    return await this.dependencyItem.count()
  }
}
