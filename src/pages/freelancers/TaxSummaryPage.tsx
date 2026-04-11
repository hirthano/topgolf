import { useState, useMemo } from "react"
import {
  FileText, AlertTriangle, TrendingUp, Download,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { freelancers, freelancerPayments } from "@/data/mock-freelancers"
import { formatCurrency, formatCurrencyShort, downloadCSV } from "@/lib/utils"
import type { FreelancerPayment } from "@/types"

const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#46AF83",
  sky: "#0EA5E9",
  amber: "#F59E0B",
  red: "#DC3545",
}

const THRESHOLD_AMOUNT = 50_000_000

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

export function TaxSummaryPage() {
  const [yearFilter, setYearFilter] = useState("2026")

  // Build monthly data
  const monthlyData = useMemo(() => {
    const months: { month: string; grossTax: number; grossUpTax: number; totalTax: number }[] = []
    const yearPayments = freelancerPayments.filter((p) =>
      p.paymentDate.startsWith(yearFilter) && (p.status === "paid" || p.status === "approved"),
    )

    for (let m = 0; m < 12; m++) {
      const monthStr = `${yearFilter}-${String(m + 1).padStart(2, "0")}`
      const monthPayments = yearPayments.filter((p) => p.paymentDate.startsWith(monthStr))

      let grossTax = 0
      let grossUpTax = 0

      for (const p of monthPayments) {
        const freelancer = freelancers.find((f) => f.id === p.freelancerId)
        if (freelancer?.taxArrangement === "gross_up") {
          grossUpTax += p.pph21
        } else {
          grossTax += p.pph21
        }
      }

      months.push({
        month: getMonthName(m),
        grossTax,
        grossUpTax,
        totalTax: grossTax + grossUpTax,
      })
    }
    return months
  }, [yearFilter])

  // YTD totals
  const totalGrossTax = monthlyData.reduce((s, m) => s + m.grossTax, 0)
  const totalGrossUpTax = monthlyData.reduce((s, m) => s + m.grossUpTax, 0)
  const totalTax = totalGrossTax + totalGrossUpTax

  // Per-freelancer YTD accumulation
  const freelancerYTD = useMemo(() => {
    const yearPayments = freelancerPayments.filter((p) =>
      p.paymentDate.startsWith(yearFilter) && (p.status === "paid" || p.status === "approved"),
    )
    const map = new Map<string, { name: string; role: string; hasNPWP: boolean; arrangement: string; totalFee: number; totalPPh: number; totalPaid: number }>()

    for (const p of yearPayments) {
      const existing = map.get(p.freelancerId)
      const freelancer = freelancers.find((f) => f.id === p.freelancerId)
      if (!freelancer) continue

      if (existing) {
        existing.totalFee += p.serviceFee
        existing.totalPPh += p.pph21
        existing.totalPaid += p.amountToFreelancer
      } else {
        map.set(p.freelancerId, {
          name: p.freelancerName,
          role: freelancer.role,
          hasNPWP: freelancer.hasNPWP,
          arrangement: freelancer.taxArrangement,
          totalFee: p.serviceFee,
          totalPPh: p.pph21,
          totalPaid: p.amountToFreelancer,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalPPh - a.totalPPh)
  }, [yearFilter])

  // Threshold alerts
  const thresholdAlerts = freelancerYTD.filter((f) => f.totalFee >= THRESHOLD_AMOUNT * 0.8)

  const handleExport = () => {
    const exportData = freelancerYTD.map((f) => ({
      Name: f.name,
      Role: f.role,
      NPWP: f.hasNPWP ? "Yes" : "No",
      Arrangement: f.arrangement,
      "Total Service Fee": f.totalFee,
      "Total PPh 21": f.totalPPh,
      "Total Paid": f.totalPaid,
    }))
    downloadCSV(exportData, `tax-summary-${yearFilter}.csv`)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Monthly Tax Summary"
        description="PPh 21 withholding summary and freelancer tax reporting"
        actions={
          <div className="flex items-center gap-3">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download size={14} />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Total PPh 21 (${yearFilter})`}
          value={formatCurrency(totalTax)}
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title="Gross (Withheld)"
          value={formatCurrency(totalGrossTax)}
          icon={TrendingUp}
          iconColor="text-info"
        />
        <StatCard
          title="Gross-Up (Company Borne)"
          value={formatCurrency(totalGrossUpTax)}
          icon={TrendingUp}
          iconColor="text-gold"
        />
        <StatCard
          title="Threshold Alerts"
          value={String(thresholdAlerts.length)}
          icon={AlertTriangle}
          iconColor="text-danger"
        />
      </div>

      {/* Monthly Tax Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly PPh 21 Tax Amounts</CardTitle>
          <CardDescription>Gross (withheld from freelancer) vs Gross-Up (borne by company)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#64748B" }}
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
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="grossTax" name="Gross (Withheld)" fill={COLORS.sky} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="grossUpTax" name="Gross-Up (Company)" fill={COLORS.gold} radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Recap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monthlyData.filter((m) => m.totalTax > 0).map((m) => (
          <Card key={m.month} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground">{m.month} {yearFilter}</p>
                <span className="text-lg font-bold text-primary">{formatCurrency(m.totalTax)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross (Withheld)</span>
                  <span className="text-info font-medium">{formatCurrency(m.grossTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross-Up (Company)</span>
                  <span className="text-gold font-medium">{formatCurrency(m.grossUpTax)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-info"
                      style={{ width: m.totalTax > 0 ? `${(m.grossTax / m.totalTax) * 100}%` : "0%" }}
                    />
                    <div
                      className="bg-gold"
                      style={{ width: m.totalTax > 0 ? `${(m.grossUpTax / m.totalTax) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Threshold Alerts */}
      {thresholdAlerts.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              Threshold Alerts
            </CardTitle>
            <CardDescription>Freelancers approaching or exceeding Rp 50.000.000 cumulative payment threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {thresholdAlerts.map((f) => {
                const pct = Math.min((f.totalFee / THRESHOLD_AMOUNT) * 100, 100)
                const isOver = f.totalFee >= THRESHOLD_AMOUNT
                return (
                  <div key={f.name} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{f.name}</p>
                        <p className="text-xs text-text-muted">{f.role}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isOver ? "text-red-600" : "text-amber-600"}`}>
                          {formatCurrency(f.totalFee)}
                        </p>
                        <Badge variant={isOver ? "danger" : "warning"}>
                          {pct.toFixed(0)}% of threshold
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-amber-400"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* YTD Accumulation Table */}
      <Card>
        <CardHeader>
          <CardTitle>YTD Accumulation per Freelancer</CardTitle>
          <CardDescription>Cumulative payment and tax data for {yearFilter}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">NPWP</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrangement</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Service Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total PPh 21</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {freelancerYTD.map((f) => (
                  <tr key={f.name} className="border-b border-border-light last:border-0 hover:bg-background transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{f.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.role}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={f.hasNPWP ? "success" : "warning"}>
                        {f.hasNPWP ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={f.arrangement === "gross_up" ? "default" : "secondary"}>
                        {f.arrangement === "gross_up" ? "Gross-Up" : "Gross"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(f.totalFee)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(f.totalPPh)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(f.totalPaid)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-background border-t-2 border-border font-bold">
                  <td className="px-4 py-3 text-foreground" colSpan={4}>Total</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(freelancerYTD.reduce((s, f) => s + f.totalFee, 0))}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(freelancerYTD.reduce((s, f) => s + f.totalPPh, 0))}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(freelancerYTD.reduce((s, f) => s + f.totalPaid, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
