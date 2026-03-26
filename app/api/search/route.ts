import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

// Mock data for Phase 8 testing
const mockEntries = [
  {
    id: "1",
    title: "IRC 529 Education Savings Plans - Recent Updates",
    content: "Comprehensive guide on Section 529 qualified education plans. Key considerations: SECURE 2.0 changes allow up to $35,000 aggregate rollovers to Roth IRAs, age limits apply. Suitable for high-income clients planning education expenses. Tax-free growth for qualified education expenses.",
    type: "tax",
    topic: "Education Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "2",
    title: "Pass-Through Entity Tax (PTET) State Credits",
    content: "Overview of state-level PTET options for S-Corps, LLCs, and partnerships. States offering PTET elections: Mississippi, Oklahoma, Tennessee, Utah. Benefits include federal deduction for state taxes paid. Planning opportunity for 2024 with sunset provisions in 2025.",
    type: "tax",
    topic: "Business Taxation",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "3",
    title: "Cryptocurrency and Digital Assets - Tax Treatment",
    content: "IRS guidance on cryptocurrency taxation, including wash sale rules (do not apply), charitable contributions of crypto, and mining income. Form 8949 and Schedule D requirements. Recent enforcement priorities focus on unreported transactions over $10,000.",
    type: "tax",
    topic: "Digital Assets",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
    author: "Compliance Team",
  },
  {
    id: "4",
    title: "ASC 842 Lease Accounting Implementation",
    content: "Detailed implementation guide for ASC 842 lease accounting standards. All leases (except short-term and low-value) require right-of-use asset recognition. Operating vs finance lease distinction removed. Impacts balance sheet presentation and financial metrics.",
    type: "accounting",
    topic: "GAAP Standards",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 21*24*60*60*1000).toISOString(),
    author: "Accounting Standards",
  },
  {
    id: "5",
    title: "Multi-State Tax Nexus and Apportionment",
    content: "Analysis of state tax nexus requirements post-South Dakota v. Wayfair. Physical presence no longer required for sales tax. Property and payroll factors in apportionment formulas. Double taxation relief mechanisms. Planning strategies for multistate businesses.",
    type: "tax",
    topic: "State Taxes",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "6",
    title: "Estate Planning with Spousal Lifetime Access Trusts (SLATs)",
    content: "SLAT strategy overview: transfers to irrevocable trust for spouse with Crummey powers. Leverages annual exclusion and GST exemption. Divorce risks and mitigations. Portability election coordination. Estate tax savings of 40% on transferred assets.",
    type: "planning",
    topic: "Estate Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 10*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
]

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "approved"
    const type = searchParams.get("type") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Filter mock data
    let results = mockEntries

    // Status filter
    if (status && status !== "all") {
      results = results.filter((e: any) => e.status === status)
    }

    // Text search
    if (q) {
      const lowerQ = q.toLowerCase()
      results = results.filter((e: any) =>
        e.content.toLowerCase().includes(lowerQ) ||
        e.title.toLowerCase().includes(lowerQ)
      )
    }

    // Type filter
    if (type && type !== "all") {
      results = results.filter((e: any) => e.type === type)
    }

    // Check visibility rules
    const isAdmin = session.user.isAdmin === true
    const visibleEntries = results.filter((entry: any) => {
      // Admins see everything
      if (isAdmin) return true
      // Staff see published entries
      return entry.status === "approved" && !entry.isPrivate
    })

    // Apply pagination
    const paginatedEntries = visibleEntries.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedEntries,
      total: visibleEntries.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
