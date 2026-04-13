import { useState, useMemo } from "react"
import {
  BarChart3, FileText, Search,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { freelancers, freelancerPayments } from "@/data/mock-freelancers"
import { formatCurrency, formatCurrencyShort, formatDate } from "@/lib/utils"
import type { FreelancerPayment } from "@/types"
import type { ColumnDef } from "@/components/shared/DataTable"

const CHART_COLORS = ["#1B4332", "#C9A84C", "#2D6A4F", "#46AF83", "#0EA5E9", "#F59E0B", "#DC3545", "#8B5CF6"]

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

const historyColumns: ColumnDef<FreelancerPayment & Record<string, unknown>>[] = [
  {
    header: "Date",
    accessor: "paymentDate" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => formatDate(v as string),
  },
  {
    header: "Freelancer",
    accessor: "freelancerName" as keyof FreelancerPayment,
    sortable: true,
  },
  {
    header: "Description",
    accessor: "description" as keyof FreelancerPayment,
  },
  {
    header: "Service Fee",
    accessor: "serviceFee" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => formatCurrency(v as number),
    className: "text-right",
  },
  {
    header: "PPh 21",
    accessor: "pph21" as keyof FreelancerPayment,
    render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span>,
    className: "text-right",
  },
  {
    header: "Company Cost",
    accessor: "totalCompanyCost" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => <span className="font-semibold">{formatCurrency(v as number)}</span>,
    className: "text-right",
  },
  {
    header: "Status",
    accessor: "status" as keyof FreelancerPayment,
    render: (v) => <StatusBadge status={v as string} />,
  },
]

export function FreelancerReports() {
  const [selectedBuktiPotong, setSelectedBuktiPotong] = useState("")

  // Monthly cost trend
  const monthlyCost = useMemo(() => {
    const months: { month: string; cost: number }[] = []
    for (let m = 0; m < 12; m++) {
      const monthStr = `2026-${String(m + 1).padStart(2, "0")}`
      const cost = freelancerPayments
        .filter((p) => p.paymentDate.startsWith(monthStr) && p.status === "paid")
        .reduce((s, p) => s + p.totalCompanyCost, 0)
      months.push({ month: getMonthName(m), cost })
    }
    // Include 2025 months with data
    for (let m = 0; m < 12; m++) {
      const monthStr = `2025-${String(m + 1).padStart(2, "0")}`
      const cost = freelancerPayments
        .filter((p) => p.paymentDate.startsWith(monthStr) && p.status === "paid")
        .reduce((s, p) => s + p.totalCompanyCost, 0)
      if (cost > 0 && !months.some((x) => x.month === getMonthName(m) && x.cost > 0)) {
        // skip - we show 2026 data
      }
    }
    return months
  }, [])

  // Cost by role
  const costByRole = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of freelancerPayments.filter((p) => p.status === "paid")) {
      const freelancer = freelancers.find((f) => f.id === p.freelancerId)
      if (!freelancer) continue
      map.set(freelancer.role, (map.get(freelancer.role) ?? 0) + p.totalCompanyCost)
    }
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
  }, [])

  // Gross vs Gross-Up comparison by month
  const grossComparison = useMemo(() => {
    const months: { month: string; gross: number; grossUp: number }[] = []
    for (let m = 0; m < 12; m++) {
      const monthStr = `2026-${String(m + 1).padStart(2, "0")}`
      const monthPayments = freelancerPayments.filter(
        (p) => p.paymentDate.startsWith(monthStr) && p.status === "paid",
      )
      let gross = 0
      let grossUp = 0
      for (const p of monthPayments) {
        const freelancer = freelancers.find((f) => f.id === p.freelancerId)
        if (freelancer?.taxArrangement === "gross_up") {
          grossUp += p.totalCompanyCost
        } else {
          gross += p.totalCompanyCost
        }
      }
      months.push({ month: getMonthName(m), gross, grossUp })
    }
    return months
  }, [])

  // Bukti potong data
  const selectedFreelancerBP = freelancers.find((f) => f.id === selectedBuktiPotong)
  const bpPayments = selectedBuktiPotong
    ? freelancerPayments.filter((p) => p.freelancerId === selectedBuktiPotong && p.status === "paid" && p.paymentDate.startsWith("2026"))
    : []
  const bpTotalFee = bpPayments.reduce((s, p) => s + p.serviceFee, 0)
  const bpTotalDpp = bpPayments.reduce((s, p) => s + p.dpp, 0)
  const bpTotalPph = bpPayments.reduce((s, p) => s + p.pph21, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Freelancer Reports"
        description="Comprehensive cost analysis and tax document previews"
      />

      {/* Line Chart - Monthly Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Total Freelancer Cost by Month (2026)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCost} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} width={80} />
                <Tooltip content={<CurrencyTooltip />} />
                <Line type="monotone" dataKey="cost" name="Total Cost" stroke="#1B4332" strokeWidth={2.5} dot={{ r: 4, fill: "#C9A84C", stroke: "#1B4332", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart - Cost by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Role Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="shrink-0" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costByRole}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={82}
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {costByRole.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 pt-2">
                {costByRole.map((entry) => {
                  const total = costByRole.reduce((s, c) => s + c.value, 0)
                  const pct = total > 0 ? (entry.value / total) * 100 : 0
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-foreground truncate">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-foreground">{formatCurrencyShort(entry.value)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-border pt-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total</span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrencyShort(costByRole.reduce((s, c) => s + c.value, 0))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grouped Bar Chart - Gross vs Gross-Up */}
        <Card>
          <CardHeader>
            <CardTitle>Gross vs Gross-Up Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grossComparison} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} width={80} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="gross" name="Gross" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossUp" name="Gross-Up" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bukti Potong PPh 21 Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Bukti Potong PPh 21 Preview
          </CardTitle>
          <CardDescription>Select a freelancer to preview their tax withholding certificate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedBuktiPotong} onValueChange={setSelectedBuktiPotong}>
              <SelectTrigger className="w-[320px] h-9 text-sm">
                <SelectValue placeholder="Select freelancer..." />
              </SelectTrigger>
              <SelectContent>
                {freelancers.filter((f) => f.status === "active").map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name} - {f.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFreelancerBP && bpPayments.length > 0 ? (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="border-2 border-border rounded-lg overflow-hidden bg-white shadow-lg">
                {/* Header */}
                <div className="bg-[#1B4332] p-5 text-center">
                  <p className="text-sm text-white/60 uppercase tracking-widest mb-1">Bukti Pemotongan</p>
                  <p className="text-xl font-bold text-white">PPh Pasal 21</p>
                  <p className="text-sm text-[#C9A84C] mt-1">Tahun Pajak 2026</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Company Info */}
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Pemotong Pajak</p>
                    <p className="font-semibold text-foreground">PT Topgolf Indonesia</p>
                    <p className="text-sm text-muted-foreground">NPWP: 01.234.567.8-999.000</p>
                  </div>

                  {/* Freelancer Info */}
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Penerima Penghasilan</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-text-muted text-xs">Nama</p>
                        <p className="font-medium text-foreground">{selectedFreelancerBP.name}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">NPWP</p>
                        <p className="font-medium text-foreground">{selectedFreelancerBP.npwpNumber ?? "Tidak Ada"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Jenis Jasa</p>
                        <p className="font-medium text-foreground">{selectedFreelancerBP.role}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Status Pajak</p>
                        <Badge variant={selectedFreelancerBP.hasNPWP ? "success" : "warning"}>
                          {selectedFreelancerBP.hasNPWP ? "NPWP" : "Non-NPWP"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Tax Calculation */}
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Rincian Pemotongan</p>
                    <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-3 text-muted-foreground">Penghasilan Bruto (Gross)</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(bpTotalFee)}</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-3 text-muted-foreground">DPP (50% x Bruto)</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(bpTotalDpp)}</td>
                        </tr>
                        <tr className="border-b border-border bg-red-50">
                          <td className="px-4 py-3 text-red-700 font-medium">PPh 21 yang dipotong</td>
                          <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(bpTotalPph)}</td>
                        </tr>
                        <tr className="bg-background">
                          <td className="px-4 py-3 text-muted-foreground">Jumlah Pembayaran ({bpPayments.length}x)</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">{bpPayments.length} transaksi</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Arrangement note */}
                  <div className="text-xs text-text-muted border-t border-border-light pt-3">
                    <p>Metode: {selectedFreelancerBP.taxArrangement === "gross_up" ? "Gross-Up (pajak ditanggung perusahaan)" : "Gross (pajak dipotong dari pembayaran)"}</p>
                    <p className="mt-1">Dokumen ini adalah preview dan bukan bukti potong resmi.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4 bg-background flex items-center justify-between">
                  <p className="text-xs text-text-muted">Ref: BP/PPh21/2026/{selectedFreelancerBP.id}</p>
                  <p className="text-xs text-text-muted">Generated: 11/04/2026</p>
                </div>
              </div>
            </div>
          ) : selectedBuktiPotong ? (
            <div className="text-center py-12 text-text-muted">
              <FileText size={40} strokeWidth={1} className="mx-auto mb-3 text-border" />
              <p className="text-sm">No paid transactions found for this freelancer in 2026.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Individual Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={18} className="text-primary" />
            Individual Payment History
          </CardTitle>
          <CardDescription>Search and view all freelancer payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={historyColumns}
            data={freelancerPayments.filter((p) => p.status === "paid") as (FreelancerPayment & Record<string, unknown>)[]}
            searchPlaceholder="Search by name, description..."
            exportFilename="freelancer-payment-history.csv"
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
