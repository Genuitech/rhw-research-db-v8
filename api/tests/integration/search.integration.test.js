import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as cosmosDb from '../../src/utils/cosmosDb.js'

// Mock Cosmos DB
vi.mock('../../src/utils/cosmosDb.js', () => ({
  initCosmosDb: vi.fn(),
  getEntriesContainer: vi.fn()
}))

describe('Search API Integration', () => {
  const mockRequest = (query = '', filters = {}, user = null) => ({
    query: { q: query, ...filters },
    user: user || { email: 'user@rhwcpas.com', isAdmin: false }
  })

  const mockContext = {
    log: vi.fn(),
    log: { error: vi.fn() }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/search', () => {
    it('should require authentication', async () => {
      const { search } = await import('../../src/functions/search/index.js')

      const req = mockRequest('test')
      req.user = null // No user

      const res = await search(req, mockContext)

      expect(res.status).toBe(401)
      const body = JSON.parse(res.body)
      expect(body.error).toContain('Authentication')
    })

    it('should handle empty results', async () => {
      const { search } = await import('../../src/functions/search/index.js')

      const mockContainer = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchAll: vi.fn().mockResolvedValue({ resources: [] })
          })
        }
      }

      cosmosDb.initCosmosDb.mockResolvedValue(undefined)
      cosmosDb.getEntriesContainer.mockReturnValue(mockContainer)

      const req = mockRequest('nonexistent')
      const res = await search(req, mockContext)

      expect(res.status).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.results).toHaveLength(0)
    })

    it('should apply filters to query', async () => {
      const { search } = await import('../../src/functions/search/index.js')

      const mockQueryFn = vi.fn().mockReturnValue({
        fetchAll: vi.fn().mockResolvedValue({ resources: [] })
      })

      const mockContainer = {
        items: {
          query: mockQueryFn
        }
      }

      cosmosDb.initCosmosDb.mockResolvedValue(undefined)
      cosmosDb.getEntriesContainer.mockReturnValue(mockContainer)

      const req = mockRequest('test', { status: 'pending' })
      await search(req, mockContext)

      expect(mockQueryFn).toHaveBeenCalled()
      const callArgs = mockQueryFn.mock.calls[0][0]
      expect(callArgs.query).toContain('status')
    })

    it('should format pagination metadata', async () => {
      const { search } = await import('../../src/functions/search/index.js')

      const mockContainer = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchAll: vi.fn()
              .mockResolvedValueOnce({ resources: [] }) // First call (data)
              .mockResolvedValueOnce({ resources: [5] }) // Second call (count)
          })
        }
      }

      cosmosDb.initCosmosDb.mockResolvedValue(undefined)
      cosmosDb.getEntriesContainer.mockReturnValue(mockContainer)

      const req = mockRequest('', { limit: 20, offset: 0 })
      const res = await search(req, mockContext)

      expect(res.status).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('page')
      expect(body).toHaveProperty('pageSize')
      expect(body).toHaveProperty('hasMore')
      expect(body.limit).toBe(20)
      expect(body.offset).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { search } = await import('../../src/functions/search/index.js')

      cosmosDb.initCosmosDb.mockRejectedValue(new Error('DB connection failed'))

      const req = mockRequest('test')
      const res = await search(req, mockContext)

      expect(res.status).toBe(500)
      const body = JSON.parse(res.body)
      expect(body.error).toBeDefined()
    })
  })
})
