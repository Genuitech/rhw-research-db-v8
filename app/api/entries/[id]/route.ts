import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

// Mock Cosmos DB for Phase 8 testing
const mockEntries: Record<string, any> = {
  "test-entry-1": {
    id: "test-entry-1",
    title: "Test Research Entry",
    content: "This is a mock entry for Phase 8 testing",
    topic: "testing",
    status: "approved",
    created_at: new Date().toISOString(),
  },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get entry from mock data
    const resource = mockEntries[id]

    if (!resource) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Check visibility
    const isAdmin = session.user.isAdmin === true
    if (!isAdmin && (resource.status !== "approved" || resource.isPrivate)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Get entry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Admin check
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, notes } = body // action: "approve" or "reject"

    // Get existing entry from mock data
    const entry = mockEntries[id]

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Update status in mock data
    const updatedEntry = {
      ...entry,
      status: action === "approve" ? "approved" : "rejected",
      approvedBy: session.user.email,
      approvedAt: new Date().toISOString(),
      approvalNotes: notes || "",
    }

    // Store updated entry in mock data
    mockEntries[id] = updatedEntry

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Update entry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
