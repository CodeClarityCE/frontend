export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

export const mockAuthenticatedUser = {
  ...mockUser,
  organizations: [
    {
      id: '1',
      name: 'Test Organization',
      slug: 'test-org',
      role: 'admin'
    }
  ]
}

export const mockOrganization = {
  id: '1',
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

export const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  repository_url: 'https://github.com/test/repo',
  organization_id: '1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}