import { useState, useMemo } from "react"
import {
  DollarSign, Clock, AlertTriangle, FileWarning, TrendingUp,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { transactions, reconciliationRecords, settlementRecords } from "@/data/mock-transactions"
import { formatCurrency, formatCurrencyShort } from "@/lib/utils"
import type { Transaction } from "@/types"

// --- Topgolf color palette ---
const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#198754",
  teal: "#0D9488",
  amber: "#F59E0B",
  sky: "#0EA5E9",
  slate: "#64748B",
}

const CHANNEL_COLORS: Record<string, string> = {
  card: COLORS.primary,
  ewallet: COLORS.gold,
  bank_transfer: COLORS.lightGreen,
  marketplace: COLORS.teal,
  cash: COLORS.slate,
}

const CHANNEL_LABELS: Record<string, string> = {
  card: "Card",
  ewallet: "E-Wallet",
  bank_transfer: "Bank Transfer",
  marketplace: "Marketplace",
  cash: "Cash",
}

// --- Helper: get unique branch names ---
const branchNames = Array.from(new Set(transactions.map((t) => t.branch))).sort()

// --- Helper: get "today" from mock data range ---
const TODAY = "2026-04-11"

function getDaysAgo(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

// --- Revenue trend data (last 30 days) ---
function buildRevenueTrend(branch: string) {
  const dateMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    dateMap.set(getDaysAgo(i), 0)
  }
  const filteredTxns = branch === "all"
    ? transactions
    : transactions.filter((t) => t.branch === branch)

  for (const tx of filteredTxns) {
    if (dateMap.has(tx.date)) {
      dateMap.set(tx.date, (dateMap.get(tx.date) ?? 0) + tx.amount)
    }
  }

  return Array.from(dateMap.entries()).map(([date, amount]) => ({
    date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
    amount,
  }))
}

// --- Payment channel breakdown ---
function buildChannelBreakdown(txns: Transaction[]) {
  const map = new Map<string, number>()
  for (const tx of txns) {
    map.set(tx.paymentMethod, (map.get(tx.paymentMethod) ?? 0) + tx.amount)
  }
  return Array.from(map.entries())
    .map(([channel, amount]) => ({
      name: CHANNEL_LABELS[channel] ?? channel,
      value: amount,
      color: CHANNEL_COLORS[channel] ?? COLORS.slate,
    }))
    .sort((a, b) => b.value - a.value)
}

// --- Settlement status timeline (last 14 days) ---
function buildSettlementTimeline() {
  const result: { date: string; settled: number; pending: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const day = getDaysAgo(i)
    const dayTxns = transactions.filter((t) => t.date === day)
    const settled = dayTxns.filter((t) => t.settlementStatus === "settled").reduce((s, t) => s + t.amount, 0)
    const pending = dayTxns.filter((t) => t.settlementStatus !== "settled").reduce((s, t) => s + t.amount, 0)
    result.push({
      date: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
      settled,
      pending,
    })
  }
  return result
}

// --- Branch revenue table ---
function buildBranchRevenue() {
  const map = new Map<string, { revenue: number; settled: number; pending: number; overdue: number }>()
  for (const branch of branchNames) {
    map.set(branch, { revenue: 0, settled: 0, pending: 0, overdue: 0 })
  }
  for (const tx of transactions) {
    const entry = map.get(tx.branch)
    if (!entry) continue
    entry.revenue += tx.amount
    if (tx.settlementStatus === "settled") entry.settled += tx.amount
    else if (tx.settlementStatus === "pending") entry.pending += tx.amount
    else entry.overdue += tx.amount
  }
  return Array.from(map.entries())
    .map(([branch, data]) => ({ branch, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
}

// --- Custom tooltip ---
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

export function PaymentDashboard() {
  const [branchFilter, setBranchFilter] = useState("all")

  // KPI calculations
  const todayTxns = transactions.filter((t) => t.date === TODAY)
  const totalRevenueToday = todayTxns.reduce((s, t) => s + t.amount, 0)
  const pendingSettlements = transactions.filter((t) => t.settlementStatus === "pending").reduce((s, t) => s + t.amount, 0)
  const reconGaps = reconciliationRecords.filter((r) => r.status === "discrepancy").length
  const unmatchedTxns = reconciliationRecords.filter((r) => r.status === "unmatched").length

  // Yesterday comparison for trend
  const yesterdayTxns = transactions.filter((t) => t.date === getDaysAgo(1))
  const yesterdayRevenue = yesterdayTxns.reduce((s, t) => s + t.amount, 0)
  const revenueChange = yesterdayRevenue > 0 ? ((totalRevenueToday - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

  // Chart data
  const revenueTrend = useMemo(() => buildRevenueTrend(branchFilter), [branchFilter])
  const channelBreakdown = useMemo(() => buildChannelBreakdown(transactions), [])
  const settlementTimeline = useMemo(() => buildSettlementTimeline(), [])
  const branchRevenue = useMemo(() => buildBranchRevenue(), [])

  // Unsettled per provider (bar chart)
  const providerUnsettled = useMemo(() =>
    settlementRecords
      .filter((s) => s.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 8)
      .map((s) => ({ provider: s.provider, amount: s.pendingAmount })),
    [],
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Payment Dashboard"
        description="Real-time payment monitoring across all Topgolf Indonesia branches"
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
            Live
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue Today"
          value={formatCurrency(totalRevenueToday)}
          change={revenueChange}
          icon={DollarSign}
          iconColor="text-gold"
        />
        <StatCard
          title="Pending Settlements"
          value={formatCurrencyShort(pendingSettlements)}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Reconciliation Gaps"
          value={String(reconGaps)}
          icon={AlertTriangle}
          iconColor="text-danger"
        />
        <StatCard
          title="Unmatched Transactions"
          value={String(unmatchedTxns)}
          icon={FileWarning}
          iconColor="text-info"
        />
      </div>

      {/* Revenue Trend + Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Revenue Trend (30 days)
            </CardTitle>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[220px] h-9 text-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branchNames.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCurrencyShort(v)}
                    width={80}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Revenue"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: COLORS.gold, stroke: COLORS.primary, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Channel Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {channelBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Timeline + Unsettled per Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Settlement Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement Status (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={settlementTimeline} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCurrencyShort(v)}
                    width={80}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="settled" name="Settled" fill={COLORS.emerald} radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="pending" name="Pending" fill={COLORS.amber} radius={[4, 4, 0, 0]} stackId="a" />
                  <Legend iconType="circle" iconSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Unsettled Amounts per Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Unsettled by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerUnsettled} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCurrencyShort(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="provider"
                    tick={{ fontSize: 12, fill: "#1E293B" }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                  />
                  <Bar dataKey="amount" name="Unsettled" fill={COLORS.gold} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Revenue & Settlement Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settled</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue/Failed</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {branchRevenue.map((row) => {
                  const settledPct = row.revenue > 0 ? (row.settled / row.revenue) * 100 : 0
                  let status: string
                  if (settledPct >= 95) status = "settled"
                  else if (row.overdue > 0) status = "overdue"
                  else status = "pending"

                  return (
                    <tr key={row.branch} className="border-b border-border-light last:border-0 transition-colors hover:bg-background">
                      <td className="px-4 py-3 font-medium text-foreground">{row.branch}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(row.settled)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatCurrency(row.pending)}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(row.overdue)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
