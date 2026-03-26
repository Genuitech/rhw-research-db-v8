import { auth } from "@/auth"
import { streamText } from "ai"
import { NextRequest, NextResponse } from "next/server"

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

    // Prepare documents for AI summarization
    const documentsText = matchingDocs
      .map(
        (doc, i) =>
          `[Document ${i + 1}: "${doc.title}" by ${doc.author}]\n${doc.content}`
      )
      .join("\n\n---\n\n")

    const prompt = `You are a professional research analyst. Analyze these ${matchingDocs.length} documents about "${topic}" and provide:

1. A comprehensive summary of the key points across all documents
2. Any contradictions or conflicting information between documents (include direct quotes)
3. Mark contradictions with [CONTRADICTION] tags including which documents conflict

Documents to analyze:
${documentsText}

Format your response as JSON with this structure:
{
  "summary": "paragraph summary here",
  "keyPoints": ["point 1", "point 2", ...],
  "contradictions": [
    {
      "issue": "description of contradiction",
      "document1": {"id": "title", "quote": "exact quote"},
      "document2": {"id": "title", "quote": "exact quote"},
      "severity": "HIGH|MEDIUM|LOW"
    }
  ]
}`

    // Use AI SDK with AI Gateway (OIDC auth via Vercel)
    const response = await streamText({
      model: "anthropic/claude-opus-4.6", // via AI Gateway
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Collect the full response
    let fullText = ""
    for await (const chunk of response.textStream) {
      fullText += chunk
    }

    // Parse the JSON response
    let parsedResponse = { summary: fullText, keyPoints: [], contradictions: [] }
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // If parsing fails, return the raw text as summary
      parsedResponse = { summary: fullText, keyPoints: [], contradictions: [] }
    }

    return NextResponse.json({
      summary: parsedResponse.summary,
      keyPoints: parsedResponse.keyPoints || [],
      contradictions: parsedResponse.contradictions || [],
      sources: matchingDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        author: doc.author,
        topic: doc.topic,
      })),
    })
  } catch (error) {
    console.error("Summarize error:", error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
