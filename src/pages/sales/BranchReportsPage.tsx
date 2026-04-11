import { useState, useMemo } from "react"
import {
  CheckCircle2, AlertCircle, XCircle, Clock, User, ArrowLeft,
  TrendingUp, TrendingDown, Building2, DollarSign,
} from "lucide-react"

import type { BranchReport } from "@/types"
import { branchReports } from "@/data/mock-sales"
import { formatCurrency, formatCurrencyShort, formatDateTime, cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function getSyncBadge(status: BranchReport['status']) {
  switch (status) {
    case 'synced':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 size={12} /> Synced
        </Badge>
      )
    case 'partial':
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle size={12} /> Partial
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

function BranchDetailView({ report, onBack }: { report: BranchReport; onBack: () => void }) {
  const grossMargin = report.revenue - report.cogs
  const grossMarginPct = report.revenue > 0 ? (grossMargin / report.revenue) * 100 : 0
  const achievementPct = report.target > 0 ? (report.revenue / report.target) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
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
        {getSyncBadge(report.status)}
      </div>

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

            {/* Target vs Actual */}
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
    partial: branchReports.filter(r => r.status === 'partial').length,
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-sm font-semibold text-foreground">{syncStats.synced}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span className="text-sm font-semibold text-foreground">{syncStats.partial}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-danger" />
              <span className="text-sm font-semibold text-foreground">{syncStats.missing}</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {syncStats.synced} synced, {syncStats.partial} partial, {syncStats.missing} missing
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Data Entry Status</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-semibold text-foreground">
                {syncStats.synced + syncStats.partial}/{syncStats.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((syncStats.synced + syncStats.partial) / syncStats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
        {branchReports.map(report => {
          const achievementPct = report.target > 0 ? (report.revenue / report.target) * 100 : 0
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
                {/* Revenue */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrencyShort(report.revenue)}</span>
                </div>

                {/* Target Progress */}
                <ProgressBar value={report.revenue} max={report.target} />

                {/* Last sync */}
                <div className="flex items-center gap-1.5 text-xs text-text-muted pt-1">
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
