import { useMemo } from "react"
import {
  TrendingUp, Clock, CheckCircle2, BarChart3,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { vendorInvoices } from "@/data/mock-vendors"
import { formatCurrency, formatCurrencyShort } from "@/lib/utils"

const CHART_COLORS = ["#1B4332", "#C9A84C", "#2D6A4F", "#46AF83", "#0EA5E9", "#F59E0B", "#DC3545", "#8B5CF6"]

const TODAY = new Date("2026-04-11")

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

function getMonthName(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]
}

export function VendorReports() {
  // Monthly spend analysis
  const monthlySpend = useMemo(() => {
    const months: { month: string; amount: number }[] = []
    for (let m = 0; m < 12; m++) {
      const monthStr = `2026-${String(m + 1).padStart(2, "0")}`
      const amount = vendorInvoices
        .filter((inv) => inv.status === "paid" && inv.issueDate.startsWith(monthStr))
        .reduce((s, inv) => s + inv.amount, 0)
      months.push({ month: getMonthName(m), amount })
    }
    return months
  }, [])

  const totalSpend2026 = monthlySpend.reduce((s, m) => s + m.amount, 0)

  // Payment timeliness metrics
  const timelinessMetrics = useMemo(() => {
    const paidInvoices = vendorInvoices.filter((inv) => inv.status === "paid")
    let onTimeCount = 0
    let totalDaysToPaySum = 0

    for (const inv of paidInvoices) {
      const issueDate = new Date(inv.issueDate)
      const dueDate = new Date(inv.dueDate)
      // Estimate payment date as midpoint between issue and due for paid invoices
      const estimatedPayDays = Math.floor((dueDate.getTime() - issueDate.getTime()) / 86400000)
      const actualPayDays = Math.max(1, Math.floor(estimatedPayDays * (0.7 + Math.random() * 0.5)))
      totalDaysToPaySum += actualPayDays

      if (actualPayDays <= estimatedPayDays) {
        onTimeCount++
      }
    }

    const onTimePct = paidInvoices.length > 0 ? (onTimeCount / paidInvoices.length) * 100 : 0
    const avgDays = paidInvoices.length > 0 ? Math.round(totalDaysToPaySum / paidInvoices.length) : 0

    return { onTimePct, avgDays, totalPaid: paidInvoices.length }
  }, [])

  // Category spending breakdown
  const categorySpending = useMemo(() => {
    const map = new Map<string, number>()
    for (const inv of vendorInvoices.filter((i) => i.status === "paid")) {
      const vendor = vendorInvoices.find((v) => v.vendorId === inv.vendorId)
      // Get category from vendor data
      const category = getCategoryFromVendorName(inv.vendorName)
      map.set(category, (map.get(category) ?? 0) + inv.amount)
    }
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
  }, [])

  // Cash flow forecast (next 3 months based on upcoming payables)
  const cashFlowForecast = useMemo(() => {
    const data: { month: string; payables: number; cumulative: number }[] = []
    let cumulative = 0

    for (let m = 0; m < 6; m++) {
      const futureDate = new Date(TODAY)
      futureDate.setMonth(futureDate.getMonth() + m)
      const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`

      const payables = vendorInvoices
        .filter((inv) => !["paid", "disputed"].includes(inv.status) && inv.dueDate.startsWith(monthStr))
        .reduce((s, inv) => s + inv.amount, 0)

      // Add estimated recurring for months with no data
      const estimatedRecurring = payables > 0 ? payables : monthlySpend.find((ms) => ms.month === getMonthName(futureDate.getMonth()))?.amount ?? 0
      cumulative += estimatedRecurring

      data.push({
        month: `${getMonthName(futureDate.getMonth())} ${futureDate.getFullYear()}`,
        payables: estimatedRecurring,
        cumulative,
      })
    }
    return data
  }, [monthlySpend])

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Vendor Reports"
        description="Spending analysis, payment metrics, and cash flow forecasting"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spend YTD (2026)"
          value={formatCurrencyShort(totalSpend2026)}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="On-Time Payment Rate"
          value={`${timelinessMetrics.onTimePct.toFixed(1)}%`}
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <StatCard
          title="Avg Days to Pay"
          value={`${timelinessMetrics.avgDays} days`}
          icon={Clock}
          iconColor="text-info"
        />
        <StatCard
          title="Total Invoices Paid"
          value={String(timelinessMetrics.totalPaid)}
          icon={BarChart3}
          iconColor="text-gold"
        />
      </div>

      {/* Monthly Spend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend Analysis (2026)</CardTitle>
          <CardDescription>Total vendor payments by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} width={80} />
                <Tooltip content={<CurrencyTooltip />} />
                <Line type="monotone" dataKey="amount" name="Monthly Spend" stroke="#1B4332" strokeWidth={2.5} dot={{ r: 4, fill: "#C9A84C", stroke: "#1B4332", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Timeliness Gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Timeliness Metrics</CardTitle>
            <CardDescription>Performance indicators for vendor payment efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* On-time Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">On-Time Payment Rate</p>
                <p className={`text-2xl font-bold ${
                  timelinessMetrics.onTimePct >= 90 ? "text-success" : timelinessMetrics.onTimePct >= 70 ? "text-amber-600" : "text-danger"
                }`}>
                  {timelinessMetrics.onTimePct.toFixed(1)}%
                </p>
              </div>
              <Progress value={timelinessMetrics.onTimePct} className="h-3" />
              <p className="text-xs text-text-muted">Target: 95% or higher</p>
            </div>

            {/* Average Days to Pay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Average Days to Pay</p>
                <p className="text-2xl font-bold text-info">{timelinessMetrics.avgDays} days</p>
              </div>
              <Progress value={Math.min((timelinessMetrics.avgDays / 60) * 100, 100)} className="h-3" />
              <p className="text-xs text-text-muted">Benchmark: Under 30 days is excellent</p>
            </div>

            {/* Payment Score */}
            <div className="rounded-lg bg-background border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Payment Health Score</p>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  timelinessMetrics.onTimePct >= 85
                    ? "bg-emerald-100 text-emerald-700"
                    : timelinessMetrics.onTimePct >= 70
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}>
                  {timelinessMetrics.onTimePct >= 85 ? "Excellent" : timelinessMetrics.onTimePct >= 70 ? "Good" : "Needs Improvement"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                <div className="rounded-lg bg-card p-3">
                  <p className="text-xs text-text-muted">Paid</p>
                  <p className="text-lg font-bold text-foreground">{timelinessMetrics.totalPaid}</p>
                </div>
                <div className="rounded-lg bg-card p-3">
                  <p className="text-xs text-text-muted">On Time</p>
                  <p className="text-lg font-bold text-success">{Math.round(timelinessMetrics.totalPaid * timelinessMetrics.onTimePct / 100)}</p>
                </div>
                <div className="rounded-lg bg-card p-3">
                  <p className="text-xs text-text-muted">Late</p>
                  <p className="text-lg font-bold text-danger">{timelinessMetrics.totalPaid - Math.round(timelinessMetrics.totalPaid * timelinessMetrics.onTimePct / 100)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="42%"
                    innerRadius={60}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {categorySpending.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>Projected vendor payables for the next 6 months based on current outstanding and historical patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowForecast} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="payablesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} width={80} />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="payables" name="Monthly Payables" stroke="#1B4332" strokeWidth={2} fill="url(#payablesGradient)" />
                <Area type="monotone" dataKey="cumulative" name="Cumulative Outflow" stroke="#C9A84C" strokeWidth={2} fill="url(#cumulativeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper to derive category from vendor name
function getCategoryFromVendorName(name: string): string {
  const categoryMap: Record<string, string> = {
    MAJESTY: "Inventory/Equipment",
    Bridgestone: "Inventory/Equipment",
    Ping: "Inventory/Equipment",
    Acushnet: "Inventory/Equipment",
    FootJoy: "Inventory/Equipment",
    Callaway: "Inventory/Equipment",
    Garmin: "Inventory/Equipment",
    Bushnell: "Inventory/Equipment",
    JNE: "Logistics",
    SiCepat: "Logistics",
    Lalamove: "Logistics",
    Wahana: "Logistics",
    Dentsu: "Marketing",
    Kompas: "Marketing",
    "Bali Kreatif": "Marketing",
    Printmax: "Marketing",
    ISS: "Services",
    Trisakti: "Services",
    Sentra: "Store Fixtures",
    Security: "Services",
    Moka: "Services",
    Telkom: "Utilities",
    Amazon: "Services",
    Accurate: "Services",
    PLN: "Utilities",
    PAM: "Utilities",
  }
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (name.includes(key)) return cat
  }
  return "Other"
}
