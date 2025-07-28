import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity'
import type { Organization } from '@/codeclarity_components/organizations/organization.entity'

// Mock data factories
const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization',
  created_on: new Date('2023-01-01'),
  updated_on: new Date('2023-01-01'),
  members_count: 5,
  projects_count: 10,
  ...overrides
})

const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  email_verified: true,
  created_on: new Date('2023-01-01'),
  updated_on: new Date('2023-01-01'),
  default_org: createMockOrganization(),
  organizations: [createMockOrganization()],
  ...overrides
})

describe.skip('User Store', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  describe('Initial State', () => {
    it('should have undefined user and defaultOrg initially', () => {
      expect(userStore.user).toBeUndefined()
      expect(userStore.defaultOrg).toBeUndefined()
    })

    it('should return undefined from getters initially', () => {
      expect(userStore.getUser).toBeUndefined()
      expect(userStore.getDefaultOrg).toBeUndefined()
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      const mockUser = createMockUser()
      const mockOrg = createMockOrganization()
      
      userStore.setUser(mockUser)
      userStore.setDefaultOrg(mockOrg)
    })

    it('should return user via getUser', () => {
      const user = userStore.getUser
      expect(user).toBeDefined()
      expect(user?.id).toBe('test-user-id')
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
    })

    it('should return default organization via getDefaultOrg', () => {
      const org = userStore.getDefaultOrg
      expect(org).toBeDefined()
      expect(org?.id).toBe('test-org-id')
      expect(org?.name).toBe('Test Organization')
    })
  })

  describe('Actions', () => {
    describe('setUser', () => {
      it('should set user correctly', () => {
        const mockUser = createMockUser({
          id: 'user-123',
          email: 'user@test.com',
          name: 'John Doe'
        })

        userStore.setUser(mockUser)

        expect(userStore.user).toBe(mockUser)
        expect(userStore.getUser?.id).toBe('user-123')
        expect(userStore.getUser?.email).toBe('user@test.com')
        expect(userStore.getUser?.name).toBe('John Doe')
      })

      it('should replace existing user', () => {
        const firstUser = createMockUser({ id: 'first-user', name: 'First User' })
        const secondUser = createMockUser({ id: 'second-user', name: 'Second User' })

        userStore.setUser(firstUser)
        expect(userStore.getUser?.name).toBe('First User')

        userStore.setUser(secondUser)
        expect(userStore.getUser?.name).toBe('Second User')
        expect(userStore.getUser?.id).toBe('second-user')
      })

      it('should handle user with multiple organizations', () => {
        const org1 = createMockOrganization({ id: 'org-1', name: 'Org 1' })
        const org2 = createMockOrganization({ id: 'org-2', name: 'Org 2' })
        
        const mockUser = createMockUser({
          organizations: [org1, org2],
          default_org: org1
        })

        userStore.setUser(mockUser)

        expect(userStore.getUser?.organizations).toHaveLength(2)
        expect(userStore.getUser?.default_org.id).toBe('org-1')
      })
    })

    describe('setDefaultOrg', () => {
      it('should set default organization correctly', () => {
        const mockOrg = createMockOrganization({
          id: 'new-default-org',
          name: 'New Default Org'
        })

        userStore.setDefaultOrg(mockOrg)

        expect(userStore.defaultOrg).toBe(mockOrg)
        expect(userStore.getDefaultOrg?.id).toBe('new-default-org')
        expect(userStore.getDefaultOrg?.name).toBe('New Default Org')
      })

      it('should update user default_org.id when user exists', () => {
        const mockUser = createMockUser()
        const newDefaultOrg = createMockOrganization({
          id: 'updated-org-id',
          name: 'Updated Organization'
        })

        userStore.setUser(mockUser)
        userStore.setDefaultOrg(newDefaultOrg)

        expect(userStore.getDefaultOrg?.id).toBe('updated-org-id')
        expect(userStore.getUser?.default_org.id).toBe('updated-org-id')
      })

      it('should not crash when setting default org without user', () => {
        const mockOrg = createMockOrganization()

        expect(() => {
          userStore.setDefaultOrg(mockOrg)
        }).not.toThrow()

        expect(userStore.getDefaultOrg).toBe(mockOrg)
      })

      it('should replace existing default organization', () => {
        const firstOrg = createMockOrganization({ id: 'first-org', name: 'First Org' })
        const secondOrg = createMockOrganization({ id: 'second-org', name: 'Second Org' })

        userStore.setDefaultOrg(firstOrg)
        expect(userStore.getDefaultOrg?.name).toBe('First Org')

        userStore.setDefaultOrg(secondOrg)
        expect(userStore.getDefaultOrg?.name).toBe('Second Org')
        expect(userStore.getDefaultOrg?.id).toBe('second-org')
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete user setup flow', () => {
      const organization = createMockOrganization({
        id: 'company-org',
        name: 'Company Organization',
        members_count: 15,
        projects_count: 5
      })

      const user = createMockUser({
        id: 'setup-user',
        email: 'setup@company.com',
        name: 'Setup User',
        default_org: organization,
        organizations: [organization]
      })

      // Step 1: Set user
      userStore.setUser(user)
      expect(userStore.getUser?.email).toBe('setup@company.com')

      // Step 2: Set default org (should update user's default_org.id)
      userStore.setDefaultOrg(organization)
      expect(userStore.getDefaultOrg?.name).toBe('Company Organization')
      expect(userStore.getUser?.default_org.id).toBe('company-org')
    })

    it('should handle user switching organizations', () => {
      const org1 = createMockOrganization({ id: 'org-1', name: 'Organization 1' })
      const org2 = createMockOrganization({ id: 'org-2', name: 'Organization 2' })
      
      const user = createMockUser({
        organizations: [org1, org2],
        default_org: org1
      })

      userStore.setUser(user)
      userStore.setDefaultOrg(org1)
      
      expect(userStore.getDefaultOrg?.id).toBe('org-1')
      expect(userStore.getUser?.default_org.id).toBe('org-1')

      // Switch to org2
      userStore.setDefaultOrg(org2)
      
      expect(userStore.getDefaultOrg?.id).toBe('org-2')
      expect(userStore.getUser?.default_org.id).toBe('org-2')
    })

    it('should handle user logout scenario', () => {
      const user = createMockUser()
      const org = createMockOrganization()

      userStore.setUser(user)
      userStore.setDefaultOrg(org)

      expect(userStore.getUser).toBeDefined()
      expect(userStore.getDefaultOrg).toBeDefined()

      // Simulate logout by resetting store
      userStore.$reset()

      expect(userStore.getUser).toBeUndefined()
      expect(userStore.getDefaultOrg).toBeUndefined()
    })
  })

  describe('Data Validation', () => {
    it('should handle user with email_verified false', () => {
      const unverifiedUser = createMockUser({
        email_verified: false
      })

      userStore.setUser(unverifiedUser)
      expect(userStore.getUser?.email_verified).toBe(false)
    })

    it('should handle user with empty organizations array', () => {
      const userWithNoOrgs = createMockUser({
        organizations: []
      })

      userStore.setUser(userWithNoOrgs)
      expect(userStore.getUser?.organizations).toHaveLength(0)
    })

    it('should preserve all user properties', () => {
      const complexUser = createMockUser({
        id: 'complex-user',
        email: 'complex@test.com',
        name: 'Complex User',
        email_verified: true,
        created_on: new Date('2022-01-01'),
        updated_on: new Date('2023-06-01')
      })

      userStore.setUser(complexUser)

      const storedUser = userStore.getUser
      expect(storedUser?.id).toBe('complex-user')
      expect(storedUser?.email).toBe('complex@test.com')
      expect(storedUser?.name).toBe('Complex User')
      expect(storedUser?.email_verified).toBe(true)
      expect(storedUser?.created_on).toEqual(new Date('2022-01-01'))
      expect(storedUser?.updated_on).toEqual(new Date('2023-06-01'))
    })

    it('should preserve all organization properties', () => {
      const complexOrg = createMockOrganization({
        id: 'complex-org',
        name: 'Complex Organization',
        slug: 'complex-org-slug',
        description: 'A complex test organization',
        members_count: 25,
        projects_count: 50,
        created_on: new Date('2021-01-01'),
        updated_on: new Date('2023-05-01')
      })

      userStore.setDefaultOrg(complexOrg)

      const storedOrg = userStore.getDefaultOrg
      expect(storedOrg?.id).toBe('complex-org')
      expect(storedOrg?.name).toBe('Complex Organization')
      expect(storedOrg?.slug).toBe('complex-org-slug')
      expect(storedOrg?.description).toBe('A complex test organization')
      expect(storedOrg?.members_count).toBe(25)
      expect(storedOrg?.projects_count).toBe(50)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive user changes', () => {
      const users = [
        createMockUser({ id: 'user-1', name: 'User 1' }),
        createMockUser({ id: 'user-2', name: 'User 2' }),
        createMockUser({ id: 'user-3', name: 'User 3' })
      ]

      users.forEach(user => userStore.setUser(user))

      expect(userStore.getUser?.id).toBe('user-3')
      expect(userStore.getUser?.name).toBe('User 3')
    })

    it('should handle rapid successive org changes', () => {
      const orgs = [
        createMockOrganization({ id: 'org-1', name: 'Org 1' }),
        createMockOrganization({ id: 'org-2', name: 'Org 2' }),
        createMockOrganization({ id: 'org-3', name: 'Org 3' })
      ]

      orgs.forEach(org => userStore.setDefaultOrg(org))

      expect(userStore.getDefaultOrg?.id).toBe('org-3')
      expect(userStore.getDefaultOrg?.name).toBe('Org 3')
    })
  })
})