import { Pool, PoolClient } from "pg"

// Singleton pool — reused across requests on a persistent Node.js server (Azure VM).
// In development Next.js hot-reloads modules, so we pin it to globalThis to avoid
// opening a new pool on every file change.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  return new Pool({
    connectionString,
    // Azure Database for PostgreSQL requires SSL. Set DATABASE_SSL=false only
    // for local dev pointed at a non-SSL instance.
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
}

const pool: Pool =
  process.env.NODE_ENV === "production"
    ? createPool()
    : (globalThis._pgPool ?? (globalThis._pgPool = createPool()))

export default pool

// Convenience helper so callers don't need to manage client checkout/release
export async function query<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T[]> {
  const result = await pool.query(sql, values)
  return result.rows as T[]
}
