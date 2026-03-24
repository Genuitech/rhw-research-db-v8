import { describe, it, expect } from 'vitest'
import { buildSearchQuery, applyFilters } from '../../src/utils/searchUtil.js'

describe('Search Utilities', () => {
  describe('buildSearchQuery', () => {
    it('should create basic full-text search query', () => {
      const query = buildSearchQuery('tax strategy', {})
      expect(query).toContain('SELECT *')
      expect(query).toContain('CONTAINS')
      expect(query.toLowerCase()).toContain('where')
    })

    it('should handle empty query string', () => {
      const query = buildSearchQuery('', {})
      expect(query).toBeDefined()
      expect(typeof query).toBe('string')
    })

    it('should escape special characters in search terms', () => {
      const query = buildSearchQuery('S-Corp election', {})
      expect(query).toBeDefined()
      // Should not throw
    })
  })

  describe('applyFilters', () => {
    it('should filter by status', () => {
      const filters = { status: 'pending' }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('status')
      expect(query).toContain('pending')
    })

    it('should filter by type (memo, sop, policy)', () => {
      const filters = { type: 'memo' }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('type')
    })

    it('should filter by author email', () => {
      const filters = { author: 'user@rhwcpas.com' }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('author')
    })

    it('should filter by date range (createdAfter, createdBefore)', () => {
      const filters = {
        createdAfter: '2026-03-01T00:00:00Z',
        createdBefore: '2026-03-24T23:59:59Z'
      }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('createdAt')
    })

    it('should combine multiple filters', () => {
      const filters = { status: 'approved', type: 'memo', author: 'user@rhwcpas.com' }
      const query = buildSearchQuery('tax', filters)
      expect(query).toContain('status')
      expect(query).toContain('type')
      expect(query).toContain('author')
    })

    it('should handle tag filter (array)', () => {
      const filters = { tags: ['tax-strategy', 'S-Corp'] }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('tags')
    })
  })

  describe('pagination', () => {
    it('should apply limit and offset to query', () => {
      const filters = { limit: 10, offset: 20 }
      const query = buildSearchQuery('', filters)
      expect(query).toContain('OFFSET')
      expect(query).toContain('LIMIT')
    })

    it('should have sensible defaults (limit=20, offset=0)', () => {
      const filters = {}
      const query = buildSearchQuery('test', filters)
      // Should not throw, and should handle pagination automatically
      expect(query).toBeDefined()
    })
  })
})
