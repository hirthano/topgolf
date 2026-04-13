import { useState, useMemo } from "react"
import {
  CheckCircle2, AlertCircle, XCircle, Clock, User, ArrowLeft,
  TrendingUp, TrendingDown, Building2, DollarSign,
  Wifi, WifiOff, UserCheck, ClipboardCheck, MessageSquare, Send,
} from "lucide-react"

import type { BranchReport } from "@/types"
import { branchReports, salesData } from "@/data/mock-sales"
import { formatCurrency, formatCurrencyShort, formatDateTime, cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// --- Sync status model with dual dimensions ---
interface SyncDetail {
  posSync: 'synced' | 'missing'
  picConfirmed: boolean
  registersTotal: number
  registersSynced: number
  missingReason?: string
}

function buildSyncDetail(report: BranchReport): SyncDetail {
  if (report.status === 'synced') {
    return { posSync: 'synced', picConfirmed: true, registersTotal: 4, registersSynced: 4 }
  }
  // missing
  return {
    posSync: 'missing',
    picConfirmed: false,
    registersTotal: 4,
    registersSynced: 0,
    missingReason: 'No POS data received — check API connection',
  }
}

function getSyncBadge(status: BranchReport['status']) {
  switch (status) {
    case 'synced':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 size={12} /> Synced
        </Badge>
      )
    case 'missing':
      return (
        <Badge variant="danger" className="gap-1">
          <XCircle size={12} /> Missing
        </Badge>
      )
  }
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 150) : 0
  const displayPct = Math.min(pct, 100)
  const color = pct >= 100 ? 'bg-success' : pct >= 80 ? 'bg-gold' : 'bg-danger'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatCurrencyShort(value)} / {formatCurrencyShort(max)}
        </span>
        <span className={cn("font-semibold", pct >= 100 ? "text-success" : pct >= 80 ? "text-gold" : "text-danger")}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  )
}

// --- PIC Daily Report Confirmation view ---
function DailyReportConfirmation({ report, onBack }: { report: BranchReport; onBack: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [dataMatches, setDataMatches] = useState(false)
  const [noDiscrepancies, setNoDiscrepancies] = useState(false)
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Build category breakdown from sales data for this branch (today = Apr 10)
  const todayData = useMemo(() => {
    const today = '2026-04-10'
    return salesData.filter(s => s.branch === report.branch && s.date === today)
  }, [report.branch])

  const totalRevenue = todayData.reduce((s, r) => s + r.revenue, 0)
  const totalTxns = todayData.reduce((s, r) => s + r.transactions, 0)
  const totalUnits = todayData.reduce((s, r) => s + r.units, 0)

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { revenue: number; units: number; txns: number }>()
    for (const r of todayData) {
      const existing = map.get(r.category) ?? { revenue: 0, units: 0, txns: 0 }
      existing.revenue += r.revenue
      existing.units += r.units
      existing.txns += r.transactions
      map.set(r.category, existing)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].revenue - a[1].revenue)
  }, [todayData])

  const canSubmit = dataMatches && noDiscrepancies && !submitted

  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Branch Detail
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Daily Report Confirmation</h2>
          <p className="text-sm text-muted-foreground">{report.branch} — 10/04/2026</p>
        </div>
        {submitted ? (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 size={14} /> Submitted
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1.5">
            <Clock size={14} /> Pending Confirmation
          </Badge>
        )}
      </div>

      {/* Auto-pulled sales summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck size={16} className="text-primary" />
            Auto-Pulled Sales Summary
          </CardTitle>
          <CardDescription className="text-xs">Data automatically synced from POS system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-background border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-lg font-bold text-foreground">{totalTxns}</p>
            </div>
            <div className="rounded-lg bg-background border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold text-primary">{formatCurrencyShort(totalRevenue)}</p>
            </div>
            <div className="rounded-lg bg-background border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Units Sold</p>
              <p className="text-lg font-bold text-foreground">{totalUnits}</p>
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Breakdown by Category</p>
            <div className="space-y-2">
              {categoryBreakdown.map(([category, data]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{data.txns} txns</span>
                    <span className="font-medium text-foreground w-28 text-right">{formatCurrencyShort(data.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIC Confirmation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck size={16} className="text-primary" />
            PIC Confirmation Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={dataMatches}
              onChange={(e) => setDataMatches(e.target.checked)}
              disabled={submitted}
              className="mt-0.5 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                This matches what I see in my POS
              </p>
              <p className="text-xs text-muted-foreground">I confirm the transaction count, revenue totals, and category breakdown are accurate</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={noDiscrepancies}
              onChange={(e) => setNoDiscrepancies(e.target.checked)}
              disabled={submitted}
              className="mt-0.5 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                No discrepancies to flag
              </p>
              <p className="text-xs text-muted-foreground">All registers were operational and data is complete for the full business day</p>
            </div>
          </label>

          {/* Notes field */}
          <div className="pt-2">
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitted}
              placeholder='e.g., "Register 2 was down from 2-4 PM, some cash sales were recorded manually"'
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-60"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex items-center justify-between">
        {!submitted && !canSubmit && (
          <p className="text-xs text-muted-foreground">
            Please check both items above to submit your daily report.
          </p>
        )}
        {submitted && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Daily report submitted successfully. Branch status updated to "Synced."
          </p>
        )}
        <div className="ml-auto">
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="gap-2"
          >
            <Send size={14} />
            Submit Daily Report
          </Button>
        </div>
      </div>
    </div>
  )
}

function BranchDetailView({ report, onBack }: { report: BranchReport; onBack: () => void }) {
  const [showDailyConfirmation, setShowDailyConfirmation] = useState(false)
  const grossMargin = report.revenue - report.cogs
  const grossMarginPct = report.revenue > 0 ? (grossMargin / report.revenue) * 100 : 0
  const achievementPct = report.target > 0 ? (report.revenue / report.target) * 100 : 0
  const syncDetail = buildSyncDetail(report)

  if (showDailyConfirmation) {
    return (
      <DailyReportConfirmation report={report} onBack={() => setShowDailyConfirmation(false)} />
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
        <ArrowLeft size={16} /> Back to All Branches
      </Button>

      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{report.branch}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            PIC: {report.pic} | Last sync: {formatDateTime(report.lastSync)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getSyncBadge(report.status)}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowDailyConfirmation(true)}>
            <ClipboardCheck size={14} />
            Daily Report
          </Button>
        </div>
      </div>

      {/* Sync Status Detail Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sync Status Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              {syncDetail.posSync === 'synced' ? (
                <Wifi size={18} className="text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <WifiOff size={18} className="text-red-500 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">POS Data Sync</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {syncDetail.registersSynced}/{syncDetail.registersTotal} terminals synced
                </p>
                {syncDetail.posSync === 'synced' ? (
                  <Badge variant="success" className="mt-1 text-[10px]">Complete</Badge>
                ) : (
                  <Badge variant="danger" className="mt-1 text-[10px]">Missing</Badge>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <UserCheck size={18} className={syncDetail.picConfirmed ? "text-emerald-600 mt-0.5 shrink-0" : "text-muted-foreground mt-0.5 shrink-0"} />
              <div>
                <p className="text-xs font-semibold text-foreground">PIC Confirmation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {syncDetail.picConfirmed ? 'Daily report confirmed by PIC' : 'Awaiting PIC verification'}
                </p>
                {syncDetail.picConfirmed ? (
                  <Badge variant="success" className="mt-1 text-[10px]">Confirmed</Badge>
                ) : (
                  <Badge variant="secondary" className="mt-1 text-[10px]">Pending</Badge>
                )}
              </div>
            </div>
          </div>
          {syncDetail.missingReason && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {syncDetail.missingReason}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (MTD)"
          value={formatCurrencyShort(report.revenue)}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Target"
          value={formatCurrencyShort(report.target)}
          icon={Building2}
          iconColor="text-gold"
        />
        <StatCard
          title="Achievement"
          value={`${achievementPct.toFixed(0)}%`}
          change={achievementPct - 100}
          icon={achievementPct >= 100 ? TrendingUp : TrendingDown}
        />
        <StatCard
          title="Gross Margin"
          value={`${grossMarginPct.toFixed(1)}%`}
          icon={DollarSign}
          iconColor="text-success"
        />
      </div>

      {/* P&L Summary */}
      <Card>
        <CardHeader>
          <CardTitle>P&L Summary (MTD)</CardTitle>
          <CardDescription>Profit and loss breakdown for {report.branch}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-semibold text-foreground">Revenue</span>
              <span className="font-bold text-lg text-foreground">{formatCurrency(report.revenue)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
              <span className="text-danger font-medium">({formatCurrency(report.cogs)})</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border bg-primary-50 rounded px-3 -mx-3">
              <span className="font-semibold text-primary">Gross Margin</span>
              <div className="text-right">
                <span className="font-bold text-primary">{formatCurrency(grossMargin)}</span>
                <span className="ml-2 text-sm text-primary-500">({grossMarginPct.toFixed(1)}%)</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Target vs Actual</h4>
              <ProgressBar value={report.revenue} max={report.target} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BranchReportsPage() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const selectedReport = useMemo(
    () => branchReports.find(r => r.branch === selectedBranch) ?? null,
    [selectedBranch]
  )

  const syncStats = useMemo(() => ({
    synced: branchReports.filter(r => r.status === 'synced').length,
    missing: branchReports.filter(r => r.status === 'missing').length,
    total: branchReports.length,
  }), [])

  const totalRevenue = useMemo(() => branchReports.reduce((s, r) => s + r.revenue, 0), [])
  const totalTarget = useMemo(() => branchReports.reduce((s, r) => s + r.target, 0), [])

  if (selectedReport) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-5 animate-fade-in">
        <BranchDetailView report={selectedReport} onBack={() => setSelectedBranch(null)} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Branch Reports"
        description="PIC data entry status, sync tracking, and branch-level performance"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <StatCard
          title="Total Revenue (MTD)"
          value={formatCurrencyShort(totalRevenue)}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Overall Achievement"
          value={`${totalTarget > 0 ? ((totalRevenue / totalTarget) * 100).toFixed(0) : 0}%`}
          change={totalTarget > 0 ? (totalRevenue / totalTarget) * 100 - 100 : 0}
          icon={Building2}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Sync Status</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-sm font-semibold text-foreground">{syncStats.synced}</span>
              <span className="text-xs text-muted-foreground">Synced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-danger" />
              <span className="text-sm font-semibold text-foreground">{syncStats.missing}</span>
              <span className="text-xs text-muted-foreground">Missing</span>
            </div>
          </div>
          <div className="mt-2 space-y-1 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Wifi size={10} /> POS Data + <UserCheck size={10} /> PIC Confirmation
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Data Entry Status</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-semibold text-foreground">
                {syncStats.synced}/{syncStats.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(syncStats.synced / syncStats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
        {branchReports.map(report => {
          const achievementPct = report.target > 0 ? (report.revenue / report.target) * 100 : 0
          const detail = buildSyncDetail(report)
          return (
            <Card
              key={report.branch}
              className="card-hover cursor-pointer"
              onClick={() => setSelectedBranch(report.branch)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{report.branch}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <User size={12} />
                      {report.pic}
                    </CardDescription>
                  </div>
                  {getSyncBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrencyShort(report.revenue)}</span>
                </div>

                <ProgressBar value={report.revenue} max={report.target} />

                {/* Dual-dimension sync indicators */}
                <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
                  <span className="flex items-center gap-1">
                    {detail.posSync === 'synced' ? (
                      <Wifi size={10} className="text-emerald-500" />
                    ) : (
                      <WifiOff size={10} className="text-red-400" />
                    )}
                    POS {detail.registersSynced}/{detail.registersTotal}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck size={10} className={detail.picConfirmed ? 'text-emerald-500' : 'text-muted-foreground'} />
                    PIC {detail.picConfirmed ? 'OK' : '—'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} />
                  Last sync: {formatDateTime(report.lastSync)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
