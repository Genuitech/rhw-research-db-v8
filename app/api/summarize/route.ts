import { auth } from "@/auth"
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

    // Mock AI response for Phase 9 demo (TODO: integrate with Claude API)
    const mockSummaries: Record<string, any> = {
      "education planning": {
        summary:
          "Section 529 plans are powerful education savings vehicles with significant tax advantages. The SECURE 2.0 law introduced major changes allowing up to $35,000 in aggregate rollovers to Roth IRAs with age limitations. These plans are most suitable for high-income clients planning education expenses, offering tax-free growth for qualified education expenses including tuition, fees, room and board, and books.",
        keyPoints: [
          "Tax-free growth for qualified education expenses",
          "SECURE 2.0 allows $35,000 aggregate Roth IRA rollovers",
          "Age restrictions apply to Roth conversion rollovers",
          "Covers tuition, fees, room/board, and books",
          "Suitable for high-income earners and education planning",
        ],
        contradictions: [],
      },
      "business taxation": {
        summary:
          "Pass-Through Entity Tax (PTET) elections offer significant planning opportunities for S-Corps, LLCs, and partnerships. Multiple states including Mississippi, Oklahoma, Tennessee, and Utah have implemented PTET options. The primary benefit is the federal deduction for state taxes paid, though these provisions include sunset dates (primarily 2025). This represents a notable planning window for multi-state business operations.",
        keyPoints: [
          "PTET available in Mississippi, Oklahoma, Tennessee, Utah",
          "Applicable to S-Corps, LLCs, and partnerships",
          "Federal deduction for state taxes paid",
          "Sunset provisions ending in 2025",
          "Strategic planning opportunity for multi-state businesses",
        ],
        contradictions: [],
      },
      "tax": {
        summary:
          "The research database contains comprehensive tax guidance covering education savings (529 plans), pass-through entity taxation, cryptocurrency treatment, state tax nexus, and digital asset taxation. Key themes include leveraging tax-efficient structures, understanding recent legislative changes (SECURE 2.0, state PTET elections), and managing compliance with evolving IRS enforcement priorities.",
        keyPoints: [
          "SECURE 2.0 fundamentally changed education savings rules",
          "Multiple tax planning opportunities available in 2024-2025",
          "State-level tax elections expanding (PTET options)",
          "Cryptocurrency wash sale rules do NOT apply",
          "IRS focusing on transactions over $10,000",
        ],
        contradictions: [
          {
            issue:
              "SECURE 2.0 Roth rollover limits and timing constraints differ between documents",
            document1: {
              id: "1",
              quote:
                "up to $35,000 aggregate rollovers to Roth IRAs, age limits apply",
            },
            document2: {
              id: "2",
              quote:
                "Planning opportunity for 2024 with sunset provisions in 2025",
            },
            severity: "MEDIUM",
          },
        ],
      },
    }

    const lowerQuery = topic.toLowerCase()
    const mockResult =
      mockSummaries[lowerQuery] ||
      mockSummaries[
        Object.keys(mockSummaries).find((key) =>
          key.includes(lowerQuery.split(" ")[0])
        ) || "tax"
      ]

    return NextResponse.json({
      summary: mockResult.summary,
      keyPoints: mockResult.keyPoints,
      contradictions: mockResult.contradictions,
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
