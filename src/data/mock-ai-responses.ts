export interface AIResponseTemplate {
  id: string
  questionPatterns: string[] // keywords to match against user input
  question: string // example question for display
  response: string // markdown-formatted response
  category: 'sales' | 'product' | 'operations' | 'strategy' | 'finance' | 'industry'
}

export const aiResponses: AIResponseTemplate[] = [
  {
    id: 'AI001',
    questionPatterns: ['top selling', 'best selling', 'best product', 'most popular', 'top product'],
    question: 'What are our top-selling products this quarter?',
    category: 'product',
    response: `## Top-Selling Products - Q1 2026

Based on our sales data across all 15 active branches:

| Rank | Product | Units Sold | Revenue (IDR) |
|------|---------|-----------|---------------|
| 1 | TITLEIST Pro V1 (1 dozen) | 1,842 | Rp 1.75B |
| 2 | FOOTJOY ProDry Polo Shirt | 1,356 | Rp 1.63B |
| 3 | MAJESTY Prestigio XII Driver | 187 | Rp 8.42B |
| 4 | PING G430 MAX Driver | 423 | Rp 4.02B |
| 5 | Basic Club Fitting Session | 967 | Rp 483M |

### Key Insights
- **Golf Balls** continue to dominate unit volume, accounting for ~30% of all transactions
- **MAJESTY Prestigio XII** is the revenue king despite lower units -- premium pricing at Rp 45M drives this
- **Fitting Services** are growing 18% QoQ, indicating strong demand for personalized experiences
- **SCBD Premier** and **Pondok Indah** branches drive 35% of premium club sales

> **Recommendation:** Consider bundling fitting sessions with premium club purchases to increase attachment rate and average transaction value.`,
  },
  {
    id: 'AI002',
    questionPatterns: ['revenue', 'sales performance', 'how are we doing', 'monthly sales', 'sales trend'],
    question: 'How is our overall revenue trending?',
    category: 'sales',
    response: `## Revenue Trend Analysis - Last 12 Months

### Monthly Revenue (All Branches)
| Month | Revenue (IDR) | vs Prev Month | vs Same Month LY |
|-------|--------------|---------------|-------------------|
| Apr 2026 | Rp 38.2B | +8.5% | +22.1% |
| Mar 2026 | Rp 35.2B | +4.1% | +19.8% |
| Feb 2026 | Rp 33.8B | +2.3% | +17.5% |
| Jan 2026 | Rp 33.1B | -8.2% | +15.9% |
| Dec 2025 | Rp 36.0B | +9.1% | +14.2% |
| Nov 2025 | Rp 33.0B | +5.7% | +12.8% |

### Key Observations
- **YTD Revenue:** Rp 140.3B (on track for Rp 420B annual target)
- **Strongest month:** May 2025 at Rp 39.1B (Hari Raya Idul Fitri effect)
- **Growth trajectory:** Consistent 15-22% YoY growth across all months
- **April 2026** is trending strong due to Ramadan gift-buying season

### Branch Performance Highlights
- **SCBD Premier** leads with Rp 3.8B monthly avg (premium location effect)
- **PIK Avenue** and **Surabaya** showing fastest growth at 25%+ YoY
- **Balikpapan** smallest by revenue but highest growth rate at 32% YoY

> **Recommendation:** Allocate additional inventory to high-growth branches (PIK Avenue, Surabaya, Bandung) ahead of the Lebaran peak.`,
  },
  {
    id: 'AI003',
    questionPatterns: ['branch', 'store performance', 'branch comparison', 'which store', 'location'],
    question: 'Which branches are performing best and worst?',
    category: 'operations',
    response: `## Branch Performance Ranking - April 2026

### Top 5 Performers (by Revenue vs Target)
| Branch | Revenue | Target | Achievement | Trend |
|--------|---------|--------|-------------|-------|
| SCBD Premier | Rp 4.1B | Rp 3.6B | 114% | Stable |
| Pondok Indah | Rp 3.7B | Rp 3.3B | 112% | Up |
| Plaza Indonesia | Rp 3.4B | Rp 3.0B | 113% | Up |
| Bellezza | Rp 2.9B | Rp 2.55B | 114% | Stable |
| PIK Avenue | Rp 2.8B | Rp 2.25B | 124% | Strong Up |

### Bottom 5 Performers
| Branch | Revenue | Target | Achievement | Issue |
|--------|---------|--------|-------------|-------|
| Balikpapan | Rp 0.85B | Rp 0.75B | 113% | Low volume |
| Hosel Yogyakarta | Rp 1.1B | Rp 0.9B | 122% | Still ramping |
| Rawamangun | Rp 1.4B | Rp 1.2B | 117% | Limited foot traffic |
| Pluit Village | Rp 1.7B | Rp 1.5B | 113% | Competitive area |
| Bandung | Rp 1.5B | Rp 1.2B | 125% | Growing market |

### Data Sync Status
- **12 branches** fully synced (data < 3 hours old)
- **2 branches** partial sync (Rawamangun, Balikpapan -- POS connectivity issues)
- **1 branch** missing recent data (Banjarmasin -- inactive status)

> **Action Items:** Schedule POS system check for Rawamangun branch. Balikpapan may benefit from a targeted marketing campaign to boost foot traffic.`,
  },
  {
    id: 'AI004',
    questionPatterns: ['reconciliation', 'settlement', 'payment', 'discrepancy', 'mismatch'],
    question: 'What is the current reconciliation status?',
    category: 'finance',
    response: `## Payment Reconciliation Summary - April 2026

### Overall Status
- **Total Transactions (90 days):** 520
- **Matched:** 458 (88.1%)
- **Discrepancies:** 42 (8.1%)
- **Unmatched:** 20 (3.8%)

### Discrepancy Breakdown
| Type | Count | Total Amount (IDR) | Priority |
|------|-------|--------------------|----------|
| Amount Mismatch (MDR) | 18 | Rp 12.4M | Medium |
| Missing Bank Record | 12 | Rp 89.2M | High |
| Timing Difference | 7 | Rp 45.1M | Low |
| Duplicate Transaction | 3 | Rp 18.7M | Medium |
| Missing POS Record | 2 | Rp 8.3M | High |

### Settlement Performance by Provider
| Provider | Avg Settlement | On Time % | Overdue |
|----------|---------------|-----------|---------|
| BCA (Card) | T+1.2 | 96% | 2 |
| Mandiri (Card) | T+1.4 | 94% | 1 |
| GoPay | T+0.3 | 99% | 0 |
| OVO | T+0.4 | 98% | 0 |
| ShopeePay | T+3.8 | 88% | 3 |
| Shopee | T+4.1 | 85% | 2 |

### Pending Settlements
- **Total Pending:** Rp 234.5M across 15 transactions
- **Overdue (>expected):** Rp 67.8M (mostly Shopee marketplace)

> **Critical:** 12 transactions with missing bank records need immediate investigation. Recommend contacting BCA and Mandiri settlement teams for the missing Rp 89.2M.`,
  },
  {
    id: 'AI005',
    questionPatterns: ['reimbursement', 'expense', 'claims', 'pending approval'],
    question: 'What is the reimbursement pipeline status?',
    category: 'finance',
    response: `## Reimbursement Pipeline - Current Status

### Overview (Last 6 Months)
| Status | Count | Total Amount (IDR) | % of Total |
|--------|-------|--------------------|------------|
| Paid | 88 | Rp 47.2M | 40% |
| Approved (Awaiting Payment) | 55 | Rp 31.8M | 25% |
| Pending Approval | 44 | Rp 24.1M | 20% |
| Rejected | 22 | Rp 11.3M | 10% |
| Revision Required | 11 | Rp 5.8M | 5% |

### Average Processing Time
- **Submission to Approval:** 2.4 business days
- **Approval to Payment:** 4.1 business days
- **End-to-end:** 6.5 business days

### Top Expense Categories
1. **Dinner/Meals:** Rp 38.2M (32%) -- avg Rp 285K per claim
2. **Parking:** Rp 14.1M (12%) -- avg Rp 35K per claim
3. **Client Entertainment:** Rp 22.8M (19%) -- avg Rp 1.2M per claim
4. **Transportation:** Rp 16.5M (14%) -- avg Rp 145K per claim
5. **Fuel:** Rp 12.4M (10%) -- avg Rp 350K per claim

### Department Breakdown
| Department | Claims | Amount | Avg per Employee |
|------------|--------|--------|------------------|
| Sales | 98 | Rp 52.3M | Rp 8.7M |
| Marketing | 42 | Rp 28.1M | Rp 14.1M |
| Operations | 38 | Rp 18.9M | Rp 6.3M |
| IT | 22 | Rp 8.4M | Rp 8.4M |
| Finance | 20 | Rp 12.5M | Rp 6.3M |

> **Note:** Marketing department has highest per-employee expense due to client entertainment claims. Consider reviewing the entertainment policy threshold of Rp 2M per event.`,
  },
  {
    id: 'AI006',
    questionPatterns: ['vendor', 'supplier', 'accounts payable', 'outstanding', 'AP'],
    question: 'What is our vendor payment status?',
    category: 'finance',
    response: `## Vendor Payment Dashboard - April 2026

### Accounts Payable Summary
- **Total Outstanding:** Rp 2.87B across 30 vendors
- **Due This Week:** Rp 412M (8 invoices)
- **Overdue:** Rp 187M (5 invoices)
- **Early Payment Discounts Available:** Rp 8.2M (2/10 Net 30 terms)

### Top 5 Vendors by YTD Spend
| Vendor | YTD Paid | Outstanding | Terms |
|--------|----------|-------------|-------|
| PT MAJESTY Golf Indonesia | Rp 3.2B | Rp 420M | Net 60 |
| PT Acushnet Indonesia (TITLEIST) | Rp 2.1B | Rp 280M | Net 30 |
| PT Ping Golf Asia | Rp 1.8B | Rp 195M | Net 30 |
| PT Bridgestone Golf Indonesia | Rp 1.4B | Rp 165M | Net 60 |
| PT Callaway Golf Nusantara | Rp 1.1B | Rp 142M | Net 30 |

### Payment Pipeline
| Status | Invoices | Amount |
|--------|----------|--------|
| Received (Pending Verification) | 28 | Rp 645M |
| Verified | 22 | Rp 512M |
| Approved | 18 | Rp 387M |
| Scheduled for Payment | 15 | Rp 298M |
| Disputed | 8 | Rp 124M |

### Cash Flow Optimization
- **Capture early payment discounts:** Pay Garmin and Bushnell invoices within 10 days to save 2% (Rp 8.2M potential savings)
- **Net 60 vendors** (MAJESTY, Bridgestone, Dentsu): Rp 585M due in 30+ days -- safe to defer

> **Alert:** 5 overdue invoices from PT ISS Indonesia and PT Security One (services). Recommend immediate payment to maintain service continuity.`,
  },
  {
    id: 'AI007',
    questionPatterns: ['freelancer', 'tax', 'pph21', 'contractor', 'instructor'],
    question: 'How are our freelancer costs and tax obligations looking?',
    category: 'finance',
    response: `## Freelancer Cost & Tax Report - YTD 2026

### Overview
- **Active Freelancers:** 22 (out of 25 registered)
- **Total YTD Company Cost:** Rp 1.87B
- **Total PPh 21 Withheld/Borne:** Rp 142M
- **Pending Payments:** Rp 89M

### Cost by Role
| Role | Headcount | YTD Cost | Avg Monthly |
|------|-----------|----------|-------------|
| Golf Instructors | 8 | Rp 720M | Rp 22.5M/person |
| Event Hosts | 4 | Rp 285M | Rp 17.8M/person |
| Fitting Specialists | 4 | Rp 340M | Rp 21.3M/person |
| Photographers | 3 | Rp 245M | Rp 20.4M/person |
| Content Creators | 3 | Rp 195M | Rp 16.3M/person |
| Promoters | 3 | Rp 85M | Rp 7.1M/person |

### Tax Arrangement Breakdown
| Arrangement | Count | Tax Impact |
|-------------|-------|-----------|
| Gross + NPWP | 10 | Standard PPh 21 -- freelancer bears tax |
| Gross + No NPWP | 6 | 120% surcharge -- freelancer bears higher tax |
| Gross-Up + NPWP | 6 | Company bears tax (Rp 68M YTD) |
| Gross-Up + No NPWP | 3 | Company bears 120% tax (Rp 31M YTD) |

### Recommendations
1. **Encourage NPWP registration** for 9 freelancers without NPWP -- saves ~Rp 24M/year in surcharges
2. **Top instructor** Reza Mahendra (Rp 2M/session) may benefit from renegotiation as gross-up arrangement
3. **Consider converting** high-frequency fitting specialists to part-time employees for tax efficiency

> **Tax Calendar:** PPh 21 monthly deposits due by the 10th of each month. Next filing deadline: April 10, 2026 (for March payments).`,
  },
  {
    id: 'AI008',
    questionPatterns: ['forecast', 'predict', 'next month', 'projection', 'target'],
    question: 'What is the sales forecast for the next quarter?',
    category: 'strategy',
    response: `## Sales Forecast - Q2 2026 (May - July)

### Revenue Projections
| Month | Projected Revenue | Confidence | Key Driver |
|-------|-------------------|------------|------------|
| May 2026 | Rp 42.5B | High | Hari Raya Idul Fitri (expected May 19) |
| Jun 2026 | Rp 35.8B | Medium | Post-Lebaran normalization |
| Jul 2026 | Rp 33.2B | Medium | School holiday effect |
| **Q2 Total** | **Rp 111.5B** | | **+18% vs Q2 2025** |

### Methodology
- Based on 12-month trailing data with seasonal decomposition
- Adjusted for: branch growth trajectories, Ramadan/Lebaran calendar shift, new branch ramp-ups
- Historical accuracy: +/- 8% at monthly level

### Category Forecasts
| Category | Q2 Projection | Growth vs Q2 2025 |
|----------|--------------|-------------------|
| Golf Clubs | Rp 38.9B | +15% |
| Apparel | Rp 22.3B | +22% (Lebaran gift effect) |
| Golf Balls | Rp 11.1B | +12% |
| Accessories | Rp 14.5B | +20% |
| Golf Bags | Rp 13.4B | +14% |
| Fitting Services | Rp 11.3B | +28% |

### Branch-Level Opportunities
1. **Lebaran Gift Sets** -- Package premium items for corporate gifting (SCBD, Plaza Indonesia, Pondok Indah)
2. **Holiday Promotions** -- Fitting service bundles during school holidays (all branches)
3. **New Customer Acquisition** -- Beginner packages at growing branches (Surabaya, Bandung, PIK Avenue)

### Risks
- **Inventory constraint:** MAJESTY supply chain lead time is 8 weeks. Order by April 15 for May stock.
- **Staffing:** May require 20% more fitting specialists during Lebaran week.

> **Action Required:** Place MAJESTY and TITLEIST orders this week to ensure Lebaran stock availability. Current lead times suggest April 14 as the last safe order date.`,
  },
  {
    id: 'AI009',
    questionPatterns: ['golf trend', 'industry', 'market', 'competitor', 'golf indonesia'],
    question: 'What are the current golf industry trends in Indonesia?',
    category: 'industry',
    response: `## Golf Industry Trends - Indonesia 2026

### Market Overview
The Indonesian golf retail market is estimated at **Rp 4.2T (USD 260M)** in 2026, growing at **12-15% CAGR**. Key drivers include rising middle-class participation and corporate golf culture.

### Key Trends

#### 1. Premium Segment Growth (+18% YoY)
- Japanese brands (MAJESTY, BRIDGESTONE) continue to dominate the premium segment
- Average transaction values increasing as customers trade up
- **Our data confirms:** MAJESTY products account for 28% of our revenue despite 8% of units

#### 2. Technology-Driven Fitting (+35% YoY)
- Launch monitor and AI-powered club fitting gaining rapid adoption
- Customers willing to pay Rp 1-2M for premium fitting experiences
- **Our opportunity:** Fitting services growing 28% -- fastest category. Consider expanding fitting bays.

#### 3. Women & Youth Participation (+25% YoY)
- Ladies-only golf clinics seeing strong demand in Jakarta
- Junior programs expanding -- parents investing in premium junior equipment
- **Our data:** Beginner fitting sessions up 40% QoQ at Bellezza and SCBD branches

#### 4. Digital & Social Commerce
- Golf influencer marketing driving brand discovery (Instagram, TikTok)
- Live shopping events for golf equipment gaining traction on Shopee
- **Our marketplace transactions** (Shopee) growing 45% QoQ but settlement delays remain a challenge

#### 5. Sustainability & ESG
- Eco-friendly golf apparel gaining market share
- Recyclable packaging becoming a customer expectation
- Carbon-neutral events as corporate differentiator

### Competitive Landscape
| Competitor | Positioning | Key Strength |
|-----------|-------------|-------------|
| Golf House Indonesia | Multi-brand retail | Widest brand portfolio |
| MST Golf | Value segment | Aggressive pricing |
| The Golf Shop | Online-first | E-commerce expertise |
| **Topgolf Indonesia** | **Premium retail** | **Fitting expertise + brand partnerships** |

> **Strategic Recommendation:** Double down on fitting services (highest growth, highest margin) and expand women/youth programs to capture the fastest-growing demographics. Consider launching a loyalty program to improve retention.`,
  },
  {
    id: 'AI010',
    questionPatterns: ['category', 'product mix', 'margin', 'profitable', 'gross margin', 'cogs'],
    question: 'What is our product category performance and margin analysis?',
    category: 'sales',
    response: `## Product Category Performance & Margin Analysis

### Category Revenue & Margin (Last 12 Months)
| Category | Revenue | % of Total | Est. Gross Margin | Margin Amount |
|----------|---------|-----------|-------------------|---------------|
| Golf Clubs | Rp 147.2B | 35% | 28% | Rp 41.2B |
| Apparel | Rp 84.0B | 20% | 52% | Rp 43.7B |
| Accessories | Rp 54.6B | 13% | 45% | Rp 24.6B |
| Golf Bags | Rp 50.4B | 12% | 32% | Rp 16.1B |
| Golf Balls | Rp 42.0B | 10% | 22% | Rp 9.2B |
| Fitting Services | Rp 42.0B | 10% | 72% | Rp 30.2B |
| **Total** | **Rp 420.2B** | **100%** | **39.3% blended** | **Rp 165.0B** |

### Key Margin Insights
1. **Fitting Services** have the highest margin at 72% -- minimal COGS, high perceived value
2. **Apparel** is the "hidden champion" -- #2 in revenue but #1 in margin dollars (Rp 43.7B)
3. **Golf Clubs** drive top-line but lower margin due to brand pricing constraints
4. **Golf Balls** have the lowest margin -- high competition, price-sensitive customers

### Optimization Opportunities
- **Attach rate analysis:** Only 23% of club purchases include a fitting session. Target: 50%+
- **Apparel cross-sell:** Customers who buy clubs have 3.2x higher apparel spend in following 90 days
- **Accessory bundling:** GPS watches + rangefinders bundle could improve accessory margin by 5pp

### Category Trend (QoQ Growth)
| Category | Q4 2025 | Q1 2026 | Trend |
|----------|---------|---------|-------|
| Golf Clubs | +8% | +12% | Accelerating |
| Apparel | +15% | +18% | Strong growth |
| Fitting Services | +22% | +28% | Breakout |
| Accessories | +10% | +14% | Steady |
| Golf Bags | +5% | +8% | Moderate |
| Golf Balls | +3% | +5% | Slow |

> **Recommendation:** Shift floor space allocation to increase fitting bays by 30% and expand apparel displays. These two categories deliver Rp 73.9B in margin on Rp 126B revenue (59% margin) vs clubs at Rp 41.2B on Rp 147.2B (28% margin).`,
  },
  {
    id: 'AI011',
    questionPatterns: ['staffing', 'employee', 'headcount', 'team', 'hiring'],
    question: 'How is our staffing across branches?',
    category: 'operations',
    response: `## Staffing Overview - April 2026

### Headcount by Department
| Department | Headcount | % of Total | Avg Monthly Cost |
|------------|-----------|-----------|------------------|
| Sales | 8 | 53% | Rp 12M/person |
| Operations | 3 | 20% | Rp 14M/person |
| Finance | 2 | 13% | Rp 15M/person |
| Marketing | 2 | 13% | Rp 13M/person |
| IT | 1 | 7% | Rp 16M/person |

### Observations
- **Jakarta branches** are well-staffed with PICs and managers in each key location
- **Regional branches** (Surabaya, Yogyakarta, Bandung, Balikpapan) rely heavily on single PICs
- **Freelancer augmentation** adds equivalent of 22 FTEs across instructors, specialists, and creators

### Recommendations
1. **Hire additional Sales Associates** for SCBD Premier and Pondok Indah (highest revenue branches)
2. **Add a second Fitting Specialist** at top-3 Jakarta branches to reduce wait times
3. **Consider a Regional Manager** for East Indonesia (Surabaya, Balikpapan, Banjarmasin) to reduce COO span of control

> **Priority:** Pre-Lebaran seasonal hiring -- recommend 3-5 temporary promoters for mall activation events across Jakarta branches.`,
  },
  {
    id: 'AI012',
    questionPatterns: ['cash flow', 'working capital', 'liquidity', 'funds'],
    question: 'What does our cash flow look like?',
    category: 'finance',
    response: `## Cash Flow Snapshot - April 2026

### Working Capital Summary
| Item | Amount (IDR) | Notes |
|------|-------------|-------|
| Cash from Settled Transactions (30d) | +Rp 12.8B | 95% settlement rate |
| Pending Settlements | +Rp 234M | Expected within 5 days |
| Vendor Payments Due (30d) | -Rp 2.87B | Across 30 vendors |
| Freelancer Payments Due | -Rp 89M | April payments pending |
| Reimbursements Approved | -Rp 31.8M | Awaiting disbursement |
| **Net Position** | **+Rp 9.62B** | **Healthy** |

### Cash Conversion Cycle
- **Average Collection Period:** 1.3 days (mostly card/e-wallet, fast settlement)
- **Average Payment Period:** 38 days (weighted by vendor terms)
- **Cash Conversion Cycle:** -36.7 days (negative = favorable, we collect before we pay)

### Key Risks
1. **Shopee marketplace settlements** averaging T+4 vs stated T+3 -- Rp 67.8M overdue
2. **MAJESTY order due** this month: est. Rp 400-500M for Lebaran inventory
3. **PLN electricity** costs trending up 8% due to extended store hours

> **Recommendation:** Cash position is strong. Approve the MAJESTY Lebaran inventory order and capture available early payment discounts from Garmin/Bushnell (Rp 8.2M savings).`,
  },
]
