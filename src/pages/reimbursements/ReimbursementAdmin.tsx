import { useState, useMemo } from "react"
import {
  ShieldCheck, Clock, TrendingUp, Tag, Download, Banknote,
  CheckCircle2, BarChart3,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { reimbursements } from "@/data/mock-reimbursements"
import { formatCurrency, formatCurrencyShort, downloadCSV } from "@/lib/utils"
import type { ColumnDef } from "@/components/shared/DataTable"
import type { Reimbursement, ReimbursementStatus, ReimbursementCategory } from "@/types"

type RowData = Reimbursement & Record<string, unknown>

const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#198754",
  teal: "#0D9488",
  amber: "#F59E0B",
  sky: "#0EA5E9",
  slate: "#64748B",
  red: "#DC3545",
  purple: "#8B5CF6",
}

const CATEGORY_COLORS: Record<string, string> = {
  "Dinner/Meals": COLORS.primary,
  "Parking": COLORS.gold,
  "Transportation": COLORS.lightGreen,
  "Office Supplies": COLORS.teal,
  "Client Entertainment": COLORS.amber,
  "Fuel": COLORS.sky,
  "Toll": COLORS.slate,
  "Other": COLORS.purple,
}

const DEPT_COLORS = [COLORS.primary, COLORS.gold, COLORS.emerald, COLORS.teal, COLORS.amber, COLORS.sky, COLORS.slate, COLORS.red]

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "revision", label: "Revision" },
]

const allCategories = Array.from(new Set(reimbursements.map((r) => r.category))).sort()
const allDepartments = Array.from(new Set(reimbursements.map((r) => r.department))).sort()

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

export function ReimbursementAdmin() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Filter data
  const filtered = useMemo(() => {
    let data = reimbursements
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter)
    if (categoryFilter !== "all") data = data.filter((r) => r.category === categoryFilter)
    if (departmentFilter !== "all") data = data.filter((r) => r.department === departmentFilter)
    if (dateFrom) data = data.filter((r) => r.dateSubmitted >= dateFrom)
    if (dateTo) data = data.filter((r) => r.dateSubmitted <= dateTo)
    return data
  }, [statusFilter, categoryFilter, departmentFilter, dateFrom, dateTo])

  // Analytics
  const approvalRate = useMemo(() => {
    const decided = reimbursements.filter((r) => r.status === "approved" || r.status === "paid" || r.status === "rejected")
    const approved = decided.filter((r) => r.status === "approved" || r.status === "paid")
    return decided.length > 0 ? Math.round((approved.length / decided.length) * 100) : 0
  }, [])

  const avgProcessingDays = useMemo(() => {
    const processed = reimbursements.filter(
      (r) => (r.status === "approved" || r.status === "paid") && r.approvalChain.some((s) => s.date),
    )
    if (processed.length === 0) return 0
    const totalDays = processed.reduce((sum, r) => {
      const lastApproval = [...r.approvalChain].reverse().find((s) => s.date)
      if (!lastApproval?.date) return sum
      const diff = new Date(lastApproval.date).getTime() - new Date(r.dateSubmitted).getTime()
      return sum + diff / (1000 * 60 * 60 * 24)
    }, 0)
    return Math.round(totalDays / processed.length * 10) / 10
  }, [])

  const topCategory = useMemo(() => {
    const counts = new Map<string, number>()
    reimbursements.forEach((r) => {
      counts.set(r.category, (counts.get(r.category) || 0) + r.amount)
    })
    let top = { cat: "", amount: 0 }
    counts.forEach((amount, cat) => {
      if (amount > top.amount) top = { cat, amount }
    })
    return top.cat
  }, [])

  // Monthly spending by category (bar chart)
  const monthlyByCategory = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    reimbursements.forEach((r) => {
      const month = r.dateSubmitted.slice(0, 7) // YYYY-MM
      if (!map.has(month)) map.set(month, new Map())
      const catMap = map.get(month)!
      catMap.set(r.category, (catMap.get(r.category) || 0) + r.amount)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, catMap]) => {
        const entry: Record<string, unknown> = {
          month: `${month.slice(5, 7)}/${month.slice(0, 4)}`,
        }
        allCategories.forEach((cat) => {
          entry[cat] = catMap.get(cat) || 0
        })
        return entry
      })
  }, [])

  // Department spending (pie chart)
  const deptSpending = useMemo(() => {
    const map = new Map<string, number>()
    reimbursements.forEach((r) => {
      map.set(r.department, (map.get(r.department) || 0) + r.amount)
    })
    return Array.from(map.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [])

  // Payment queue: approved but not yet paid
  const paymentQueue = useMemo(
    () => reimbursements.filter((r) => r.status === "approved"),
    [],
  )

  const paymentQueueTotal = paymentQueue.reduce((s, r) => s + r.amount, 0)

  // Table columns
  const columns: ColumnDef<RowData>[] = [
    {
      header: "ID",
      accessor: "id" as keyof RowData,
      render: (val) => <span className="font-mono text-xs text-text-muted">{String(val)}</span>,
      sortable: true,
    },
    {
      header: "Employee",
      accessor: "employeeName" as keyof RowData,
      render: (val, row) => (
        <div>
          <span className="font-medium text-foreground block">{String(val)}</span>
          <span className="text-xs text-text-muted">{String((row as unknown as Reimbursement).department)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Category",
      accessor: "category" as keyof RowData,
      sortable: true,
    },
    {
      header: "Amount",
      accessor: "amount" as keyof RowData,
      render: (val) => <span className="font-semibold">{formatCurrency(Number(val))}</span>,
      sortable: true,
      className: "text-right",
    },
    {
      header: "Date",
      accessor: "dateSubmitted" as keyof RowData,
      render: (val) => {
        const d = new Date(String(val))
        return <span className="text-muted-foreground whitespace-nowrap">{`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`}</span>
      },
      sortable: true,
    },
    {
      header: "Branch",
      accessor: "branch" as keyof RowData,
      render: (val) => <span className="text-muted-foreground text-xs">{String(val)}</span>,
    },
    {
      header: "Status",
      accessor: "status" as keyof RowData,
      render: (val) => <StatusBadge status={String(val)} />,
    },
  ]

  // Payment queue columns
  const paymentColumns: ColumnDef<RowData>[] = [
    {
      header: "Employee",
      accessor: "employeeName" as keyof RowData,
      render: (val) => <span className="font-medium text-foreground">{String(val)}</span>,
      sortable: true,
    },
    {
      header: "Category",
      accessor: "category" as keyof RowData,
    },
    {
      header: "Amount",
      accessor: "amount" as keyof RowData,
      render: (val) => <span className="font-semibold">{formatCurrency(Number(val))}</span>,
      sortable: true,
      className: "text-right",
    },
    {
      header: "Approved Date",
      accessor: (row) => {
        const r = row as unknown as Reimbursement
        const lastApproval = [...r.approvalChain].reverse().find((s) => s.status === "approved")
        return lastApproval?.date || r.dateSubmitted
      },
      render: (val) => {
        const d = new Date(String(val))
        return <span className="text-muted-foreground">{`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`}</span>
      },
      sortable: true,
    },
    {
      header: "Status",
      accessor: () => "approved",
      render: () => <StatusBadge status="approved" />,
    },
  ]

  const handleExport = () => {
    const exportData = filtered.map((r) => ({
      ID: r.id,
      Employee: r.employeeName,
      Department: r.department,
      Branch: r.branch,
      Category: r.category,
      Amount: r.amount,
      Status: r.status,
      DateSubmitted: r.dateSubmitted,
      DateExpense: r.dateExpense,
    }))
    downloadCSV(exportData, "reimbursements-admin-export.csv")
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Reimbursement Admin"
        description="Finance overview of all reimbursements across the company"
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </Button>
        }
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Processing Time"
          value={`${avgProcessingDays} days`}
          icon={Clock}
          iconColor="text-primary"
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Top Category"
          value={topCategory}
          icon={Tag}
          iconColor="text-gold"
        />
        <StatCard
          title="Payment Queue"
          value={formatCurrency(paymentQueueTotal)}
          icon={Banknote}
          iconColor="text-warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Spending by Category */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Monthly Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyByCategory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
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
                  {allCategories.map((cat) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      name={cat}
                      fill={CATEGORY_COLORS[cat] || COLORS.slate}
                      stackId="a"
                      radius={cat === allCategories[allCategories.length - 1] ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Spending Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptSpending}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {deptSpending.map((entry, i) => (
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

      {/* Filters + Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              All Reimbursements
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {allDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px] h-9 text-sm"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px] h-9 text-sm"
                placeholder="To"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<RowData>
            columns={columns}
            data={filtered as unknown as RowData[]}
            searchPlaceholder="Search all reimbursements..."
            exportFilename="reimbursements-all.csv"
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Payment Processing Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Banknote size={18} className="text-emerald-600" />
              Payment Processing Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {paymentQueue.length} items totaling {formatCurrency(paymentQueueTotal)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<RowData>
            columns={paymentColumns}
            data={paymentQueue as unknown as RowData[]}
            searchPlaceholder="Search payment queue..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
