import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { search } from '../../src/functions/search/index.js'
import * as cosmosDb from '../../src/utils/cosmosDb.js'

// Mock Cosmos DB
vi.mock('../../src/utils/cosmosDb.js', () => ({
  initCosmosDb: vi.fn(),
  searchEntries: vi.fn()
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

  beforeAll(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/search', () => {
    it('should return paginated search results', async () => {
      const mockEntries = [
        {
          id: '1',
          type: 'memo',
          client: 'ABC Corp',
          question: 'How to form LLC?',
          memo: 'Research summary...',
          tags: ['LLC', 'Formation'],
          status: 'approved',
          author: 'admin@rhwcpas.com',
          toStaffJSON: function() { return { ...this, conversation: undefined } }
        }
      ]

      cosmosDb.searchEntries.mockResolvedValue(mockEntries)

      const req = mockRequest('LLC')
      const res = await search(req, mockContext)

      expect(res.status).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.results).toHaveLength(1)
      expect(body.results[0].client).toBe('ABC Corp')
      expect(body.total).toBe(1)
    })

    it('should return empty results if no matches', async () => {
      cosmosDb.searchEntries.mockResolvedValue([])

      const req = mockRequest('nonexistent-query')
      const res = await search(req, mockContext)

      expect(res.status).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.results).toHaveLength(0)
      expect(body.total).toBe(0)
    })

    it('should filter by status', async () => {
      cosmosDb.searchEntries.mockResolvedValue([])

      const req = mockRequest('', { status: 'pending' })
      const res = await search(req, mockContext)

      expect(cosmosDb.searchEntries).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ status: 'pending' })
      )
    })

    it('should filter by type', async () => {
      cosmosDb.searchEntries.mockResolvedValue([])

      const req = mockRequest('', { type: 'sop' })
      const res = await search(req, mockContext)

      expect(cosmosDb.searchEntries).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ type: 'sop' })
      )
    })

    it('should support pagination with limit and offset', async () => {
      cosmosDb.searchEntries.mockResolvedValue([])

      const req = mockRequest('', { limit: 10, offset: 20 })
      const res = await search(req, mockContext)

      expect(cosmosDb.searchEntries).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ limit: 10, offset: 20 })
      )
    })

    it('should hide conversation from non-admin users', async () => {
      const mockEntry = {
        id: '1',
        type: 'memo',
        memo: 'Public memo',
        conversation: 'HIDDEN: Q&A transcript',
        status: 'approved',
        toStaffJSON: function() {
          const copy = { ...this }
          delete copy.conversation
          return copy
        }
      }

      cosmosDb.searchEntries.mockResolvedValue([mockEntry])

      const req = mockRequest('test', {}, { email: 'staff@rhwcpas.com', isAdmin: false })
      const res = await search(req, mockContext)

      const body = JSON.parse(res.body)
      expect(body.results[0]).not.toHaveProperty('conversation')
    })

    it('should show full data to admin users', async () => {
      const mockEntry = {
        id: '1',
        type: 'memo',
        memo: 'Public memo',
        conversation: 'ADMIN: Q&A transcript',
        status: 'approved',
        toAdminJSON: function() { return { ...this } }
      }

      cosmosDb.searchEntries.mockResolvedValue([mockEntry])

      const req = mockRequest('test', {}, { email: 'admin@rhwcpas.com', isAdmin: true })
      const res = await search(req, mockContext)

      const body = JSON.parse(res.body)
      expect(body.results[0]).toHaveProperty('conversation')
      expect(body.results[0].conversation).toBe('ADMIN: Q&A transcript')
    })

    it('should handle database errors gracefully', async () => {
      cosmosDb.searchEntries.mockRejectedValue(new Error('DB connection failed'))

      const req = mockRequest('test')
      const res = await search(req, mockContext)

      expect(res.status).toBe(500)
      const body = JSON.parse(res.body)
      expect(body.error).toContain('search')
    })

    it('should require authentication', async () => {
      const req = mockRequest('test')
      req.user = null // No user

      const res = await search(req, mockContext)

      expect(res.status).toBe(401)
    })

    it('should support filter by tags (array)', async () => {
      cosmosDb.searchEntries.mockResolvedValue([])

      const req = mockRequest('', { tags: ['tax-strategy', 'LLC'] })
      const res = await search(req, mockContext)

      expect(cosmosDb.searchEntries).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ tags: ['tax-strategy', 'LLC'] })
      )
    })
  })
})
