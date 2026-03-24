import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as cosmosDb from '../../src/utils/cosmosDb.js'

// Mock @azure/cosmos
vi.mock('@azure/cosmos', () => ({
  CosmosClient: vi.fn(() => ({
    database: vi.fn(() => ({
      containers: {
        createIfNotExists: vi.fn(() => Promise.resolve({ container: {} }))
      },
      container: vi.fn((name) => ({
        items: {
          create: vi.fn((item) => Promise.resolve({ resource: item })),
          query: vi.fn(() => ({
            fetchAll: vi.fn(() => Promise.resolve({ resources: [] }))
          }))
        },
        item: vi.fn((id, type) => ({
          read: vi.fn(() => Promise.resolve({ resource: { id, type } })),
          replace: vi.fn((item) => Promise.resolve({ resource: item }))
        }))
      }))
    }))
  }))
}))

describe('Cosmos DB Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.COSMOS_DB_CONNECTION_STRING = 'test-connection-string'
    process.env.COSMOS_DB_DATABASE = 'test-db'
  })

  it('should initialize Cosmos DB client', async () => {
    await cosmosDb.initCosmosDb()
    expect(cosmosDb.getClient).toBeDefined()
  })

  it('should create an entry in database', async () => {
    await cosmosDb.initCosmosDb()
    const entry = { id: '123', type: 'memo', memo: 'Test', toAdminJSON: () => ({ id: '123' }) }
    
    const result = await cosmosDb.createEntry(entry)
    expect(result).toBeDefined()
  })

  it('should search entries by query', async () => {
    await cosmosDb.initCosmosDb()
    
    const results = await cosmosDb.searchEntries('LLC', { status: 'approved' })
    expect(Array.isArray(results)).toBe(true)
  })

  it('should get pending entries', async () => {
    await cosmosDb.initCosmosDb()
    
    const results = await cosmosDb.getPendingEntries()
    expect(Array.isArray(results)).toBe(true)
  })

  it('should create approval record', async () => {
    await cosmosDb.initCosmosDb()
    const record = { entryId: '123', action: 'approved' }
    
    const result = await cosmosDb.createApprovalRecord(record)
    expect(result).toBeDefined()
  })

  it('should get approval history for entry', async () => {
    await cosmosDb.initCosmosDb()
    
    const results = await cosmosDb.getApprovalHistory('entry-123')
    expect(Array.isArray(results)).toBe(true)
  })
})
