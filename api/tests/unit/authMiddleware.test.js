import { describe, it, expect } from 'vitest'
import { validateEntraToken, requireAdmin } from '../../src/middleware/authMiddleware.js'

describe('Auth Middleware', () => {
  it('should validate a valid Entra token', () => {
    const mockToken = {
      sub: 'user-id-123',
      upn: 'user@rhwcpas.com',
      name: 'John Doe'
    }

    const result = validateEntraToken(mockToken)
    expect(result.isValid).toBe(true)
    expect(result.user.email).toBe('user@rhwcpas.com')
    expect(result.user.name).toBe('John Doe')
  })

  it('should reject invalid token', () => {
    const result = validateEntraToken(null)
    expect(result.isValid).toBe(false)
  })

  it('should extract user info from token', () => {
    const mockToken = {
      upn: 'admin@rhwcpas.com',
      name: 'Admin User',
      appid: 'client-id'
    }

    const result = validateEntraToken(mockToken)
    expect(result.user.email).toBe('admin@rhwcpas.com')
    expect(result.user.name).toBe('Admin User')
  })

  it('should identify admin user', () => {
    const mockToken = {
      upn: 'cromine@rhwcpas.com',
      name: 'Chea Romine'
    }

    const result = validateEntraToken(mockToken)
    expect(result.user.isAdmin).toBe(true)
  })

  it('should not identify non-admin as admin', () => {
    const mockToken = {
      upn: 'staff@rhwcpas.com',
      name: 'Staff Member'
    }

    const result = validateEntraToken(mockToken)
    expect(result.user.isAdmin).toBe(false)
  })

  it('should reject token without upn', () => {
    const mockToken = {
      sub: 'user-123',
      name: 'User'
    }

    const result = validateEntraToken(mockToken)
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should provide requireAdmin function', () => {
    expect(typeof requireAdmin).toBe('function')
  })
})
