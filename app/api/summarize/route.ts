import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { query } from "@/app/lib/db"

interface FileRow {
  id: number
  file_name: string
  folder_path: string
  text_preview: string | null
  file_type: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ids, question } = (await request.json()) as {
      ids: number[]
      question?: string
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "File IDs required" }, { status: 400 })
    }

    // Fetch the requested files (cap at 20 to avoid oversized prompts)
    const capped = ids.slice(0, 20)
    const placeholders = capped.map((_, i) => `$${i + 1}`).join(",")
    const files = await query<FileRow>(
      `SELECT id, file_name, folder_path, text_preview, file_type
       FROM files
       WHERE id IN (${placeholders})`,
      capped
    )

    if (files.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 })
    }

    const withContent = files.filter((f) => f.text_preview?.trim())

    if (withContent.length === 0) {
      return NextResponse.json({
        summary:
          "The selected files have no indexed text content — they may be binary files (images, archives) that cannot be summarized.",
        keyPoints: [],
        contradictions: [],
        sources: files.map((f) => ({
          id: String(f.id),
          title: f.file_name,
          path: f.folder_path,
        })),
      })
    }

    const client = new Anthropic()

    const documentsText = withContent
      .map(
        (f, i) =>
          `[File ${i + 1}: "${f.file_name}" — ${f.folder_path}]\n${f.text_preview}`
      )
      .join("\n\n---\n\n")

    const specificQuestion = question?.trim()
      ? `Specific question to answer: ${question}\n\n`
      : ""

    const prompt = `You are a research analyst for RHW CPAs. Analyze the following ${withContent.length} document(s) from the firm's file server.

${specificQuestion}Documents:
${documentsText}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "summary": "1–3 paragraph summary of the key information",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "contradictions": []
}`

    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })

      const content = message.content[0]
      if (content.type !== "text") throw new Error("Unexpected response type")

      let parsed: { summary: string; keyPoints: string[]; contradictions: unknown[] } = {
        summary: "",
        keyPoints: [],
        contradictions: [],
      }
      try {
        const jsonStr = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()
        parsed = JSON.parse(jsonStr)
      } catch {
        parsed.summary = content.text
      }

      return NextResponse.json({
        summary: parsed.summary || "",
        keyPoints: parsed.keyPoints || [],
        contradictions: parsed.contradictions || [],
        sources: files.map((f) => ({
          id: String(f.id),
          title: f.file_name,
          path: f.folder_path,
        })),
      })
    } catch (claudeError) {
      console.error("Claude API error:", claudeError)
      return NextResponse.json({
        summary: "AI summarization temporarily unavailable. Please try again.",
        keyPoints: withContent.map((f) => f.file_name),
        contradictions: [],
        sources: files.map((f) => ({
          id: String(f.id),
          title: f.file_name,
          path: f.folder_path,
        })),
      })
    }
  } catch (error) {
    console.error("Summarize error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
