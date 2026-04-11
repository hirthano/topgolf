import { useMemo } from "react"
import {
  CreditCard, Clock, AlertTriangle, CheckCircle2,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { vendors, vendorInvoices } from "@/data/mock-vendors"
import { formatCurrency, formatCurrencyShort } from "@/lib/utils"
import type { VendorInvoice } from "@/types"

const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#46AF83",
  sky: "#0EA5E9",
  amber: "#F59E0B",
  red: "#DC3545",
  purple: "#8B5CF6",
}

const TODAY = new Date("2026-04-11")

function daysBetween(a: string, b: Date): number {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86400000)
}

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

export function VendorDashboard() {
  const outstandingInvoices = useMemo(
    () => vendorInvoices.filter((inv) => !["paid", "disputed"].includes(inv.status)),
    [],
  )

  const totalOutstanding = outstandingInvoices.reduce((s, inv) => s + inv.amount, 0)

  const dueThisWeek = useMemo(() => {
    const weekFromNow = new Date(TODAY)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return outstandingInvoices.filter((inv) => {
      const due = new Date(inv.dueDate)
      return due >= TODAY && due <= weekFromNow
    })
  }, [outstandingInvoices])

  const overdueInvoices = useMemo(
    () => outstandingInvoices.filter((inv) => new Date(inv.dueDate) < TODAY),
    [outstandingInvoices],
  )

  const paidThisMonth = useMemo(
    () => vendorInvoices.filter((inv) => inv.status === "paid" && inv.issueDate.startsWith("2026-04")),
    [],
  )
  const paidThisMonthTotal = paidThisMonth.reduce((s, inv) => s + inv.amount, 0)

  // Aging buckets
  const agingData = useMemo(() => {
    const buckets = [
      { name: "Current", min: -Infinity, max: 0, amount: 0, color: COLORS.emerald },
      { name: "1-30 days", min: 1, max: 30, amount: 0, color: COLORS.sky },
      { name: "31-60 days", min: 31, max: 60, amount: 0, color: COLORS.amber },
      { name: "61-90 days", min: 61, max: 90, amount: 0, color: "#F97316" },
      { name: "90+ days", min: 91, max: Infinity, amount: 0, color: COLORS.red },
    ]

    for (const inv of outstandingInvoices) {
      const overdueDays = daysBetween(inv.dueDate, TODAY)
      for (const bucket of buckets) {
        if (overdueDays >= bucket.min && overdueDays <= bucket.max) {
          bucket.amount += inv.amount
          break
        }
      }
    }
    return buckets
  }, [outstandingInvoices])

  // Top vendors by payment volume
  const topVendors = useMemo(() => {
    const map = new Map<string, number>()
    for (const inv of vendorInvoices.filter((i) => i.status === "paid")) {
      map.set(inv.vendorName, (map.get(inv.vendorName) ?? 0) + inv.amount)
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 25 ? name.substring(0, 25) + "..." : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [])

  // Payment calendar (next 30 days)
  const calendarData = useMemo(() => {
    const days: { date: Date; dayNum: number; weekday: string; payments: VendorInvoice[]; isToday: boolean }[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(TODAY)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const payments = outstandingInvoices.filter((inv) => inv.dueDate === dateStr)
      days.push({
        date: d,
        dayNum: d.getDate(),
        weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        payments,
        isToday: i === 0,
      })
    }
    return days
  }, [outstandingInvoices])

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Vendor Dashboard"
        description="Payables overview, aging analysis, and upcoming payments"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Outstanding Payables"
          value={formatCurrencyShort(totalOutstanding)}
          icon={CreditCard}
          iconColor="text-primary"
        />
        <StatCard
          title="Due This Week"
          value={`${dueThisWeek.length} invoices`}
          icon={Clock}
          iconColor="text-info"
        />
        <StatCard
          title="Overdue"
          value={`${overdueInvoices.length} invoices`}
          icon={AlertTriangle}
          iconColor="text-danger"
        />
        <StatCard
          title="Paid This Month"
          value={formatCurrencyShort(paidThisMonthTotal)}
          icon={CheckCircle2}
          iconColor="text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payables Aging</CardTitle>
            <CardDescription>Outstanding invoices by overdue period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} width={80} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                    {agingData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Payment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendors} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#1E293B" }} tickLine={false} axisLine={false} width={150} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }} />
                  <Bar dataKey="amount" name="Total Paid" fill={COLORS.gold} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payment Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payment Calendar</CardTitle>
          <CardDescription>Payment due dates for the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-15 gap-2">
            {calendarData.map((day, i) => (
              <div
                key={i}
                className={`relative rounded-lg border p-2 text-center min-h-[70px] transition-all ${
                  day.isToday
                    ? "border-primary bg-primary-50 ring-2 ring-primary/20"
                    : day.payments.length > 0
                      ? "border-amber-200 bg-amber-50"
                      : "border-border-light bg-card"
                }`}
              >
                <p className="text-[10px] text-text-muted">{day.weekday}</p>
                <p className={`text-sm font-semibold ${day.isToday ? "text-primary" : "text-foreground"}`}>{day.dayNum}</p>
                {day.payments.length > 0 && (
                  <div className="mt-1 flex justify-center gap-0.5 flex-wrap">
                    {day.payments.slice(0, 3).map((_, pi) => (
                      <div key={pi} className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    ))}
                    {day.payments.length > 3 && (
                      <span className="text-[9px] text-amber-700 font-medium">+{day.payments.length - 3}</span>
                    )}
                  </div>
                )}
                {day.payments.length > 0 && (
                  <p className="text-[9px] text-text-muted mt-0.5">{day.payments.length} due</p>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded border-2 border-primary bg-primary-50" />
              Today
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded border border-amber-200 bg-amber-50" />
              Payment Due
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Invoice
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

