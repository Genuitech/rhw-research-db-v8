import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { query } from "@/app/lib/db"

const DAILY_LIMIT = 20

function getTodayString() {
  return new Date().toISOString().split("T")[0]
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "internal"
  )
}

// Returns the new count after incrementing (atomic upsert).
async function incrementRateLimit(ip: string): Promise<number> {
  const today = getTodayString()
  const rows = await query<{ count: number }>(
    `INSERT INTO rate_limits (user_id, date, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, date)
     DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [ip, today]
  )
  return rows[0].count
}

async function decrementRateLimit(ip: string): Promise<void> {
  const today = getTodayString()
  await query(
    `UPDATE rate_limits
     SET count = GREATEST(0, count - 1)
     WHERE user_id = $1 AND date = $2`,
    [ip, today]
  )
}

async function getCurrentCount(ip: string): Promise<number> {
  const today = getTodayString()
  const rows = await query<{ count: number }>(
    `SELECT count FROM rate_limits WHERE user_id = $1 AND date = $2`,
    [ip, today]
  )
  return rows[0]?.count ?? 0
}

async function insertAuditLog(
  ip: string,
  question: string,
  model: string,
  queryNumber: number
): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO audit_log (user_id, email, question, model, query_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [ip, ip, question, model, queryNumber]
  )
  return rows[0].id
}

async function deleteAuditLogEntry(id: number): Promise<void> {
  await query(`DELETE FROM audit_log WHERE id = $1`, [id])
}

const SYSTEM_PROMPT = `You are a research assistant for RHW CPAs, a professional accounting firm. Answer tax, accounting, and financial planning questions clearly and accurately for CPA professionals.

Guidelines:
- Be precise and cite relevant IRC sections, regulations, or authoritative guidance when applicable
- Note when information may vary by jurisdiction or is subject to change
- Flag areas of uncertainty or where professional judgment is required
- Assume the user is a licensed CPA with professional knowledge — skip basic definitions unless asked
- Knowledge cutoff: August 2025. Note when recent legislative changes may affect your answer.
- When the user asks a follow-up question, use the context of the full conversation to give a coherent, connected answer.

IMPORTANT: Always end every response with a "---" divider followed by a "**Verify with:**" section listing 2–4 specific authoritative sources relevant to the question. Format each as a markdown link using the real URL. Use sources like:
- IRS publications: [IRS Publication 590-A](https://www.irs.gov/publications/p590a)
- IRS topic pages: [IRS: Retirement Topics - IRA Contribution Limits](https://www.irs.gov/retirement-plans/ira/retirement-topics-ira-contribution-limits)
- IRC sections: [IRC Section 199A (Cornell LII)](https://www.law.cornell.edu/uscode/text/26/199A)
- IRS notices/revenue procedures when applicable
- State revenue department links when state-specific

Only include sources that are genuinely relevant to the specific question asked.`

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    const currentCount = await getCurrentCount(ip)
    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          message: `You've used all ${DAILY_LIMIT} research queries for today. Limit resets tomorrow.`,
          remaining: 0,
          limit: DAILY_LIMIT,
        },
        { status: 429 }
      )
    }

    const { messages, detailed } = await request.json() as { messages: ChatMessage[]; detailed: boolean }

    if (!messages?.length || !messages[messages.length - 1]?.content?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const latestQuestion = messages[messages.length - 1].content.trim()

    const newCount = await incrementRateLimit(ip)
    const remaining = DAILY_LIMIT - newCount
    const model = detailed ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001"

    const auditId = await insertAuditLog(ip, latestQuestion, model, newCount)
    console.log(`[AUDIT] ${ip} — query ${newCount}/${DAILY_LIMIT}: "${latestQuestion.slice(0, 80)}"`)

    const client = new Anthropic()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model,
            max_tokens: 1200,
            system: SYSTEM_PROMPT,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          })

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }

          const meta = JSON.stringify({ remaining, limit: DAILY_LIMIT, model })
          controller.enqueue(new TextEncoder().encode(`\n\n__META__${meta}`))
        } catch (err) {
          await Promise.allSettled([
            decrementRateLimit(ip),
            deleteAuditLogEntry(auditId),
          ])
          console.error("Anthropic stream error:", err)
          controller.enqueue(
            new TextEncoder().encode(
              "\n\n[Error: Failed to get response from AI. Please try again.]"
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Research-Remaining": String(remaining),
        "X-Research-Limit": String(DAILY_LIMIT),
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Research route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const count = await getCurrentCount(ip)
  return NextResponse.json({
    remaining: DAILY_LIMIT - count,
    used: count,
    limit: DAILY_LIMIT,
    resetsAt: getTodayString() + "T24:00:00Z",
  })
}
