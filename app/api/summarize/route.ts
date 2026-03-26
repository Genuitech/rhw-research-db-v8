import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// Mock research entries
const mockEntries = [
  {
    id: "1",
    title: "IRC 529 Education Savings Plans - Recent Updates",
    content:
      "Comprehensive guide on Section 529 qualified education plans. Key considerations: SECURE 2.0 changes allow up to $35,000 aggregate rollovers to Roth IRAs, age limits apply. Suitable for high-income clients planning education expenses. Tax-free growth for qualified education expenses.",
    type: "tax",
    topic: "Education Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "2",
    title: "Pass-Through Entity Tax (PTET) State Credits",
    content:
      "Overview of state-level PTET options for S-Corps, LLCs, and partnerships. States offering PTET elections: Mississippi, Oklahoma, Tennessee, Utah. Benefits include federal deduction for state taxes paid. Planning opportunity for 2024 with sunset provisions in 2025.",
    type: "tax",
    topic: "Business Taxation",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "3",
    title: "Cryptocurrency and Digital Assets - Tax Treatment",
    content:
      "IRS guidance on cryptocurrency taxation, including wash sale rules (do not apply), charitable contributions of crypto, and mining income. Form 8949 and Schedule D requirements. Recent enforcement priorities focus on unreported transactions over $10,000.",
    type: "tax",
    topic: "Digital Assets",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Compliance Team",
  },
  {
    id: "4",
    title: "ASC 842 Lease Accounting Implementation",
    content:
      "Detailed implementation guide for ASC 842 lease accounting standards. All leases (except short-term and low-value) require right-of-use asset recognition. Operating vs finance lease distinction removed. Impacts balance sheet presentation and financial metrics.",
    type: "accounting",
    topic: "GAAP Standards",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Accounting Standards",
  },
  {
    id: "5",
    title: "Multi-State Tax Nexus and Apportionment",
    content:
      "Analysis of state tax nexus requirements post-South Dakota v. Wayfair. Physical presence no longer required for sales tax. Property and payroll factors in apportionment formulas. Double taxation relief mechanisms. Planning strategies for multistate businesses.",
    type: "tax",
    topic: "State Taxes",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "6",
    title: "Estate Planning with Spousal Lifetime Access Trusts (SLATs)",
    content:
      "SLAT strategy overview: transfers to irrevocable trust for spouse with Crummey powers. Leverages annual exclusion and GST exemption. Divorce risks and mitigations. Portability election coordination. Estate tax savings of 40% on transferred assets.",
    type: "planning",
    topic: "Estate Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    author: "Planning Team",
  },
]

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      )
    }

    // Find documents matching the topic
    const lowerTopic = topic.toLowerCase()
    const matchingDocs = mockEntries.filter(
      (doc) =>
        doc.topic.toLowerCase().includes(lowerTopic) ||
        doc.title.toLowerCase().includes(lowerTopic) ||
        doc.content.toLowerCase().includes(lowerTopic)
    )

    if (matchingDocs.length === 0) {
      return NextResponse.json(
        {
          summary: `No documents found for topic: "${topic}". Try searching for different keywords.`,
          contradictions: [],
          sources: [],
        }
      )
    }

    // Use Claude API for real analysis
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Prepare documents for AI summarization
    const documentsText = matchingDocs
      .map(
        (doc, i) =>
          `[Document ${i + 1}: "${doc.title}" by ${doc.author}]\n${doc.content}`
      )
      .join("\n\n---\n\n")

    const prompt = `You are a professional research analyst for RHW CPAs. Analyze these ${matchingDocs.length} documents about "${topic}" and provide:

1. A comprehensive summary of the key points across all documents
2. 3-5 key points extracted from the documents
3. Any contradictions or conflicting information between documents (include direct quotes with document numbers)

Documents to analyze:
${documentsText}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "summary": "paragraph summary here",
  "keyPoints": ["point 1", "point 2", ...],
  "contradictions": [
    {
      "issue": "description of contradiction",
      "document1": {"id": "Document X title", "quote": "exact quote from doc"},
      "document2": {"id": "Document Y title", "quote": "exact quote from doc"},
      "severity": "HIGH"
    }
  ]
}`

    try {
      const message = await client.messages.create({
        model: "claude-opus-4",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      const content = message.content[0]
      if (content.type !== "text") {
        throw new Error("Unexpected response type")
      }

      // Parse Claude's JSON response
      let parsedResponse = {
        summary: "",
        keyPoints: [],
        contradictions: [],
      }
      try {
        // Extract JSON from response (handle any markdown wrapping)
        const jsonStr = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()
        parsedResponse = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("Failed to parse Claude response:", content.text)
        parsedResponse.summary = content.text
      }

      return NextResponse.json({
        summary: parsedResponse.summary || "",
        keyPoints: parsedResponse.keyPoints || [],
        contradictions: parsedResponse.contradictions || [],
        sources: matchingDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          author: doc.author,
          topic: doc.topic,
        })),
      })
    } catch (claudeError) {
      console.error("Claude API error:", claudeError)
      // Fallback to mock response if Claude API fails
      return NextResponse.json({
        summary:
          "Claude API is temporarily unavailable. Showing summary based on document content analysis.",
        keyPoints: matchingDocs.map((doc) => doc.title),
        contradictions: [],
        sources: matchingDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          author: doc.author,
          topic: doc.topic,
        })),
      })
    }
  } catch (error) {
    console.error("Summarize error:", error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
