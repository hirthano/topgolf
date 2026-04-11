import { useState, useMemo } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  DollarSign, TrendingUp, ShoppingCart, Package, Building2, ArrowUpDown,
} from "lucide-react"

import type { Product } from "@/types"
import { salesData, products } from "@/data/mock-sales"
import { formatCurrency, formatCurrencyShort, formatNumber, percentChange } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const CHART_COLORS = ['#1B4332', '#C9A84C', '#2D6A4F', '#46AF83', '#0EA5E9', '#F59E0B']

// Unique branch names from sales data
const branchNames = Array.from(new Set(salesData.map(s => s.branch)))

// Aggregate helpers
function aggregateByDate(records: typeof salesData) {
  const map = new Map<string, number>()
  for (const r of records) {
    map.set(r.date, (map.get(r.date) ?? 0) + r.revenue)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, revenue]) => ({ date, revenue }))
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return start.toISOString().split('T')[0]
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

// Current month: April 2026
const currentMonth = '2026-04'
const lastMonth = '2026-03'
const sameMonthLastYear = '2025-04'

export function SalesDashboard() {
  const [revenueGranularity, setRevenueGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [branchSortKey, setBranchSortKey] = useState<'revenue' | 'name'>('revenue')

  // ---------- KPI calculations ----------
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

  // Top branch by revenue
  const branchRevenue = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of currentMonthData) {
      map.set(r.branch, (map.get(r.branch) ?? 0) + r.revenue)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [currentMonthData])
  const topBranch = branchRevenue[0]?.[0]?.replace('Topgolf ', '') ?? '-'

  // ---------- Revenue multi-line chart ----------
  const revenueChartData = useMemo(() => {
    // Limit to last 90 days for daily, full range otherwise
    const cutoff = revenueGranularity === 'daily' ? '2026-01-10' : '2025-05-01'
    const filtered = salesData.filter(s => s.date >= cutoff)

    // Group by branch + time bucket
    const bucketMap = new Map<string, Map<string, number>>()
    for (const r of filtered) {
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
  }, [revenueGranularity])

  // Take the top 5 branches for the line chart to keep it readable
  const topBranchesForChart = useMemo(() =>
    branchRevenue.slice(0, 5).map(([name]) => name),
    [branchRevenue]
  )

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

  // ---------- Sales by category pie ----------
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of currentMonthData) {
      map.set(r.category, (map.get(r.category) ?? 0) + r.revenue)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [currentMonthData])

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
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Revenue Over Time (Top 5 Branches)</CardTitle>
          <Tabs value={revenueGranularity} onValueChange={(v) => setRevenueGranularity(v as 'daily' | 'weekly' | 'monthly')}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
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
            <CardTitle>Sales by Category (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrencyShort(value)} />
              </PieChart>
            </ResponsiveContainer>
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
          <CardTitle>Branch Performance Comparison (MTD)</CardTitle>
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
