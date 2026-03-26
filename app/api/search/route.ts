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
  // --- Estate Planning cluster ---
  {
    id: "7",
    title: "Grantor Retained Annuity Trusts (GRATs) - 2025 Planning",
    content: "GRATs allow transfer of appreciation above the IRS 7520 rate to beneficiaries gift-tax free. Zeroed-out GRATs are most common. Ideal in low-interest-rate environments. Risk: grantor must survive the GRAT term. Walton GRAT strategy minimizes mortality risk. Current 7520 rate: 5.0% — still viable for high-growth assets like closely held business interests.",
    type: "planning",
    topic: "Estate Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 8*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  {
    id: "8",
    title: "Charitable Remainder Trusts (CRTs) - Income and Estate Tax Benefits",
    content: "CRTs provide income stream to donor (or other non-charitable beneficiary) for life or term, remainder to charity. Donor receives upfront charitable deduction based on present value of remainder interest. No capital gains on appreciated property contributed. Unitrust (CRUT) vs annuity trust (CRAT) distinction. Combine with life insurance replacement trust for heirs. Minimum 10% remainder value requirement.",
    type: "planning",
    topic: "Estate Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 6*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  {
    id: "9",
    title: "Portability Election and Deceased Spouse Unused Exclusion (DSUE)",
    content: "Portability allows surviving spouse to use deceased spouse's unused estate tax exclusion (DSUE). Must elect on timely-filed Form 706 — or use Rev. Proc. 2022-32 for up to 5-year late election. DSUE is 'stackable' across multiple deceased spouses — most recent only. Critical for estates under $13.61M combined. Note: DSUE does not shelter appreciation after death, unlike AB trust strategy.",
    type: "planning",
    topic: "Estate Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 4*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  // --- Business Taxation cluster ---
  {
    id: "10",
    title: "S-Corporation Reasonable Compensation Requirements",
    content: "IRS requires S-Corp shareholder-employees to receive reasonable W-2 wages before taking distributions. Failure exposes shareholders to employment tax on distributions recharacterized as wages. Reasonable compensation benchmarks: industry surveys, BLS data, comparable salaries. Recent IRS audit focus area. Formula approach: duties test, company size, training/experience. Document the analysis annually.",
    type: "tax",
    topic: "Business Taxation",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 11*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "11",
    title: "Section 199A Qualified Business Income (QBI) Deduction - 2025",
    content: "20% deduction for qualified business income from pass-through entities. Income thresholds: $197,300 (single) / $394,600 (MFJ) for 2025 — phase-in of W-2 wage and capital limitations. Specified service trades or businesses (SSTBs) fully phased out above threshold. Aggregation elections can optimize W-2 wage limitation. Sunset provision: QBI deduction expires after 2025 absent Congressional action.",
    type: "tax",
    topic: "Business Taxation",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "12",
    title: "R&D Tax Credits Under IRC Section 41 - Expanded Eligibility",
    content: "Research & Experimentation credit (20% of qualified research expenses over base amount). Eligible costs: wages, supplies, contract research (65% limitation). Section 174 amortization change: R&E expenditures must now be amortized over 5 years (15 years foreign). Small business alternative: payroll tax offset up to $500K. Documentation requirements: contemporaneous records, nexus to qualified purpose.",
    type: "tax",
    topic: "Business Taxation",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 9*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  // --- Retirement Planning cluster ---
  {
    id: "13",
    title: "IRA and 401(k) Contribution Limits 2025",
    content: "2025 contribution limits: Traditional/Roth IRA $7,000 ($8,000 age 50+). 401(k)/403(b) elective deferrals $23,500 ($31,000 age 50+; $34,750 age 60-63 under SECURE 2.0 super catch-up). SIMPLE IRA $16,500. Roth IRA phase-out: $150,000-$165,000 (single), $236,000-$246,000 (MFJ). Backdoor Roth strategy still viable for high earners. SEP IRA: lesser of 25% of compensation or $70,000.",
    type: "planning",
    topic: "Retirement Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  {
    id: "14",
    title: "Required Minimum Distributions (RMDs) - SECURE 2.0 Changes",
    content: "SECURE 2.0 raised RMD starting age to 73 (2023) and 75 (2033). RMDs no longer required from Roth 401(k)s starting 2024 — aligns with Roth IRA treatment. Penalty reduced from 50% to 25% (10% if corrected timely). Inherited IRA 10-year rule: non-eligible designated beneficiaries must empty by year 10; annual distributions required if decedent was taking RMDs. Surviving spouse new option: elect to be treated as decedent.",
    type: "planning",
    topic: "Retirement Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 13*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  {
    id: "15",
    title: "Roth Conversion Strategies for High-Income Clients",
    content: "Roth conversions taxable in year of conversion; no income limit. Optimal conversion window: years between retirement and RMD onset, or when marginal rate is lower than expected future rate. Strategies: partial conversions to fill tax brackets, coordinating with capital gains harvesting, NII surtax impact (3.8% on net investment income). Pro-rata rule applies to traditional IRA basis. Backdoor Roth for active workers. No wash sale concerns for converted securities.",
    type: "planning",
    topic: "Retirement Planning",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 18*24*60*60*1000).toISOString(),
    author: "Planning Team",
  },
  // --- State Taxes cluster ---
  {
    id: "16",
    title: "Mississippi Income Tax Elimination - Planning Impact",
    content: "Mississippi phasing out individual income tax entirely by 2030 — first state to fully eliminate income tax since Alaska (1980). 2025: flat 4% rate. 2026-2029: phased reduction to 0%. Corporate income tax remains. Planning considerations: accelerate income to Mississippi years, evaluate S-Corp vs C-Corp structures, domicile planning for retirees. May trigger other states to compete.",
    type: "tax",
    topic: "State Taxes",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 16*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "17",
    title: "Remote Worker State Tax Obligations - Post-COVID Guidance",
    content: "Employees working remotely may create income tax nexus in their state of residence, separate from employer's state. Convenience-of-employer rule: CT, DE, NE, NY, PA tax nonresidents on days worked remotely if remote work is for employee's convenience (not employer necessity). Reciprocity agreements affect about 30 state pairs. Employers face payroll withholding obligations. W-2 issued in wrong state triggers refund complexity.",
    type: "tax",
    topic: "State Taxes",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 20*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "18",
    title: "State Sales Tax Exemptions for Professional Services",
    content: "Most states exempt professional services (accounting, legal, consulting) from sales tax. Exceptions: Hawaii (4% GET on all services), New Mexico, South Dakota, Washington (B&O tax). Mixed transactions (software + services): true object test determines taxability. SaaS taxability varies by state — approximately 24 states now tax SaaS. Bundled transactions can taint exempt services. Review client invoices for state compliance.",
    type: "tax",
    topic: "State Taxes",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 25*24*60*60*1000).toISOString(),
    author: "Compliance Team",
  },
  // --- GAAP Standards cluster ---
  {
    id: "19",
    title: "ASC 606 Revenue Recognition - Common Implementation Issues",
    content: "Five-step model: identify contract, identify performance obligations, determine transaction price, allocate price, recognize revenue. Common issues: variable consideration (constraint analysis), principal vs agent determination, licenses (right to use vs right to access). Contract modifications prospective vs cumulative catch-up. Disclosure requirements are extensive — disaggregated revenue, contract balances, performance obligations. Software: term licenses vs SaaS distinction critical.",
    type: "accounting",
    topic: "GAAP Standards",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
    author: "Accounting Standards",
  },
  {
    id: "20",
    title: "ASC 350 Goodwill Impairment - Private Company Alternatives",
    content: "Public companies: annual quantitative or qualitative (step zero) test. Private company alternative (ASU 2014-18): amortize goodwill over useful life (up to 10 years) and test only on triggering event. ASU 2021-03: extended triggering event assessment to annual. Reporting unit definition: operating segment or one level below. Step 1 only since ASU 2017-04 eliminated step 2. Fair value techniques: income, market, asset approaches.",
    type: "accounting",
    topic: "GAAP Standards",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 35*24*60*60*1000).toISOString(),
    author: "Accounting Standards",
  },
  {
    id: "21",
    title: "ASC 326 Current Expected Credit Losses (CECL) for Smaller Institutions",
    content: "CECL requires lifetime expected credit loss estimates at origination — replaces incurred loss model. Small private companies and nonprofits adopted for fiscal years beginning after 12/15/2022. Practical expedients: collateral-dependent assets, zero-credit-loss assets. Common methods: loss rate, roll rate, discounted cash flow, PD/LGD. Qualitative overlays still required. Significant increase in documentation burden vs prior GAAP.",
    type: "accounting",
    topic: "GAAP Standards",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 40*24*60*60*1000).toISOString(),
    author: "Accounting Standards",
  },
  // --- Digital Assets cluster (extends entry 3) ---
  {
    id: "22",
    title: "NFT Tax Treatment - Collectibles vs Capital Assets",
    content: "IRS Notice 2023-27: certain NFTs may be taxed as collectibles (28% max rate) rather than capital assets (20% max rate). Look-through analysis: if NFT represents ownership of underlying collectible (artwork, gems), it inherits collectible character. Creator taxation: NFTs created and sold by artist are ordinary income, not capital gain. Royalties from secondary sales: ordinary income in year received. Form 1099-DA reporting starting 2025.",
    type: "tax",
    topic: "Digital Assets",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 12*24*60*60*1000).toISOString(),
    author: "Compliance Team",
  },
  {
    id: "23",
    title: "Stablecoin Tax Treatment and Reporting - 2025 Guidance",
    content: "Stablecoins are property for U.S. tax purposes despite price stability. Gains/losses recognized on every exchange, even stablecoin-to-stablecoin swaps. De minimis exception proposed but not yet law. Algorithmic vs collateral-backed stablecoins — IRS has not distinguished. Form 1099-DA: brokers required to report digital asset transactions beginning 2025. FBAR and Form 8938 filing required if offshore stablecoin holdings exceed thresholds.",
    type: "tax",
    topic: "Digital Assets",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 17*24*60*60*1000).toISOString(),
    author: "Compliance Team",
  },
  // --- Individual Tax ---
  {
    id: "24",
    title: "Qualified Opportunity Zones - 2025 Final Investment Window",
    content: "QOZ investments offer deferral, reduction, and exclusion of capital gains. Original basis step-up (10%/15%) expired — only deferral and exclusion remain. To qualify for 10-year gain exclusion, investment must be held through 12/31/2047 (or fund liquidation date if earlier). 180-day investment window from triggering sale. QOZB must derive 50%+ gross income from active conduct within zone. Substantial improvement test: double adjusted basis within 30 months.",
    type: "tax",
    topic: "Individual Tax",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 22*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  {
    id: "25",
    title: "Charitable Contribution Strategies - Donor Advised Funds and Bunching",
    content: "Bunching charitable contributions into alternating years maximizes itemized deductions above standard deduction ($15,000 single / $30,000 MFJ in 2025). Donor Advised Funds (DAFs): contribute appreciated securities, take immediate deduction, recommend grants over time. Qualified Charitable Distributions (QCDs): up to $105,000 directly from IRA to charity (age 70½+), excludes from income. Conservation easements: IRS heightened scrutiny, syndicated transactions listed as tax shelter. Appraisal requirements for non-cash gifts over $5,000.",
    type: "tax",
    topic: "Individual Tax",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 27*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
  },
  // --- International Tax ---
  {
    id: "26",
    title: "GILTI and BEAT - Minimum Tax Provisions for US Multinationals",
    content: "Global Intangible Low-Taxed Income (GILTI): US shareholders of CFCs include GILTI in income — net CFC tested income over 10% return on qualified business asset investment. Corporate rate: 10.5% (21% gross, 50% deduction, 80% FTC). Individual CFC shareholders taxed at ordinary rates — may elect Section 962. Base Erosion and Anti-Abuse Tax (BEAT): 10% minimum on modified taxable income for large corporations making deductible payments to foreign affiliates. Pillar Two global minimum tax 15%: OECD alignment pending US legislation.",
    type: "tax",
    topic: "International Tax",
    status: "approved",
    isPrivate: false,
    createdAt: new Date(Date.now() - 33*24*60*60*1000).toISOString(),
    author: "Tax Research Team",
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
