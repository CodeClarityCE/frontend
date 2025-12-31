import { createPinia,setActivePinia } from 'pinia'
import { beforeEach,describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity'
import type { Organization } from '@/codeclarity_components/organizations/organization.entity'
import { useUserStore } from '@/stores/user'

// Mock data factories
const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'test-org-id',
  name: 'Test Organization',
  color_scheme: '#000000',
  description: 'A test organization',
  created_on: new Date('2023-01-01'),
  personal: false,
  role: 0, // MemberRole.OWNER
  number_of_members: 5,
  organizationMemberships: [],
  joined_on: new Date('2023-01-01'),
  ...overrides
})

const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  handle: 'test-user',
  activated: true,
  social: false,
  setup_done: true,
  created_on: new Date('2023-01-01'),
  default_org: createMockOrganization(),
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
      expect(user?.first_name).toBe('Test')
      expect(user?.last_name).toBe('User')
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
          first_name: 'John',
          last_name: 'Doe'
        })

        userStore.setUser(mockUser)

        expect(userStore.user).toBe(mockUser)
        expect(userStore.getUser?.id).toBe('user-123')
        expect(userStore.getUser?.email).toBe('user@test.com')
        expect(userStore.getUser?.first_name).toBe('John')
        expect(userStore.getUser?.last_name).toBe('Doe')
      })

      it('should replace existing user', () => {
        const firstUser = createMockUser({ id: 'first-user', first_name: 'First', last_name: 'User' })
        const secondUser = createMockUser({ id: 'second-user', first_name: 'Second', last_name: 'User' })

        userStore.setUser(firstUser)
        expect(userStore.getUser?.first_name).toBe('First')

        userStore.setUser(secondUser)
        expect(userStore.getUser?.first_name).toBe('Second')
        expect(userStore.getUser?.id).toBe('second-user')
      })

      it('should handle user with default organization', () => {
        const org1 = createMockOrganization({ id: 'org-1', name: 'Org 1' })

        const mockUser = createMockUser({
          default_org: org1
        })

        userStore.setUser(mockUser)

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
        number_of_members: 15
      })

      const user = createMockUser({
        id: 'setup-user',
        email: 'setup@company.com',
        first_name: 'Setup',
        last_name: 'User',
        default_org: organization
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
    it('should handle user with activated false', () => {
      const unverifiedUser = createMockUser({
        activated: false
      })

      userStore.setUser(unverifiedUser)
      expect(userStore.getUser?.activated).toBe(false)
    })

    it('should handle user with default organization', () => {
      const defaultOrg = createMockOrganization()
      const userWithDefaultOrg = createMockUser({
        default_org: defaultOrg
      })

      userStore.setUser(userWithDefaultOrg)
      expect(userStore.getUser?.default_org).toBeDefined()
      expect(userStore.getUser?.default_org.id).toBe(defaultOrg.id)
    })

    it('should preserve all user properties', () => {
      const complexUser = createMockUser({
        id: 'complex-user',
        email: 'complex@test.com',
        first_name: 'Complex',
        last_name: 'User',
        handle: 'complex-user',
        activated: true,
        created_on: new Date('2022-01-01')
      })

      userStore.setUser(complexUser)

      const storedUser = userStore.getUser
      expect(storedUser?.id).toBe('complex-user')
      expect(storedUser?.email).toBe('complex@test.com')
      expect(storedUser?.first_name).toBe('Complex')
      expect(storedUser?.last_name).toBe('User')
      expect(storedUser?.handle).toBe('complex-user')
      expect(storedUser?.activated).toBe(true)
      expect(storedUser?.created_on).toEqual(new Date('2022-01-01'))
    })

    it('should preserve all organization properties', () => {
      const complexOrg = createMockOrganization({
        id: 'complex-org',
        name: 'Complex Organization',
        color_scheme: '#123456',
        description: 'A complex test organization',
        number_of_members: 25,
        created_on: new Date('2021-01-01')
      })

      userStore.setDefaultOrg(complexOrg)

      const storedOrg = userStore.getDefaultOrg
      expect(storedOrg?.id).toBe('complex-org')
      expect(storedOrg?.name).toBe('Complex Organization')
      expect(storedOrg?.color_scheme).toBe('#123456')
      expect(storedOrg?.description).toBe('A complex test organization')
      expect(storedOrg?.number_of_members).toBe(25)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive user changes', () => {
      const users = [
        createMockUser({ id: 'user-1', first_name: 'User', last_name: '1' }),
        createMockUser({ id: 'user-2', first_name: 'User', last_name: '2' }),
        createMockUser({ id: 'user-3', first_name: 'User', last_name: '3' })
      ]

      users.forEach(user => userStore.setUser(user))

      expect(userStore.getUser?.id).toBe('user-3')
      expect(userStore.getUser?.first_name).toBe('User')
      expect(userStore.getUser?.last_name).toBe('3')
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