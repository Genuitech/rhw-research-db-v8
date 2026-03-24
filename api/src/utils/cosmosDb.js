import { CosmosClient } from '@azure/cosmos'

let client = null
let database = null
let entriesContainer = null
let approvalContainer = null

export function getClient() {
  return client
}

export async function initCosmosDb() {
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING
  const dbName = process.env.COSMOS_DB_DATABASE || 'rhw-research'

  client = new CosmosClient({ connectionString })
  database = client.database(dbName)

  // Create containers if they don't exist
  await database.containers.createIfNotExists({
    id: 'entries',
    partitionKey: '/type',
    indexingPolicy: {
      includedPaths: [
        { path: '/*' }
      ],
      excludedPaths: [
        { path: '/"_etag"/?'}
      ]
    }
  })

  await database.containers.createIfNotExists({
    id: 'approvals',
    partitionKey: '/entryId'
  })

  entriesContainer = database.container('entries')
  approvalContainer = database.container('approvals')
}

export async function createEntry(entry) {
  return entriesContainer.items.create(entry.toAdminJSON())
}

export async function getEntry(id, type) {
  const { resource } = await entriesContainer.item(id, type).read()
  return resource
}

export async function updateEntry(id, type, updates) {
  const { resource } = await entriesContainer.item(id, type).replace(updates)
  return resource
}

export async function searchEntries(query, filters = {}) {
  let sql = 'SELECT * FROM c WHERE 1=1'
  const params = []

  if (query) {
    sql += ` AND (
      CONTAINS(c.memo, @query) OR
      CONTAINS(c.client, @query) OR
      CONTAINS(c.question, @query) OR
      CONTAINS(c.title, @query) OR
      CONTAINS(c.content, @query) OR
      CONTAINS(c.conversation, @query)
    )`
    params.push({ name: '@query', value: query })
  }

  if (filters.status) {
    sql += ' AND c.status = @status'
    params.push({ name: '@status', value: filters.status })
  }

  if (filters.type) {
    sql += ' AND c.type = @type'
    params.push({ name: '@type', value: filters.type })
  }

  if (filters.author) {
    sql += ' AND c.author = @author'
    params.push({ name: '@author', value: filters.author })
  }

  const query_obj = { query: sql, parameters: params }
  const { resources } = await entriesContainer.items.query(query_obj).fetchAll()
  return resources
}

export async function getPendingEntries() {
  return searchEntries(null, { status: 'pending' })
}

export async function createApprovalRecord(record) {
  return approvalContainer.items.create(record)
}

export async function getApprovalHistory(entryId) {
  const { resources } = await approvalContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.entryId = @entryId ORDER BY c.timestamp DESC',
      parameters: [{ name: '@entryId', value: entryId }]
    })
    .fetchAll()
  return resources
}
