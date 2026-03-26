import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

// Mock data for Phase 8 testing
const mockEntries = [
  {
    id: "1",
    title: "Research Entry 1",
    content: "This is a test research entry for tax procedures",
    type: "tax",
    status: "approved",
    isPrivate: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Research Entry 2",
    content: "This is another test entry about accounting standards",
    type: "accounting",
    status: "approved",
    isPrivate: false,
    createdAt: new Date().toISOString(),
  },
]

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

    // Filter mock data
    let results = mockEntries

    // Status filter
    if (status && status !== "all") {
      results = results.filter((e: any) => e.status === status)
    }

    // Text search
    if (q) {
      const lowerQ = q.toLowerCase()
      results = results.filter((e: any) =>
        e.content.toLowerCase().includes(lowerQ) ||
        e.title.toLowerCase().includes(lowerQ)
      )
    }

    // Type filter
    if (type && type !== "all") {
      results = results.filter((e: any) => e.type === type)
    }

    // Check visibility rules
    const isAdmin = session.user.isAdmin === true
    const visibleEntries = results.filter((entry: any) => {
      // Admins see everything
      if (isAdmin) return true
      // Staff see published entries
      return entry.status === "approved" && !entry.isPrivate
    })

    // Apply pagination
    const paginatedEntries = visibleEntries.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedEntries,
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
