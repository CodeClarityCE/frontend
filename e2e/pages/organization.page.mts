import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Organization pages
 */
export class OrganizationPage {
  readonly page: Page

  // Navigation
  readonly settingsTab: Locator
  readonly membersTab: Locator
  readonly integrationsTab: Locator
  readonly policiesTab: Locator
  readonly auditLogTab: Locator

  // Settings
  readonly orgNameInput: Locator
  readonly orgDescriptionInput: Locator
  readonly saveSettingsButton: Locator
  readonly settingsSavedMessage: Locator

  // Members
  readonly memberList: Locator
  readonly memberItem: Locator
  readonly inviteMemberButton: Locator
  readonly memberEmailInput: Locator
  readonly memberRoleSelect: Locator
  readonly sendInvitationButton: Locator
  readonly invitationSentMessage: Locator
  readonly removeMemberButton: Locator
  readonly changeRoleButton: Locator

  // Integrations
  readonly integrationList: Locator
  readonly integrationItem: Locator
  readonly addGithubButton: Locator
  readonly addGitlabButton: Locator
  readonly disconnectButton: Locator
  readonly integrationStatus: Locator

  // Policies
  readonly policyList: Locator
  readonly policyItem: Locator
  readonly createPolicyButton: Locator
  readonly policyNameInput: Locator
  readonly policyTypeSelect: Locator
  readonly savePolicyButton: Locator
  readonly deletePolicyButton: Locator

  // Audit Log
  readonly auditLogList: Locator
  readonly auditLogEntry: Locator
  readonly actionFilter: Locator
  readonly dateFilter: Locator

  constructor(page: Page) {
    this.page = page

    // Navigation
    this.settingsTab = page.getByTestId('org-settings-tab')
    this.membersTab = page.getByTestId('org-members-tab')
    this.integrationsTab = page.getByTestId('org-integrations-tab')
    this.policiesTab = page.getByTestId('org-policies-tab')
    this.auditLogTab = page.getByTestId('org-audit-log-tab')

    // Settings
    this.orgNameInput = page.getByTestId('org-name-input')
    this.orgDescriptionInput = page.getByTestId('org-description-input')
    this.saveSettingsButton = page.getByTestId('save-org-settings')
    this.settingsSavedMessage = page.getByTestId('settings-saved-message')

    // Members
    this.memberList = page.getByTestId('member-list')
    this.memberItem = page.getByTestId('member-item')
    this.inviteMemberButton = page.getByTestId('invite-member-button')
    this.memberEmailInput = page.getByTestId('member-email-input')
    this.memberRoleSelect = page.getByTestId('member-role-select')
    this.sendInvitationButton = page.getByTestId('send-invitation')
    this.invitationSentMessage = page.getByTestId('invitation-sent-message')
    this.removeMemberButton = page.getByTestId('remove-member')
    this.changeRoleButton = page.getByTestId('change-role')

    // Integrations
    this.integrationList = page.getByTestId('integration-list')
    this.integrationItem = page.getByTestId('integration-item')
    this.addGithubButton = page.getByTestId('add-github-integration')
    this.addGitlabButton = page.getByTestId('add-gitlab-integration')
    this.disconnectButton = page.getByTestId('disconnect-integration')
    this.integrationStatus = page.getByTestId('integration-status')

    // Policies
    this.policyList = page.getByTestId('policy-list')
    this.policyItem = page.getByTestId('policy-item')
    this.createPolicyButton = page.getByTestId('create-policy-button')
    this.policyNameInput = page.getByTestId('policy-name-input')
    this.policyTypeSelect = page.getByTestId('policy-type-select')
    this.savePolicyButton = page.getByTestId('save-policy')
    this.deletePolicyButton = page.getByTestId('delete-policy')

    // Audit Log
    this.auditLogList = page.getByTestId('audit-log-list')
    this.auditLogEntry = page.getByTestId('audit-log-entry')
    this.actionFilter = page.getByTestId('action-filter')
    this.dateFilter = page.getByTestId('date-filter')
  }

  async goto(orgId: string) {
    await this.page.goto(`/organizations/${orgId}/settings`)
  }

  async gotoMembers(orgId: string) {
    await this.page.goto(`/organizations/${orgId}/members`)
  }

  async gotoIntegrations(orgId: string) {
    await this.page.goto(`/organizations/${orgId}/integrations`)
  }

  async gotoPolicies(orgId: string) {
    await this.page.goto(`/organizations/${orgId}/policies`)
  }

  async gotoAuditLog(orgId: string) {
    await this.page.goto(`/organizations/${orgId}/audit-log`)
  }

  async inviteMember(email: string, role: string) {
    await this.inviteMemberButton.click()
    await this.memberEmailInput.fill(email)
    await this.memberRoleSelect.selectOption(role)
    await this.sendInvitationButton.click()
  }

  async removeMember(index: number = 0) {
    await this.memberItem.nth(index).hover()
    await this.removeMemberButton.nth(index).click()
  }

  async updateOrgSettings(name: string, description?: string) {
    await this.orgNameInput.clear()
    await this.orgNameInput.fill(name)
    if (description) {
      await this.orgDescriptionInput.clear()
      await this.orgDescriptionInput.fill(description)
    }
    await this.saveSettingsButton.click()
  }

  async createPolicy(name: string, type: 'license' | 'vulnerability') {
    await this.createPolicyButton.click()
    await this.policyNameInput.fill(name)
    await this.policyTypeSelect.selectOption(type)
    await this.savePolicyButton.click()
  }

  async filterAuditLog(action?: string, date?: string) {
    if (action) {
      await this.actionFilter.selectOption(action)
    }
    if (date) {
      await this.dateFilter.fill(date)
    }
  }

  async getMemberCount(): Promise<number> {
    return await this.memberItem.count()
  }

  async getIntegrationCount(): Promise<number> {
    return await this.integrationItem.count()
  }

  async getPolicyCount(): Promise<number> {
    return await this.policyItem.count()
  }
}
