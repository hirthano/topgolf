import { useMemo } from "react"
import {
  Clock, AlertTriangle, CheckCircle2, Building2,
  CreditCard, Wallet, ShoppingBag, Banknote, Timer,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { transactions, settlementRecords } from "@/data/mock-transactions"
import { formatCurrency, formatCurrencyShort, formatDate } from "@/lib/utils"
import type { SettlementRecord, PaymentProvider } from "@/types"

// --- Colors ---
const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#198754",
  amber: "#F59E0B",
  red: "#DC3545",
  sky: "#0EA5E9",
}

// --- Bank schedule data ---
const BANK_SCHEDULES: { provider: PaymentProvider; channel: string; schedule: string; icon: typeof CreditCard; note: string }[] = [
  { provider: "BCA", channel: "Card", schedule: "T+1 to T+2", icon: CreditCard, note: "Settlement on business days only" },
  { provider: "BCA", channel: "Bank Transfer", schedule: "T+0", icon: Building2, note: "Real-time for VA" },
  { provider: "Mandiri", channel: "Card", schedule: "T+1 to T+2", icon: CreditCard, note: "Batch settlement at EOD" },
  { provider: "BRI", channel: "Card", schedule: "T+1 to T+2", icon: CreditCard, note: "Settlement by 3 PM next day" },
  { provider: "GoPay", channel: "E-Wallet", schedule: "T+0 to T+1", icon: Wallet, note: "Instant for QRIS, T+1 for others" },
  { provider: "OVO", channel: "E-Wallet", schedule: "T+0 to T+1", icon: Wallet, note: "Cut-off at 11 PM" },
  { provider: "DANA", channel: "E-Wallet", schedule: "T+0 to T+1", icon: Wallet, note: "Settlement by 2 PM next day" },
  { provider: "QRIS", channel: "E-Wallet", schedule: "T+0", icon: Wallet, note: "Real-time settlement" },
  { provider: "ShopeePay", channel: "Marketplace", schedule: "T+3 to T+5", icon: ShoppingBag, note: "Depends on order completion" },
  { provider: "Shopee", channel: "Marketplace", schedule: "T+3 to T+5", icon: ShoppingBag, note: "After buyer confirmation" },
  { provider: "Cash", channel: "Cash", schedule: "T+0", icon: Banknote, note: "Immediate on receipt" },
]

// --- Compute timeline data ---
const TODAY = "2026-04-11"
function getDaysAgo(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

interface TimelineEntry {
  provider: PaymentProvider
  expectedDate: string
  actualDate: string | null
  amount: number
  status: "on_time" | "delayed" | "pending"
}

function buildTimeline(): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  // Look at recent transactions (last 14 days)
  const recentTxns = transactions.filter((tx) => {
    return tx.date >= getDaysAgo(14) && tx.paymentMethod !== "cash"
  })

  for (const tx of recentTxns.slice(0, 40)) {
    const schedule = BANK_SCHEDULES.find((s) => s.provider === tx.provider)
    if (!schedule) continue

    // Parse expected settlement range
    const match = schedule.schedule.match(/T\+(\d+)/)
    const expectedDays = match ? parseInt(match[1]) : 0
    const expectedDate = new Date(tx.date)
    expectedDate.setDate(expectedDate.getDate() + expectedDays)
    const expectedDateStr = expectedDate.toISOString().split("T")[0]

    let status: TimelineEntry["status"] = "pending"
    if (tx.settlementStatus === "settled" && tx.settlementDate) {
      status = tx.settlementDate <= expectedDateStr ? "on_time" : "delayed"
    }

    entries.push({
      provider: tx.provider,
      expectedDate: expectedDateStr,
      actualDate: tx.settlementDate,
      amount: tx.amount,
      status,
    })
  }

  return entries.sort((a, b) => (b.expectedDate).localeCompare(a.expectedDate))
}

// --- Delayed alerts ---
function buildAlerts() {
  const now = new Date(TODAY)
  return transactions
    .filter((tx) => {
      if (tx.settlementStatus === "settled" || tx.paymentMethod === "cash") return false
      const txDate = new Date(tx.date)
      const daysSince = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince > 3 // overdue if more than 3 days
    })
    .slice(0, 8)
    .map((tx) => ({
      id: tx.id,
      provider: tx.provider,
      branch: tx.branch,
      amount: tx.amount,
      date: tx.date,
      daysPending: Math.floor((new Date(TODAY).getTime() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24)),
    }))
}

// --- Custom tooltip ---
function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function SettlementsPage() {
  const timeline = useMemo(() => buildTimeline(), [])
  const alerts = useMemo(() => buildAlerts(), [])

  // KPI
  const totalPending = settlementRecords.reduce((s, r) => s + r.pendingAmount, 0)
  const totalSettled = settlementRecords.reduce((s, r) => s + r.settledAmount, 0)
  const totalOverdue = settlementRecords.reduce((s, r) => s + r.overdueCount, 0)
  const onTimeCount = timeline.filter((t) => t.status === "on_time").length
  const onTimeRate = timeline.length > 0 ? ((onTimeCount / timeline.length) * 100).toFixed(1) : "0"

  // Bar chart data: unsettled per provider
  const providerBarData = useMemo(() =>
    settlementRecords
      .filter((s) => s.provider !== "Cash")
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .map((s) => ({
        provider: s.provider,
        pending: s.pendingAmount,
        settled: s.settledAmount,
      })),
    [],
  )

  // History table
  const settlementHistory = useMemo(() =>
    transactions
      .filter((tx) => tx.settlementStatus === "settled" && tx.settlementDate)
      .sort((a, b) => (b.settlementDate ?? "").localeCompare(a.settlementDate ?? ""))
      .slice(0, 30),
    [],
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Settlement Tracker"
        description="Monitor expected vs actual settlement timelines across all payment providers"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pending"
          value={formatCurrencyShort(totalPending)}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Settled"
          value={formatCurrencyShort(totalSettled)}
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <StatCard
          title="Overdue Items"
          value={String(totalOverdue)}
          icon={AlertTriangle}
          iconColor="text-danger"
        />
        <StatCard
          title="On-Time Rate"
          value={`${onTimeRate}%`}
          icon={Timer}
          iconColor="text-info"
        />
      </div>

      {/* Timeline + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Expected vs Actual Settlement
            </CardTitle>
            <CardDescription>Recent transactions showing settlement timing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {timeline.slice(0, 20).map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-border-light p-3 transition-colors hover:bg-background"
                >
                  <div className="flex-shrink-0">
                    {entry.status === "on_time" && <CheckCircle2 size={20} className="text-success" />}
                    {entry.status === "delayed" && <AlertTriangle size={20} className="text-danger" />}
                    {entry.status === "pending" && <Clock size={20} className="text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{entry.provider}</span>
                      <Badge variant={
                        entry.status === "on_time" ? "success" :
                        entry.status === "delayed" ? "danger" : "warning"
                      } className="text-[10px] px-1.5">
                        {entry.status === "on_time" ? "On Time" : entry.status === "delayed" ? "Delayed" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span>Expected: {formatDate(entry.expectedDate)}</span>
                      <span>Actual: {entry.actualDate ? formatDate(entry.actualDate) : "Waiting..."}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(entry.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delayed Settlement Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-danger" />
              Delayed Alerts
            </CardTitle>
            <CardDescription>Settlements overdue by 3+ days</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                No delayed settlements
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{alert.provider}</p>
                        <p className="text-xs text-text-muted mt-0.5">{alert.branch}</p>
                      </div>
                      <Badge variant="danger" className="text-[10px]">
                        {alert.daysPending}d overdue
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-muted">{formatDate(alert.date)}</span>
                      <span className="text-sm font-semibold text-red-700">{formatCurrency(alert.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank Schedule Reference + Unsettled Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bank Schedule Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              Bank Settlement Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BANK_SCHEDULES.map((schedule, i) => {
                const Icon = schedule.icon
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border p-3 transition-all hover:shadow-sm hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={14} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">{schedule.provider}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">{schedule.channel}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Timer size={12} className="text-gold" />
                      <span className="text-sm font-medium text-gold-dark">{schedule.schedule}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{schedule.note}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Unsettled Amounts Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Unsettled Amounts by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="provider"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCurrencyShort(v)}
                    width={80}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="pending" name="Pending" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Recent settled transactions sorted by settlement date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Txn ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Txn Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settlement Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Days</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {settlementHistory.map((tx) => {
                  const days = tx.settlementDate
                    ? Math.floor((new Date(tx.settlementDate).getTime() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24))
                    : null

                  return (
                    <tr key={tx.id} className="border-b border-border-light last:border-0 transition-colors hover:bg-background">
                      <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{tx.id}</td>
                      <td className="px-4 py-3 text-foreground">{tx.provider}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{tx.branch}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 text-foreground">{tx.settlementDate ? formatDate(tx.settlementDate) : "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        {days !== null && (
                          <Badge variant={days <= 1 ? "success" : days <= 3 ? "warning" : "danger"}>
                            T+{days}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={tx.settlementStatus} />
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
