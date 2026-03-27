import { NextRequest, NextResponse } from "next/server"
import { query } from "@/app/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const rows = await query<{
      id: number
      file_name: string
      file_path: string
      file_type: string
      file_size: number | null
      modified_at: string | null
      indexed_at: string
      text_preview: string | null
      folder_path: string
    }>(
      `SELECT id, file_name, file_path, file_type, file_size,
              modified_at, indexed_at, text_preview, folder_path
       FROM files
       WHERE id = $1`,
      [numericId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
