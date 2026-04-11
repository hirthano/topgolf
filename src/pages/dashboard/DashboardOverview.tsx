import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard, TrendingUp, Receipt, Users, Store,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils'
import { transactions } from '@/data/mock-transactions'
import { salesData, products } from '@/data/mock-sales'
import { reimbursements } from '@/data/mock-reimbursements'
import { freelancerPayments } from '@/data/mock-freelancers'
import { vendorInvoices } from '@/data/mock-vendors'

const COLORS = ['#1B4332', '#C9A84C', '#2D6A4F', '#46AF83', '#0EA5E9', '#F59E0B']

export function DashboardOverview() {
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

    // Payments
    const todayTransactions = transactions.filter(t => {
      const d = new Date(t.date)
      return d.toDateString() === now.toDateString()
    })
    const todayRevenue = todayTransactions.reduce((s, t) => s + t.amount, 0)
    const pendingSettlements = transactions.filter(t => t.settlementStatus === 'pending').length
    const failedTransactions = transactions.filter(t => t.settlementStatus === 'failed' || t.settlementStatus === 'disputed').length

    // Sales
    const thisMonthSales = salesData.filter(s => s.date.startsWith(thisMonth))
    const lastMonthSales = salesData.filter(s => s.date.startsWith(lastMonthStr))
    const thisMonthRevenue = thisMonthSales.reduce((s, d) => s + d.revenue, 0)
    const lastMonthRevenue = lastMonthSales.reduce((s, d) => s + d.revenue, 0)
    const salesGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // Reimbursements
    const pendingReimbursements = reimbursements.filter(r => r.status === 'pending_approval').length
    const totalPendingAmount = reimbursements.filter(r => r.status === 'pending_approval').reduce((s, r) => s + r.amount, 0)

    // Freelancers
    const thisMonthFreelancer = freelancerPayments.filter(p => p.paymentDate.startsWith(thisMonth))
    const freelancerSpend = thisMonthFreelancer.reduce((s, p) => s + p.totalCompanyCost, 0)

    // Vendors
    const overdueInvoices = vendorInvoices.filter(i => {
      if (i.status === 'paid' || i.status === 'disputed') return false
      return new Date(i.dueDate) < now
    }).length
    const totalOutstanding = vendorInvoices
      .filter(i => i.status !== 'paid')
      .reduce((s, i) => s + i.amount, 0)

    return {
      todayRevenue, pendingSettlements, failedTransactions,
      thisMonthRevenue, salesGrowth, lastMonthRevenue,
      pendingReimbursements, totalPendingAmount,
      freelancerSpend,
      overdueInvoices, totalOutstanding,
    }
  }, [])

  // Revenue trend (last 7 days)
  const revenueTrend = useMemo(() => {
    const days: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayRevenue = salesData
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + s.revenue, 0)
      days.push({
        date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      })
    }
    return days
  }, [])

  // Sales by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    salesData.forEach(s => {
      map[s.category] = (map[s.category] || 0) + s.revenue
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [])

  // Top products
  const topProducts = useMemo(() =>
    [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  [])

  // Module quick access cards
  const modules = [
    { title: 'Payment Monitoring', desc: 'Track settlements & reconciliation', icon: CreditCard, path: '/payments', color: 'bg-primary' },
    { title: 'Sales Analytics', desc: 'Revenue insights & AI assistant', icon: TrendingUp, path: '/sales', color: 'bg-gold' },
    { title: 'Reimbursements', desc: `${stats.pendingReimbursements} pending approvals`, icon: Receipt, path: '/reimbursements', color: 'bg-info' },
    { title: 'Freelancer Payments', desc: 'Tax calculation & tracking', icon: Users, path: '/freelancers', color: 'bg-success' },
    { title: 'Vendor Management', desc: `${stats.overdueInvoices} overdue invoices`, icon: Store, path: '/vendors', color: 'bg-warning' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back. Here's a summary of your operations today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrencyShort(stats.todayRevenue)}
          icon={CreditCard}
          change={stats.salesGrowth}
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrencyShort(stats.thisMonthRevenue)}
          icon={TrendingUp}
          change={stats.salesGrowth}
        />
        <StatCard
          title="Pending Settlements"
          value={String(stats.pendingSettlements)}
          icon={Clock}
          change={-2.3}
        />
        <StatCard
          title="Alerts"
          value={String(stats.failedTransactions + stats.overdueInvoices)}
          icon={AlertTriangle}
          change={0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: any) => formatCurrencyShort(v)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={2} dot={{ fill: '#C9A84C', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }: any) => name}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Quick Access + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Access */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map(m => (
              <Link key={m.path} to={m.path} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`${m.color} p-3 rounded-lg text-white`}>
                      <m.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.desc}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-text-muted shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.brand} · {p.unitsSold} units</p>
                </div>
                <span className="text-sm font-semibold text-primary">{formatCurrencyShort(p.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Reimbursements</p>
                <p className="text-lg font-bold text-foreground">{stats.pendingReimbursements} requests</p>
                <p className="text-xs text-text-muted">{formatCurrency(stats.totalPendingAmount)} total</p>
              </div>
              <Receipt size={24} className="text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Freelancer Spend (MTD)</p>
                <p className="text-lg font-bold text-foreground">{formatCurrencyShort(stats.freelancerSpend)}</p>
                <p className="text-xs text-text-muted">Tax & payments</p>
              </div>
              <Users size={24} className="text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Payables</p>
                <p className="text-lg font-bold text-foreground">{formatCurrencyShort(stats.totalOutstanding)}</p>
                <p className="text-xs text-text-muted">{stats.overdueInvoices} overdue</p>
              </div>
              <Store size={24} className="text-danger" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
