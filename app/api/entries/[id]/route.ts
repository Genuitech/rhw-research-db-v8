import { auth } from "@/auth"
import { CosmosClient } from "@azure/cosmos"
import { NextRequest, NextResponse } from "next/server"

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT || "",
  key: process.env.COSMOS_DB_KEY || "",
})

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE || "rhw-research")
const container = database.container("entries")

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get entry
    const { resource } = await container.item(id, id).read()

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

    // Get existing entry
    const { resource: entry } = await container.item(id, id).read()

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Update status
    const updatedEntry = {
      ...entry,
      status: action === "approve" ? "approved" : "rejected",
      approvedBy: session.user.email,
      approvedAt: new Date().toISOString(),
      approvalNotes: notes || "",
    }

    await container.item(id, id).replace(updatedEntry)

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Update entry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
