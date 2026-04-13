import { useState, useMemo, useCallback } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  DollarSign, TrendingUp, ShoppingCart, Package, Building2, ArrowUpDown,
  CalendarDays, ChevronDown,
} from "lucide-react"

import type { Product } from "@/types"
import { salesData, products } from "@/data/mock-sales"
import { formatCurrency, formatCurrencyShort, formatNumber, percentChange } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

const CHART_COLORS = ['#1B4332', '#C9A84C', '#2D6A4F', '#46AF83', '#0EA5E9', '#F59E0B']

const CATEGORY_COLORS: Record<string, string> = {
  'Golf Clubs': '#1B4332',
  'Apparel': '#C9A84C',
  'Accessories': '#2D6A4F',
  'Golf Bags': '#46AF83',
  'Golf Balls': '#0EA5E9',
  'Fitting Services': '#F59E0B',
}

// Unique branch names from sales data
const branchNames = Array.from(new Set(salesData.map(s => s.branch)))

// --- Date helpers ---
const TODAY = '2026-04-11'
const TODAY_DATE = new Date(TODAY)

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3
  return new Date(d.getFullYear(), q, 1)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDisplayDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// --- Preset date ranges ---
interface DatePreset {
  label: string
  from: Date
  to: Date
}

function getPresets(): DatePreset[] {
  return [
    { label: 'Today', from: TODAY_DATE, to: TODAY_DATE },
    { label: 'Last 7 Days', from: addDays(TODAY_DATE, -6), to: TODAY_DATE },
    { label: 'Last 30 Days', from: addDays(TODAY_DATE, -29), to: TODAY_DATE },
    { label: 'This Month', from: startOfMonth(TODAY_DATE), to: TODAY_DATE },
    { label: 'Last Month', from: startOfMonth(new Date(2026, 2, 1)), to: endOfMonth(new Date(2026, 2, 1)) },
    { label: 'This Quarter', from: startOfQuarter(TODAY_DATE), to: TODAY_DATE },
    { label: 'Year to Date', from: new Date(2026, 0, 1), to: TODAY_DATE },
  ]
}

// --- Granularity helpers ---
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return toDateStr(start)
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function autoGranularity(rangeDays: number): 'daily' | 'weekly' | 'monthly' {
  if (rangeDays < 60) return 'daily'
  if (rangeDays < 180) return 'weekly'
  return 'monthly'
}

// --- Custom tooltip ---
function CurrencyPieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { percent: number } }[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{entry.name}</p>
      <p className="text-muted-foreground">{formatCurrency(entry.value)}</p>
      <p className="text-xs text-muted-foreground">{(entry.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

// --- Date Range Picker Component ---
function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}) {
  const [customFrom, setCustomFrom] = useState(toDateStr(from))
  const [customTo, setCustomTo] = useState(toDateStr(to))
  const [open, setOpen] = useState(false)
  const presets = getPresets()

  // Find matching preset label
  const fromStr = toDateStr(from)
  const toStr = toDateStr(to)
  const activePreset = presets.find(p => toDateStr(p.from) === fromStr && toDateStr(p.to) === toStr)
  const displayLabel = activePreset
    ? activePreset.label
    : `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`

  const applyCustomRange = () => {
    const f = new Date(customFrom)
    const t = new Date(customTo)
    if (!isNaN(f.getTime()) && !isNaN(t.getTime()) && f <= t) {
      onChange(f, t)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-normal min-w-[180px] justify-start">
          <CalendarDays size={14} className="text-muted-foreground" />
          {displayLabel}
          <ChevronDown size={12} className="ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 space-y-3">
          {/* Quick presets */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const isActive = activePreset?.label === preset.label
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onChange(preset.from, preset.to)
                      setCustomFrom(toDateStr(preset.from))
                      setCustomTo(toDateStr(preset.to))
                      setOpen(false)
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Custom range */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Custom Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom}
                  max={TODAY}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={applyCustomRange}>
              Apply Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Current month: April 2026
const currentMonth = '2026-04'
const lastMonth = '2026-03'
const sameMonthLastYear = '2025-04'

export function SalesDashboard() {
  // Date range state — default to Last 30 Days
  const [dateFrom, setDateFrom] = useState(() => addDays(TODAY_DATE, -29))
  const [dateTo, setDateTo] = useState(() => TODAY_DATE)
  const rangeDays = daysBetween(dateFrom, dateTo)

  // Granularity: auto-set based on range, but allow manual override
  const [granularityOverride, setGranularityOverride] = useState<'daily' | 'weekly' | 'monthly' | null>(null)
  const suggestedGranularity = autoGranularity(rangeDays)
  const revenueGranularity = granularityOverride ?? suggestedGranularity

  const [branchSortKey, setBranchSortKey] = useState<'revenue' | 'name'>('revenue')

  // When date range changes, reset granularity override
  const handleDateChange = useCallback((from: Date, to: Date) => {
    setDateFrom(from)
    setDateTo(to)
    setGranularityOverride(null)
  }, [])

  // Filter sales data to selected date range
  const dateFromStr = toDateStr(dateFrom)
  const dateToStr = toDateStr(dateTo)
  const rangeData = useMemo(
    () => salesData.filter(s => s.date >= dateFromStr && s.date <= dateToStr),
    [dateFromStr, dateToStr],
  )

  // ---------- KPI calculations (always MTD for consistency) ----------
  const currentMonthData = useMemo(() => salesData.filter(s => s.date.startsWith(currentMonth)), [])
  const lastMonthData = useMemo(() => salesData.filter(s => s.date.startsWith(lastMonth)), [])
  const sameMonthLYData = useMemo(() => salesData.filter(s => s.date.startsWith(sameMonthLastYear)), [])

  const totalSalesMTD = useMemo(() => currentMonthData.reduce((s, r) => s + r.revenue, 0), [currentMonthData])
  const totalSalesLastMonth = useMemo(() => lastMonthData.reduce((s, r) => s + r.revenue, 0), [lastMonthData])
  const totalSalesSMLY = useMemo(() => sameMonthLYData.reduce((s, r) => s + r.revenue, 0), [sameMonthLYData])
  const totalUnitsMTD = useMemo(() => currentMonthData.reduce((s, r) => s + r.units, 0), [currentMonthData])
  const totalTxnsMTD = useMemo(() => currentMonthData.reduce((s, r) => s + r.transactions, 0), [currentMonthData])
  const avgTxnValue = totalTxnsMTD > 0 ? totalSalesMTD / totalTxnsMTD : 0

  const vsLastMonth = percentChange(totalSalesMTD, totalSalesLastMonth)
  const vsSMLY = percentChange(totalSalesMTD, totalSalesSMLY)

  // ---------- Branch revenue for selected date range ----------
  const branchRevenue = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rangeData) {
      map.set(r.branch, (map.get(r.branch) ?? 0) + r.revenue)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [rangeData])

  const topBranch = branchRevenue[0]?.[0]?.replace('Topgolf ', '') ?? '-'

  // Top 5 branches dynamically recalculated from selected period
  const topBranchesForChart = useMemo(() =>
    branchRevenue.slice(0, 5).map(([name]) => name),
    [branchRevenue],
  )

  // ---------- Revenue multi-line chart ----------
  const revenueChartData = useMemo(() => {
    const bucketMap = new Map<string, Map<string, number>>()
    for (const r of rangeData) {
      const bucket = revenueGranularity === 'daily' ? r.date
        : revenueGranularity === 'weekly' ? getWeekKey(r.date)
        : getMonthKey(r.date)
      if (!bucketMap.has(bucket)) bucketMap.set(bucket, new Map())
      const branchMap = bucketMap.get(bucket)!
      branchMap.set(r.branch, (branchMap.get(r.branch) ?? 0) + r.revenue)
    }

    return Array.from(bucketMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([bucket, branchMap]) => {
        const row: Record<string, string | number> = { date: bucket }
        for (const b of branchNames) {
          row[b] = branchMap.get(b) ?? 0
        }
        return row
      })
  }, [rangeData, revenueGranularity])

  // ---------- Top Products table ----------
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.revenue - a.revenue),
    []
  )

  const productColumns: ColumnDef<Product & Record<string, unknown>>[] = [
    {
      header: "Rank",
      accessor: (_row: Product) => "",
      render: (_v: unknown, _row: Product) => {
        const idx = sortedProducts.findIndex(p => p.id === _row.id)
        return <span className="font-semibold text-muted-foreground">#{idx + 1}</span>
      },
      className: "w-16",
    },
    { header: "Product", accessor: "name" as keyof Product, sortable: true },
    { header: "Brand", accessor: "brand" as keyof Product, sortable: true },
    { header: "Category", accessor: "category" as keyof Product, sortable: true },
    {
      header: "Units Sold",
      accessor: "unitsSold" as keyof Product,
      sortable: true,
      render: (v: unknown) => formatNumber(v as number),
      className: "text-right",
    },
    {
      header: "Revenue",
      accessor: "revenue" as keyof Product,
      sortable: true,
      render: (v: unknown) => formatCurrencyShort(v as number),
      className: "text-right font-semibold",
    },
  ]

  // ---------- Sales by category pie (for selected range) ----------
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rangeData) {
      map.set(r.category, (map.get(r.category) ?? 0) + r.revenue)
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? value / total : 0,
        color: CATEGORY_COLORS[name] ?? '#94A3B8',
      }))
  }, [rangeData])

  const categoryTotal = categoryData.reduce((s, c) => s + c.value, 0)

  // ---------- Heatmap: branch x day-of-week ----------
  const heatmapData = useMemo(() => {
    const map = new Map<string, Map<number, number>>()
    for (const r of currentMonthData) {
      if (!map.has(r.branch)) map.set(r.branch, new Map())
      const dow = new Date(r.date).getDay()
      const dowMap = map.get(r.branch)!
      dowMap.set(dow, (dowMap.get(dow) ?? 0) + r.revenue)
    }

    let maxVal = 0
    for (const dowMap of map.values()) {
      for (const v of dowMap.values()) {
        if (v > maxVal) maxVal = v
      }
    }
    return { map, maxVal }
  }, [currentMonthData])

  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // ---------- Branch comparison bar chart ----------
  const branchBarData = useMemo(() => {
    const data = branchRevenue.map(([branch, revenue]) => ({
      branch: branch.replace('Topgolf ', ''),
      revenue,
    }))
    if (branchSortKey === 'name') data.sort((a, b) => a.branch.localeCompare(b.branch))
    return data
  }, [branchRevenue, branchSortKey])

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Sales Dashboard"
        description="Revenue analytics and performance metrics across all branches"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-fade-in">
        <StatCard
          title="Total Sales MTD"
          value={formatCurrencyShort(totalSalesMTD)}
          icon={DollarSign}
          iconColor="text-gold"
        />
        <StatCard
          title="vs Last Month"
          value={`${vsLastMonth >= 0 ? '+' : ''}${vsLastMonth.toFixed(1)}%`}
          change={vsLastMonth}
          icon={TrendingUp}
        />
        <StatCard
          title="vs Same Month LY"
          value={`${vsSMLY >= 0 ? '+' : ''}${vsSMLY.toFixed(1)}%`}
          change={vsSMLY}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Transaction Value"
          value={formatCurrencyShort(avgTxnValue)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Units Sold"
          value={formatNumber(totalUnitsMTD)}
          icon={Package}
        />
        <StatCard
          title="Top Branch"
          value={topBranch}
          icon={Building2}
          iconColor="text-gold"
        />
      </div>

      {/* Revenue multi-line chart */}
      <Card className="animate-fade-in">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            Revenue Over Time
            <Badge variant="secondary" className="text-[10px] font-normal">Top 5 Branches</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
            <Tabs
              value={revenueGranularity}
              onValueChange={(v) => setGranularityOverride(v as 'daily' | 'weekly' | 'monthly')}
            >
              <TabsList>
                <TabsTrigger value="daily" className="text-xs px-2.5">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2.5">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2.5">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-[10px] text-muted-foreground mb-2">
            {formatDisplayDate(dateFrom)} — {formatDisplayDate(dateTo)} ({rangeDays + 1} days)
            {granularityOverride === null && (
              <span className="ml-2 text-primary">Auto: {suggestedGranularity}</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => {
                  if (revenueGranularity === 'monthly') return v
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatCurrencyShort(v)}
              />
              <Tooltip
                formatter={(value: any, name: any) => [formatCurrencyShort(value), String(name).replace('Topgolf ', '')]}
                labelFormatter={(label: any) => `Date: ${label}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend
                formatter={(value: string) => value.replace('Topgolf ', '')}
                wrapperStyle={{ fontSize: 11 }}
              />
              {topBranchesForChart.map((branch, i) => (
                <Line
                  key={branch}
                  type="monotone"
                  dataKey={branch}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Middle row: Category Pie + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sales by Category</span>
              <span className="text-xs font-normal text-muted-foreground">
                {formatDisplayDate(dateFrom)} — {formatDisplayDate(dateTo)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {/* Pie chart — fixed to full circle with proper sizing */}
              <div className="shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CurrencyPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Interactive legend — always visible */}
              <div className="flex-1 space-y-2 pt-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-foreground truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-foreground">{formatCurrencyShort(cat.value)}</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">
                        {(cat.percent * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total</span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrencyShort(categoryTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap: Branch x Day-of-Week */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Heatmap: Branch x Day of Week (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2 font-semibold text-muted-foreground">Branch</th>
                    {dowLabels.map(d => (
                      <th key={d} className="text-center py-1 px-2 font-semibold text-muted-foreground">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branchNames.map(branch => {
                    const dowMap = heatmapData.map.get(branch)
                    return (
                      <tr key={branch}>
                        <td className="py-1 px-2 whitespace-nowrap text-muted-foreground font-medium">
                          {branch.replace('Topgolf ', '')}
                        </td>
                        {dowLabels.map((_, di) => {
                          const val = dowMap?.get(di) ?? 0
                          const intensity = heatmapData.maxVal > 0 ? val / heatmapData.maxVal : 0
                          const bg = intensity > 0.7
                            ? 'bg-primary text-white'
                            : intensity > 0.5
                            ? 'bg-primary-400 text-white'
                            : intensity > 0.3
                            ? 'bg-primary-200 text-primary-700'
                            : intensity > 0.15
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-primary-50 text-primary-500'
                          return (
                            <td key={di} className="py-1 px-1 text-center">
                              <div className={`rounded px-1 py-1.5 font-medium ${bg}`} title={formatCurrency(val)}>
                                {formatCurrencyShort(val)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch performance bar chart */}
      <Card className="animate-fade-in">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            Branch Performance Comparison
            <span className="text-xs font-normal text-muted-foreground">
              ({formatDisplayDate(dateFrom)} — {formatDisplayDate(dateTo)})
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setBranchSortKey(k => k === 'revenue' ? 'name' : 'revenue')}
          >
            <ArrowUpDown size={14} />
            Sort by {branchSortKey === 'revenue' ? 'Name' : 'Revenue'}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={branchBarData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="branch"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatCurrencyShort(v)}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {branchBarData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products table */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Top Products (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={productColumns}
            data={sortedProducts as (Product & Record<string, unknown>)[]}
            searchPlaceholder="Search products..."
            exportFilename="top-products.csv"
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
