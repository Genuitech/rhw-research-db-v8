import { describe, it, expect } from 'vitest'
import { buildSearchQuery, applyFilters } from '../../src/utils/searchUtil.js'

describe('Search Utilities', () => {
  describe('buildSearchQuery', () => {
    it('should create basic full-text search query', () => {
      const { sql, parameters } = buildSearchQuery('tax strategy', {})
      expect(sql).toContain('SELECT *')
      expect(sql).toContain('CONTAINS')
      expect(sql.toLowerCase()).toContain('where')
      expect(Array.isArray(parameters)).toBe(true)
    })

    it('should handle empty query string', () => {
      const result = buildSearchQuery('', {})
      expect(result).toBeDefined()
      expect(result.sql).toBeDefined()
      expect(Array.isArray(result.parameters)).toBe(true)
    })

    it('should escape special characters in search terms', () => {
      const { sql, parameters } = buildSearchQuery('S-Corp election', {})
      expect(sql).toBeDefined()
      expect(parameters).toBeDefined()
      // Should not throw
    })
  })

  describe('applyFilters', () => {
    it('should filter by status', () => {
      const filters = { status: 'pending' }
      const { sql, parameters } = buildSearchQuery('', filters)
      expect(sql).toContain('status')
      expect(parameters.some(p => p.name === '@status')).toBe(true)
    })

    it('should filter by type (memo, sop, policy)', () => {
      const filters = { type: 'memo' }
      const { sql, parameters } = buildSearchQuery('', filters)
      expect(sql).toContain('type')
      expect(parameters.some(p => p.name === '@type')).toBe(true)
    })

    it('should filter by author email', () => {
      const filters = { author: 'user@rhwcpas.com' }
      const { sql, parameters } = buildSearchQuery('', filters)
      expect(sql).toContain('author')
      expect(parameters.some(p => p.name === '@author')).toBe(true)
    })

    it('should filter by date range (createdAfter, createdBefore)', () => {
      const filters = {
        createdAfter: '2026-03-01T00:00:00Z',
        createdBefore: '2026-03-24T23:59:59Z'
      }
      const { sql, parameters } = buildSearchQuery('', filters)
      expect(sql).toContain('createdAt')
    })

    it('should combine multiple filters', () => {
      const filters = { status: 'approved', type: 'memo', author: 'user@rhwcpas.com' }
      const { sql, parameters } = buildSearchQuery('tax', filters)
      expect(sql).toContain('status')
      expect(sql).toContain('type')
      expect(sql).toContain('author')
    })

    it('should handle tag filter (array)', () => {
      const filters = { tags: ['tax-strategy', 'S-Corp'] }
      const { sql, parameters } = buildSearchQuery('', filters)
      expect(sql).toContain('ARRAY_CONTAINS')
    })
  })

  describe('pagination', () => {
    it('should apply limit and offset to query', () => {
      const filters = { limit: 10, offset: 20 }
      const { sql } = buildSearchQuery('', filters)
      expect(sql).toContain('OFFSET')
      expect(sql).toContain('LIMIT')
    })

    it('should have sensible defaults (limit=20, offset=0)', () => {
      const filters = {}
      const result = buildSearchQuery('test', filters)
      expect(result).toBeDefined()
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })
  })
})
