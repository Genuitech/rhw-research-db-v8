import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const DAILY_LIMIT = 20

// In-memory rate limiter keyed by userId — resets on server restart (fine for POC)
const rateLimitStore = new Map<string, { count: number; date: string }>()

// In-memory audit log — ⚠️ resets on server restart. Needs Neon DB for production persistence.
interface AuditEntry {
  timestamp: string
  userId: string
  email: string
  question: string
  model: string
  queryNumber: number
}
const auditLog: AuditEntry[] = []

function getTodayString() {
  return new Date().toISOString().split("T")[0]
}

function getRateLimitEntry(userId: string) {
  const today = getTodayString()
  const entry = rateLimitStore.get(userId)
  if (!entry || entry.date !== today) {
    const fresh = { count: 0, date: today }
    rateLimitStore.set(userId, fresh)
    return fresh
  }
  return entry
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
    const session = await auth()

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const email = session.user.email
    const entry = getRateLimitEntry(userId)

    if (entry.count >= DAILY_LIMIT) {
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

    // Increment before streaming (prevents double-counting on retry)
    entry.count += 1
    rateLimitStore.set(userId, entry)

    const remaining = DAILY_LIMIT - entry.count
    const model = detailed ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001"

    // Write audit log entry
    auditLog.push({
      timestamp: new Date().toISOString(),
      userId,
      email,
      question: latestQuestion,
      model,
      queryNumber: entry.count,
    })
    console.log(`[AUDIT] ${email} — query ${entry.count}/${DAILY_LIMIT}: "${latestQuestion.slice(0, 80)}..."`)

    const client = new Anthropic()

    // Stream the response
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

          // Send metadata at end as a special marker
          const meta = JSON.stringify({ remaining, limit: DAILY_LIMIT, model })
          controller.enqueue(
            new TextEncoder().encode(`\n\n__META__${meta}`)
          )
        } catch (err) {
          // Roll back count on error
          entry.count = Math.max(0, entry.count - 1)
          rateLimitStore.set(userId, entry)
          auditLog.pop() // remove failed entry
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
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Admin-only: return audit log
  const url = new URL(request.url)
  if (url.searchParams.get("audit") === "1") {
    // @ts-ignore
    const isAdmin = session.user?.isAdmin
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ entries: auditLog, total: auditLog.length })
  }

  const entry = getRateLimitEntry(session.user.id)
  return NextResponse.json({
    remaining: DAILY_LIMIT - entry.count,
    used: entry.count,
    limit: DAILY_LIMIT,
    resetsAt: getTodayString() + "T24:00:00Z",
  })
}
