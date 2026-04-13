import {
  TrendingUp, Globe, ShoppingBag, Calendar, Users,
  Target, Zap, BarChart3, Lightbulb, Sun, Clock, RefreshCw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type InsightSource = 'internal' | 'industry'

interface TrendInsight {
  id: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  badge: string
  badgeVariant: 'default' | 'success' | 'warning' | 'danger'
  description: string
  stats: { label: string; value: string }[]
  recommendation: string
  source: InsightSource
  lastUpdated: string
}

const trends: TrendInsight[] = [
  {
    id: 'trend-1',
    icon: Globe,
    iconColor: 'text-primary',
    iconBg: 'bg-primary-50',
    title: 'Indonesia Golf Market Growth',
    badge: '+12-15% CAGR',
    badgeVariant: 'success',
    description:
      'The Indonesian golf retail market is estimated at Rp 4.2T (USD 260M) in 2026, driven by rising middle-class participation and corporate golf culture. Jakarta remains the dominant market, but regional cities like Surabaya and Bandung are experiencing rapid growth.',
    stats: [
      { label: 'Market Size', value: 'Rp 4.2T' },
      { label: 'Growth Rate', value: '12-15% CAGR' },
      { label: 'Active Golfers', value: '~350K' },
      { label: 'Golf Courses', value: '180+' },
    ],
    recommendation:
      'Expand regional presence strategically. Surabaya and Bandung branches should receive increased inventory allocation and marketing budget. Consider Medan and Makassar as next expansion targets based on golf course density and disposable income data.',
    source: 'industry',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'trend-2',
    icon: ShoppingBag,
    iconColor: 'text-gold',
    iconBg: 'bg-gold-50',
    title: 'Premium Equipment Segment Surge',
    badge: '+18% YoY',
    badgeVariant: 'success',
    description:
      'Japanese brands (MAJESTY, BRIDGESTONE) continue to dominate the premium segment in Indonesia. Average transaction values are increasing as customers trade up from mid-range to premium equipment. MAJESTY products account for 28% of Topgolf revenue despite representing only 8% of units sold.',
    stats: [
      { label: 'Premium Share', value: '28% of revenue' },
      { label: 'Avg Premium TXN', value: 'Rp 35M+' },
      { label: 'MAJESTY Growth', value: '+22% YoY' },
      { label: 'Trade-up Rate', value: '34%' },
    ],
    recommendation:
      'Double down on MAJESTY and TITLEIST partnerships. Create exclusive Topgolf edition products with Japanese brand partners. Implement a premium customer loyalty program targeting high-value repeat buyers at SCBD, Pondok Indah, and Plaza Indonesia branches.',
    source: 'internal',
    lastUpdated: '2026-04-07',
  },
  {
    id: 'trend-3',
    icon: Target,
    iconColor: 'text-info',
    iconBg: 'bg-blue-50',
    title: 'Technology-Driven Club Fitting',
    badge: '+35% YoY',
    badgeVariant: 'success',
    description:
      'Launch monitor and AI-powered club fitting is seeing rapid adoption among Indonesian golfers. Customers are willing to pay Rp 1-2M for premium fitting experiences, and fitted club purchases have 40% higher satisfaction rates and lower return rates.',
    stats: [
      { label: 'Fitting Revenue Growth', value: '+28% QoQ' },
      { label: 'Fitting Margin', value: '72%' },
      { label: 'Attach Rate (Current)', value: '23%' },
      { label: 'Target Attach Rate', value: '50%+' },
    ],
    recommendation:
      'Invest in expanding fitting bays by 30% at top-5 Jakarta branches. Add TrackMan and Foresight launch monitors. Bundle fitting sessions with premium club purchases -- current 23% attach rate has significant room to grow to 50%+, representing an additional Rp 15B+ annual revenue opportunity.',
    source: 'internal',
    lastUpdated: '2026-04-07',
  },
  {
    id: 'trend-4',
    icon: Users,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    title: 'Women & Youth Participation Boom',
    badge: '+25% YoY',
    badgeVariant: 'success',
    description:
      'Ladies-only golf clinics are seeing strong demand in Jakarta, and junior programs are expanding rapidly. Parents are investing in premium junior equipment, and beginner fitting sessions are up 40% QoQ at Bellezza and SCBD branches.',
    stats: [
      { label: 'Women Golfers Growth', value: '+25% YoY' },
      { label: 'Junior Program Sign-ups', value: '+40% QoQ' },
      { label: 'Beginner Fittings', value: '+40% QoQ' },
      { label: 'Women Apparel Sales', value: '+32% YoY' },
    ],
    recommendation:
      'Launch dedicated "Ladies Golf" and "Junior Academy" programs at 5 flagship branches. Partner with women golf influencers for social media campaigns. Stock women-specific equipment lines and create Instagram-worthy in-store experiences. This demographic represents the fastest-growing segment with high lifetime value.',
    source: 'internal',
    lastUpdated: '2026-04-07',
  },
  {
    id: 'trend-5',
    icon: Calendar,
    iconColor: 'text-warning',
    iconBg: 'bg-amber-50',
    title: 'Seasonal Demand Patterns',
    badge: 'Cyclical',
    badgeVariant: 'warning',
    description:
      'Indonesian golf retail follows distinct seasonal patterns driven by religious holidays and school calendars. Hari Raya Idul Fitri (May) drives the biggest spike with 25% above-average sales, followed by Christmas/year-end (Dec) at +20%. Post-holiday January shows the deepest dip at -15%.',
    stats: [
      { label: 'Peak: Hari Raya (May)', value: '+25% lift' },
      { label: 'Peak: Christmas (Dec)', value: '+20% lift' },
      { label: 'Independence Day (Aug)', value: '+5% lift' },
      { label: 'Post-Holiday Dip (Jan)', value: '-15%' },
    ],
    recommendation:
      'Pre-position inventory 8 weeks before peak periods (MAJESTY supply chain lead time). Create Lebaran gift sets for corporate buyers at SCBD and Plaza Indonesia. Run "New Year, New Gear" promotions in January to mitigate the post-holiday dip. Staff up with 20% additional part-time promoters during peak weeks.',
    source: 'internal',
    lastUpdated: '2026-04-07',
  },
  {
    id: 'trend-6',
    icon: Zap,
    iconColor: 'text-danger',
    iconBg: 'bg-red-50',
    title: 'Digital & Social Commerce Disruption',
    badge: 'Emerging',
    badgeVariant: 'warning',
    description:
      'Golf influencer marketing is driving brand discovery on Instagram and TikTok. Live shopping events for golf equipment are gaining traction on Shopee, with Topgolf marketplace transactions growing 45% QoQ. However, marketplace settlement delays remain a challenge.',
    stats: [
      { label: 'Shopee TXN Growth', value: '+45% QoQ' },
      { label: 'Social Referral Rate', value: '18%' },
      { label: 'Live Shopping Conv.', value: '4.2%' },
      { label: 'Settlement Avg Delay', value: 'T+4.1 days' },
    ],
    recommendation:
      'Hire a dedicated social commerce manager. Launch bi-weekly live shopping events on Shopee featuring product demos and flash deals. Negotiate improved settlement terms with Shopee (current T+4 vs stated T+3). Partner with 3-5 golf micro-influencers for authentic content creation.',
    source: 'industry',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'trend-7',
    icon: BarChart3,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'Competitive Landscape Shifts',
    badge: 'Moderate Risk',
    badgeVariant: 'danger',
    description:
      'Golf House Indonesia is expanding its multi-brand portfolio, MST Golf is competing aggressively on price, and The Golf Shop is growing rapidly with an online-first approach. Topgolf Indonesia\'s advantage lies in its premium positioning and fitting expertise.',
    stats: [
      { label: 'Market Position', value: '#2 Premium' },
      { label: 'Brand Partnerships', value: '8 exclusive' },
      { label: 'Fitting Capability', value: 'Industry-leading' },
      { label: 'Store Network', value: '15 locations' },
    ],
    recommendation:
      'Defend premium positioning by deepening brand partnerships (exclusive product launches with MAJESTY and TITLEIST). Differentiate through fitting services -- competitors cannot easily replicate this capability. Avoid price wars with MST Golf; instead, focus on value-added services and customer experience.',
    source: 'industry',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'trend-8',
    icon: Sun,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    title: 'Sustainability & ESG in Golf',
    badge: 'Emerging',
    badgeVariant: 'warning',
    description:
      'Eco-friendly golf apparel is gaining market share globally, and Indonesian consumers are increasingly aware of sustainability. Recyclable packaging is becoming a customer expectation, and carbon-neutral events serve as a corporate differentiator.',
    stats: [
      { label: 'Eco-apparel Growth', value: '+20% globally' },
      { label: 'Consumer Awareness', value: '45% consider ESG' },
      { label: 'Corporate Events', value: 'Carbon-neutral demand +30%' },
      { label: 'Packaging Expectation', value: '62% prefer eco' },
    ],
    recommendation:
      'Introduce eco-friendly product lines from brands like adidas (Parley collection) and PUMA (sustainable materials). Implement recyclable packaging across all branches. Position Topgolf as the sustainability leader in Indonesian golf retail -- this differentiator will attract corporate partnerships and ESG-conscious consumers.',
    source: 'industry',
    lastUpdated: '2026-04-01',
  },
]

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TrendsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Trend Insights"
        description="Golf industry trends and actionable insights for Topgolf Indonesia"
        actions={
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <RefreshCw size={12} className="text-primary" />
              <span className="text-xs">Internal: Weekly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw size={12} className="text-gold" />
              <span className="text-xs">Industry: Monthly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lightbulb size={14} className="text-gold" />
              <span>{trends.length} insights</span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trends.map((trend, idx) => {
          const Icon = trend.icon
          return (
            <Card key={trend.id} className="card-hover animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${trend.iconBg} shrink-0`}>
                      <Icon size={20} className={trend.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{trend.title}</CardTitle>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                        trend.source === 'internal'
                          ? 'bg-primary-50 text-primary'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {trend.source === 'internal' ? 'Internal Data' : 'Industry'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={trend.badgeVariant}>
                      {trend.badge}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={9} />
                      {formatDateShort(trend.lastUpdated)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {trend.description}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {trend.stats.map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-background px-3 py-2"
                    >
                      <p className="text-xs text-text-muted">{stat.label}</p>
                      <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendation callout */}
                <div className="border-l-4 border-gold bg-gold-50 rounded-r-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp size={16} className="text-gold-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                        How This Affects Topgolf
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {trend.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
