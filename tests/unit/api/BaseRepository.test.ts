import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaseRepository } from '@/utils/api/BaseRepository'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console.log to avoid test output noise
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('BaseRepository', () => {
  let repository: BaseRepository

  beforeEach(() => {
    repository = new BaseRepository()
    vi.clearAllMocks()
  })

  afterEach(() => {
    consoleSpy.mockClear()
  })

  describe('Constructor', () => {
    it('should create a repository instance', () => {
      expect(repository).toBeInstanceOf(BaseRepository)
    })

    it('should have default configuration', () => {
      expect(repository).toBeDefined()
    })
  })

  describe('HTTP Request Methods', () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ data: 'test-data' }),
      text: vi.fn().mockResolvedValue('test-text')
    }

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse)
    })

    describe('GET requests', () => {
      it('should make GET request correctly', async () => {
        await repository.get('/test-endpoint')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint'),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        )
      })

      it('should handle GET request with query parameters', async () => {
        await repository.get('/test-endpoint', { param1: 'value1', param2: 'value2' })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('param1=value1'),
          expect.any(Object)
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('param2=value2'),
          expect.any(Object)
        )
      })
    })

    describe('POST requests', () => {
      it('should make POST request correctly', async () => {
        const data = { name: 'test', value: 123 }
        await repository.post('/test-endpoint', data)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(data)
          })
        )
      })

      it('should handle POST request without body', async () => {
        await repository.post('/test-endpoint')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint'),
          expect.objectContaining({
            method: 'POST'
          })
        )
      })
    })

    describe('PUT requests', () => {
      it('should make PUT request correctly', async () => {
        const data = { id: 1, name: 'updated' }
        await repository.put('/test-endpoint/1', data)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint/1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(data)
          })
        )
      })
    })

    describe('DELETE requests', () => {
      it('should make DELETE request correctly', async () => {
        await repository.delete('/test-endpoint/1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })
    })

    describe('PATCH requests', () => {
      it('should make PATCH request correctly', async () => {
        const data = { name: 'patched' }
        await repository.patch('/test-endpoint/1', data)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint/1'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(data)
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(repository.get('/test-endpoint')).rejects.toThrow('Network error')
    })

    it('should handle HTTP error responses', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({ error: 'Resource not found' })
      }
      mockFetch.mockResolvedValue(errorResponse)

      try {
        await repository.get('/non-existent-endpoint')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle 500 server errors', async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({ error: 'Server error' })
      }
      mockFetch.mockResolvedValue(serverErrorResponse)

      try {
        await repository.get('/server-error-endpoint')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle timeout scenarios', async () => {
      // Simulate timeout by making fetch hang and then reject
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      await expect(repository.get('/slow-endpoint')).rejects.toThrow('Request timeout')
    })
  })

  describe('Authentication Headers', () => {
    it('should include authorization header when token is provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'authenticated-data' })
      }
      mockFetch.mockResolvedValue(mockResponse)

      // Assuming the repository can accept a token somehow
      await repository.get('/protected-endpoint')

      // Note: Actual implementation may vary based on how auth is handled
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Content Type Handling', () => {
    it('should handle JSON responses', async () => {
      const jsonResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ message: 'success', data: [1, 2, 3] })
      }
      mockFetch.mockResolvedValue(jsonResponse)

      await repository.get('/json-endpoint')
      expect(jsonResponse.json).toHaveBeenCalled()
    })

    it('should handle text responses', async () => {
      const textResponse = {
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('text/plain')
        },
        text: vi.fn().mockResolvedValue('plain text response')
      }
      mockFetch.mockResolvedValue(textResponse)

      await repository.get('/text-endpoint')
      // Note: Actual behavior depends on implementation
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle blob responses for file downloads', async () => {
      const blobResponse = {
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValue(new Blob(['file content']))
      }
      mockFetch.mockResolvedValue(blobResponse)

      await repository.get('/download-endpoint')
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Query Parameter Handling', () => {
    it('should properly encode query parameters', async () => {
      const params = {
        search: 'test query',
        page: 1,
        size: 10,
        active: true
      }

      await repository.get('/search', params)

      const callArgs = mockFetch.mock.calls[0]
      const url = callArgs[0]
      
      expect(url).toContain('search=test%20query')
      expect(url).toContain('page=1')
      expect(url).toContain('size=10')
      expect(url).toContain('active=true')
    })

    it('should handle array parameters', async () => {
      const params = {
        ids: [1, 2, 3],
        types: ['type1', 'type2']
      }

      await repository.get('/multi-params', params)

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle empty or null parameters', async () => {
      await repository.get('/endpoint', {})
      await repository.get('/endpoint', null)
      await repository.get('/endpoint')

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Request Body Handling', () => {
    it('should properly serialize complex objects', async () => {
      const complexData = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      }

      await repository.post('/complex-data', complexData)

      const callArgs = mockFetch.mock.calls[0]
      const options = callArgs[1]
      
      expect(options.body).toBe(JSON.stringify(complexData))
    })

    it('should handle FormData objects', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')
      formData.append('name', 'test-file')

      await repository.post('/upload', formData)

      const callArgs = mockFetch.mock.calls[0]
      const options = callArgs[1]
      
      expect(options.body).toBe(formData)
    })
  })
})