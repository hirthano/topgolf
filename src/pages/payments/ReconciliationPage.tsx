import { useState, useMemo } from "react"
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Copy,
  FileCheck, FileX, GitCompare, CalendarDays, Eye,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { reconciliationRecords, transactions } from "@/data/mock-transactions"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ReconciliationRecord } from "@/types"

// --- Constants ---
const TODAY = "2026-04-11"

const DISCREPANCY_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  amount_mismatch: { label: "Amount Mismatch", icon: AlertTriangle, color: "text-amber-600" },
  missing_bank: { label: "Missing Bank Record", icon: FileX, color: "text-red-600" },
  missing_pos: { label: "Missing POS Record", icon: FileX, color: "text-red-600" },
  duplicate: { label: "Duplicate", icon: Copy, color: "text-purple-600" },
  timing: { label: "Timing Difference", icon: Clock, color: "text-blue-600" },
}

function getDaysAgo(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

// --- Calendar grid for reconciliation status ---
function ReconciliationCalendar({ records }: { records: ReconciliationRecord[] }) {
  // Build a map of date -> counts
  const dateMap = new Map<string, { matched: number; unmatched: number; discrepancy: number }>()
  for (const rec of records) {
    const existing = dateMap.get(rec.date) ?? { matched: 0, unmatched: 0, discrepancy: 0 }
    existing[rec.status] = (existing[rec.status] ?? 0) + 1
    dateMap.set(rec.date, existing)
  }

  // Last 28 days
  const days: { date: string; label: string; data: { matched: number; unmatched: number; discrepancy: number } | null }[] = []
  for (let i = 27; i >= 0; i--) {
    const date = getDaysAgo(i)
    const dayNum = date.slice(8, 10)
    days.push({
      date,
      label: dayNum,
      data: dateMap.get(date) ?? null,
    })
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} className="text-center text-xs font-medium text-text-muted py-1">{d}</div>
      ))}
      {days.map((day) => {
        const total = day.data ? day.data.matched + day.data.unmatched + day.data.discrepancy : 0
        const hasIssues = day.data ? (day.data.unmatched + day.data.discrepancy) > 0 : false
        const allGood = day.data ? day.data.matched > 0 && !hasIssues : false

        let bgColor = "bg-secondary"
        if (allGood) bgColor = "bg-emerald-100"
        else if (hasIssues) bgColor = "bg-amber-100"
        if (!day.data || total === 0) bgColor = "bg-secondary"

        return (
          <div
            key={day.date}
            className={`${bgColor} rounded-md p-2 text-center transition-all hover:ring-2 hover:ring-primary/20 cursor-default`}
            title={day.data
              ? `${day.date}: ${day.data.matched} matched, ${day.data.unmatched} unmatched, ${day.data.discrepancy} discrepancy`
              : `${day.date}: No transactions`
            }
          >
            <span className="text-xs font-medium text-foreground">{day.label}</span>
            {total > 0 && (
              <div className="mt-0.5">
                <span className="text-[10px] text-text-muted">{total}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ReconciliationPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())

  // Summary counts
  const matched = reconciliationRecords.filter((r) => r.status === "matched").length
  const unmatched = reconciliationRecords.filter((r) => r.status === "unmatched").length
  const discrepancy = reconciliationRecords.filter((r) => r.status === "discrepancy").length
  const matchRate = ((matched / reconciliationRecords.length) * 100).toFixed(1)

  // Filtered records
  const filteredRecords = useMemo(() => {
    return reconciliationRecords.filter((rec) => {
      if (statusFilter !== "all" && rec.status !== statusFilter) return false
      if (discrepancyFilter !== "all" && rec.discrepancyType !== discrepancyFilter) return false
      return true
    })
  }, [statusFilter, discrepancyFilter])

  // Show only non-matched first, then matched
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const order = { unmatched: 0, discrepancy: 1, matched: 2 }
      return (order[a.status] ?? 2) - (order[b.status] ?? 2)
    })
  }, [filteredRecords])

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMarkMatched = () => {
    // In a real app this would call an API
    setSelectedRecords(new Set())
  }

  const handleFlagReview = () => {
    // In a real app this would call an API
    setSelectedRecords(new Set())
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Reconciliation Center"
        description="Compare POS records against bank settlements and resolve discrepancies"
        actions={
          selectedRecords.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">{selectedRecords.size} selected</span>
              <Button size="sm" onClick={handleMarkMatched} className="gap-1.5">
                <CheckCircle2 size={14} />
                Mark as Matched
              </Button>
              <Button variant="outline" size="sm" onClick={handleFlagReview} className="gap-1.5">
                <Eye size={14} />
                Flag for Review
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Auto-Matched"
          value={`${matched} (${matchRate}%)`}
          icon={FileCheck}
          iconColor="text-success"
        />
        <StatCard
          title="Unmatched"
          value={String(unmatched)}
          icon={FileX}
          iconColor="text-danger"
        />
        <StatCard
          title="Discrepancies"
          value={String(discrepancy)}
          icon={AlertTriangle}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Records"
          value={String(reconciliationRecords.length)}
          icon={GitCompare}
          iconColor="text-primary"
        />
      </div>

      {/* Side-by-side: POS vs Bank + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Comparison Display */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare size={18} className="text-primary" />
                POS vs Bank Settlement
              </CardTitle>
              <CardDescription className="mt-1">Side-by-side comparison of transaction records</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="discrepancy">Discrepancy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                  <SelectItem value="missing_bank">Missing Bank</SelectItem>
                  <SelectItem value="missing_pos">Missing POS</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="timing">Timing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-3 py-3 w-8">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const nonMatched = sortedRecords.filter((r) => r.status !== "matched").map((r) => r.id)
                            setSelectedRecords(new Set(nonMatched))
                          } else {
                            setSelectedRecords(new Set())
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Txn ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">POS Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difference</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.slice(0, 50).map((rec) => {
                    const diff = rec.bankAmount !== null ? rec.posAmount - rec.bankAmount : null
                    const config = rec.discrepancyType ? DISCREPANCY_CONFIG[rec.discrepancyType] : null
                    const DiscIcon = config?.icon ?? AlertTriangle

                    return (
                      <tr
                        key={rec.id}
                        className={`border-b border-border-light last:border-0 transition-colors hover:bg-background ${
                          selectedRecords.has(rec.id) ? "bg-primary-50" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          {rec.status !== "matched" && (
                            <input
                              type="checkbox"
                              checked={selectedRecords.has(rec.id)}
                              onChange={() => toggleRecord(rec.id)}
                              className="rounded border-border"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{rec.transactionId}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(rec.date)}</td>
                        <td className="px-4 py-3 text-foreground text-xs">{rec.branch}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(rec.posAmount)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {rec.bankAmount !== null ? formatCurrency(rec.bankAmount) : (
                            <span className="text-red-500 text-xs italic">Missing</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {diff !== null && diff !== 0 ? (
                            <span className={diff > 0 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                              {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                            </span>
                          ) : diff === 0 ? (
                            <span className="text-emerald-600">-</span>
                          ) : (
                            <span className="text-text-muted">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="px-4 py-3">
                          {config ? (
                            <div className="flex items-center gap-1.5">
                              <DiscIcon size={14} className={config.color} />
                              <span className="text-xs text-muted-foreground">{config.label}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {sortedRecords.length > 50 && (
              <div className="px-4 py-3 text-center text-sm text-text-muted border-t border-border">
                Showing first 50 of {sortedRecords.length} records
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" />
              Reconciliation Calendar
            </CardTitle>
            <CardDescription>Last 28 days - color indicates status</CardDescription>
          </CardHeader>
          <CardContent>
            <ReconciliationCalendar records={reconciliationRecords} />
            <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-emerald-100" />
                All matched
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-amber-100" />
                Has issues
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-secondary" />
                No data
              </div>
            </div>

            {/* Discrepancy breakdown */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Issue Breakdown</h4>
              {Object.entries(DISCREPANCY_CONFIG).map(([key, config]) => {
                const count = reconciliationRecords.filter((r) => r.discrepancyType === key).length
                if (count === 0) return null
                const Icon = config.icon
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={config.color} />
                      <span className="text-sm text-muted-foreground">{config.label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
