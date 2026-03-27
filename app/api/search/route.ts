import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/app/lib/db"
import OpenAI from "openai"

export interface FileResult {
  id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number | null
  modified_at: string | null
  indexed_at: string
  text_preview: string | null
  folder_path: string
  similarity: number | null  // 0–1, present only when a search query was given
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const q = sp.get("q")?.trim() ?? ""
    const fileType = sp.get("type") ?? ""
    const limit = Math.min(parseInt(sp.get("limit") ?? "20"), 50)

    let results: FileResult[]

    if (q) {
      // ── Semantic search via pgvector ─────────────────────────────────────
      const openai = new OpenAI()
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: q,
      })
      const vectorStr = `[${embeddingRes.data[0].embedding.join(",")}]`

      // Build optional file-type filter
      const extraConditions: string[] = []
      const values: unknown[] = [vectorStr, limit]
      if (fileType && fileType !== "all") {
        extraConditions.push(`file_type = $${values.length + 1}`)
        values.push(fileType)
      }
      const typeFilter = extraConditions.length
        ? `AND ${extraConditions.join(" AND ")}`
        : ""

      results = await query<FileResult>(
        `SELECT id, file_name, file_path, file_type, file_size,
                modified_at, indexed_at, text_preview, folder_path,
                (1 - (embedding <=> $1::vector))::float AS similarity
         FROM files
         WHERE embedding IS NOT NULL
           ${typeFilter}
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        values
      )
    } else {
      // ── Browse mode: most-recently-modified files ────────────────────────
      const conditions: string[] = []
      const values: unknown[] = [limit]
      if (fileType && fileType !== "all") {
        conditions.push(`file_type = $${values.length + 1}`)
        values.push(fileType)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

      results = await query<FileResult>(
        `SELECT id, file_name, file_path, file_type, file_size,
                modified_at, indexed_at, text_preview, folder_path,
                NULL::float AS similarity
         FROM files
         ${whereClause}
         ORDER BY modified_at DESC NULLS LAST
         LIMIT $1`,
        values
      )
    }

    return NextResponse.json({ data: results, total: results.length, query: q || null })
  } catch (error: unknown) {
    // Files table doesn't exist yet (crawler hasn't run setup-db.sql)
    if (
      error instanceof Error &&
      (error.message.includes('relation "files" does not exist') ||
        (error as NodeJS.ErrnoException & { code?: string }).code === "42P01")
    ) {
      return NextResponse.json({ data: [], total: 0, query: null, noIndex: true })
    }
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
