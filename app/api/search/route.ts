import { auth } from "@/auth"
import { CosmosClient } from "@azure/cosmos"
import { NextRequest, NextResponse } from "next/server"

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT || "",
  key: process.env.COSMOS_DB_KEY || "",
})

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE || "rhw-research")
const container = database.container("entries")

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "approved"
    const type = searchParams.get("type") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = "SELECT * FROM c"
    const conditions: string[] = []

    // Add status filter
    if (status && status !== "all") {
      conditions.push(`c.status = "${status}"`)
    }

    // Add text search if provided
    if (q) {
      const escaped = q.replace(/"/g, '\\"')
      conditions.push(`(CONTAINS(LOWER(c.content), LOWER("${escaped}")) OR CONTAINS(LOWER(c.title), LOWER("${escaped}"))`)
    }

    // Add type filter if provided
    if (type && type !== "all") {
      conditions.push(`c.type = "${type}"`)
    }

    // Build final query
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    // Add pagination
    query += ` ORDER BY c.createdAt DESC OFFSET ${offset} LIMIT ${limit}`

    // Execute query
    const { resources } = await container.items.query(query).fetchAll()

    // Check visibility rules - filter out private content for non-admin users
    const isAdmin = session.user.isAdmin === true
    const visibleEntries = resources.filter((entry: any) => {
      // Admins see everything
      if (isAdmin) return true
      // Staff see published entries, hide private conversation transcripts
      return entry.status === "approved" && !entry.isPrivate
    })

    return NextResponse.json({
      data: visibleEntries,
      total: visibleEntries.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
