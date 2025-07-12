import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }
    })
  }),

  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // User endpoints
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      organizations: []
    })
  }),

  // Organizations endpoints
  http.get('/api/organizations', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'Test Organization',
          slug: 'test-org'
        }
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10
      }
    })
  }),

  // Projects endpoints
  http.get('/api/projects', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'Test Project',
          description: 'A test project'
        }
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10
      }
    })
  }),

  // Dashboard endpoints
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      totalProjects: 5,
      totalVulnerabilities: 42,
      criticalVulnerabilities: 3,
      highVulnerabilities: 15
    })
  }),

  // Catch-all for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`)
    return new HttpResponse(null, { status: 404 })
  })
]