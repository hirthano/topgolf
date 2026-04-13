import React, { useState, useMemo, useCallback } from "react"
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Copy,
  FileCheck, FileX, GitCompare, CalendarDays, Eye,
  ChevronDown, ChevronUp, ChevronsUpDown, ArrowUpDown,
  CreditCard, User, ShoppingBag, Building2, Wallet,
  Landmark, Shield, FileText, Upload,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { reconciliationRecords, transactions } from "@/data/mock-transactions"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ReconciliationRecord } from "@/types"

// --- Constants ---
const TODAY = "2026-04-11"

const DISCREPANCY_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  amount_mismatch: { label: "Amount Mismatch", icon: AlertTriangle, color: "text-amber-600" },
  missing_bank: { label: "Missing Bank", icon: FileX, color: "text-red-600" },
  missing_pos: { label: "Missing POS", icon: FileX, color: "text-red-600" },
  duplicate: { label: "Duplicate", icon: Copy, color: "text-purple-600" },
  timing: { label: "Timing Diff", icon: Clock, color: "text-blue-600" },
}

const CHANNEL_LABELS: Record<string, string> = {
  card: "Card",
  ewallet: "E-Wallet",
  bank_transfer: "Bank Transfer",
  marketplace: "Marketplace",
  cash: "Cash",
}

type SortField = "posAmount" | "difference" | null
type SortDirection = "asc" | "desc"

type ResolutionMethod = "bank_settled" | "internal_adjustment" | "write_off"

interface ResolvedRecord {
  id: string
  method: ResolutionMethod
  reason: string
  notes: string
  resolvedAt: string
  resolvedBy: string
}

function getDaysAgo(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

// --- Transaction detail row ---
function TransactionDetailRow({ transactionId }: { transactionId: string }) {
  const tx = transactions.find((t) => t.id === transactionId)
  if (!tx) return <div className="p-3 text-xs text-muted-foreground italic">Transaction not found</div>

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3">
      <div className="flex items-start gap-2">
        <User size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer</div>
          <div className="text-xs font-medium text-foreground">{tx.customerName}</div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <CreditCard size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</div>
          <div className="text-xs font-medium text-foreground">{CHANNEL_LABELS[tx.paymentMethod] ?? tx.paymentMethod}</div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Landmark size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Provider</div>
          <div className="text-xs font-medium text-foreground">{tx.provider}</div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Shield size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Settlement</div>
          <div className="text-xs font-medium">
            <StatusBadge status={tx.settlementStatus} />
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <ShoppingBag size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</div>
          <div className="text-xs font-medium text-foreground">{tx.productCategory}</div>
        </div>
      </div>
      <div className="flex items-start gap-2 lg:col-span-2">
        <FileText size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Items</div>
          <div className="text-xs text-foreground">{tx.items.join(", ")}</div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Building2 size={13} className="text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">POS Ref</div>
          <div className="text-xs font-mono text-foreground">{tx.posReference}</div>
        </div>
      </div>
    </div>
  )
}

// --- Calendar grid for reconciliation status ---
function ReconciliationCalendar({ records }: { records: ReconciliationRecord[] }) {
  const dateMap = new Map<string, { matched: number; unmatched: number; discrepancy: number }>()
  for (const rec of records) {
    const existing = dateMap.get(rec.date) ?? { matched: 0, unmatched: 0, discrepancy: 0 }
    existing[rec.status] = (existing[rec.status] ?? 0) + 1
    dateMap.set(rec.date, existing)
  }

  const days: { date: string; label: string; data: { matched: number; unmatched: number; discrepancy: number } | null }[] = []
  for (let i = 27; i >= 0; i--) {
    const date = getDaysAgo(i)
    const dayNum = date.slice(8, 10)
    days.push({ date, label: dayNum, data: dateMap.get(date) ?? null })
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

// --- Resolve Discrepancy Modal ---
function ResolveDiscrepancyDialog({
  open,
  onOpenChange,
  records,
  onResolve,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: ReconciliationRecord[]
  onResolve: (ids: string[], method: ResolutionMethod, reason: string, notes: string) => void
}) {
  const [method, setMethod] = useState<ResolutionMethod>("bank_settled")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  const totalDifference = records.reduce((sum, rec) => {
    if (rec.bankAmount !== null) return sum + Math.abs(rec.posAmount - rec.bankAmount)
    return sum + rec.posAmount
  }, 0)

  const handleSubmit = () => {
    onResolve(records.map((r) => r.id), method, reason, notes)
    setMethod("bank_settled")
    setReason("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Discrepancy</DialogTitle>
          <DialogDescription>
            {records.length === 1
              ? `Resolve discrepancy for ${records[0].transactionId}`
              : `Bulk resolve ${records.length} discrepancies`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-background p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Records</span>
            <span className="font-medium">{records.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Difference</span>
            <span className="font-medium text-red-600">{formatCurrency(totalDifference)}</span>
          </div>
          {records.length <= 3 && records.map((rec) => (
            <div key={rec.id} className="flex justify-between text-muted-foreground">
              <span className="font-mono">{rec.transactionId}</span>
              <span>{rec.bankAmount !== null ? formatCurrency(Math.abs(rec.posAmount - rec.bankAmount)) : formatCurrency(rec.posAmount)}</span>
            </div>
          ))}
        </div>

        {/* Resolution Method */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Resolution Method</label>
          <Select value={method} onValueChange={(v) => setMethod(v as ResolutionMethod)}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_settled">Bank Settled</SelectItem>
              <SelectItem value="internal_adjustment">Internal Adjustment</SelectItem>
              <SelectItem value="write_off">Write-off</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {method === "bank_settled" && "The bank has processed the correct amount — select the matching bank settlement entry."}
            {method === "internal_adjustment" && "Create a manual adjustment entry (rounding, fee deducted by bank, partial refund, etc.)."}
            {method === "write_off" && "For small, irrecoverable amounts below threshold. Requires Finance approval."}
          </p>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Reason
            {method === "internal_adjustment" && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Select reason..." />
            </SelectTrigger>
            <SelectContent>
              {method === "bank_settled" && (
                <>
                  <SelectItem value="bank_confirmed">Bank confirmed settlement</SelectItem>
                  <SelectItem value="delayed_settlement">Delayed settlement received</SelectItem>
                  <SelectItem value="manual_match">Manually matched to bank entry</SelectItem>
                </>
              )}
              {method === "internal_adjustment" && (
                <>
                  <SelectItem value="rounding">Rounding difference</SelectItem>
                  <SelectItem value="mdr_fee">MDR fee deducted by bank</SelectItem>
                  <SelectItem value="partial_refund">Partial refund issued</SelectItem>
                  <SelectItem value="promo_discount">Promo/discount adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </>
              )}
              {method === "write_off" && (
                <>
                  <SelectItem value="below_threshold">Below write-off threshold</SelectItem>
                  <SelectItem value="irrecoverable">Irrecoverable amount</SelectItem>
                  <SelectItem value="system_error">System error — no recovery</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Notes / Supporting Documentation</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details or reference supporting documents..."
            rows={3}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {method === "write_off" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="shrink-0" />
            Write-off requires Finance team approval. A request will be submitted for review.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!reason}
            className="gap-1.5"
          >
            <CheckCircle2 size={14} />
            {records.length > 1 ? `Resolve ${records.length} Records` : "Resolve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Sortable column header ---
function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      {isActive ? (
        currentDirection === "asc" ? (
          <ChevronUp size={12} className="text-primary" />
        ) : (
          <ChevronDown size={12} className="text-primary" />
        )
      ) : (
        <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  )
}

export function ReconciliationPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [resolvedRecords, setResolvedRecords] = useState<Map<string, ResolvedRecord>>(new Map())
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveTarget, setResolveTarget] = useState<ReconciliationRecord[]>([])

  // Summary counts (exclude resolved)
  const liveRecords = reconciliationRecords.map((r) =>
    resolvedRecords.has(r.id) ? { ...r, status: "matched" as const, discrepancyType: undefined } : r
  )
  const matched = liveRecords.filter((r) => r.status === "matched").length
  const unmatched = liveRecords.filter((r) => r.status === "unmatched").length
  const discrepancy = liveRecords.filter((r) => r.status === "discrepancy").length
  const matchRate = ((matched / liveRecords.length) * 100).toFixed(1)

  // Filtered records
  const filteredRecords = useMemo(() => {
    return liveRecords.filter((rec) => {
      if (statusFilter !== "all" && rec.status !== statusFilter) return false
      if (discrepancyFilter !== "all" && rec.discrepancyType !== discrepancyFilter) return false
      return true
    })
  }, [statusFilter, discrepancyFilter, liveRecords])

  // Sort records
  const sortedRecords = useMemo(() => {
    const arr = [...filteredRecords]

    if (sortField) {
      arr.sort((a, b) => {
        let valA: number, valB: number
        if (sortField === "posAmount") {
          valA = a.posAmount
          valB = b.posAmount
        } else {
          // difference
          valA = a.bankAmount !== null ? Math.abs(a.posAmount - a.bankAmount) : a.posAmount
          valB = b.bankAmount !== null ? Math.abs(b.posAmount - b.bankAmount) : b.posAmount
        }
        return sortDirection === "asc" ? valA - valB : valB - valA
      })
    } else {
      // Default: non-matched first
      arr.sort((a, b) => {
        const order = { unmatched: 0, discrepancy: 1, matched: 2 }
        return (order[a.status] ?? 2) - (order[b.status] ?? 2)
      })
    }

    return arr
  }, [filteredRecords, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }, [sortField])

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMarkMatched = () => {
    setSelectedRecords(new Set())
  }

  const handleFlagReview = () => {
    setSelectedRecords(new Set())
  }

  // Open resolve dialog for single record
  const openResolveSingle = (rec: ReconciliationRecord) => {
    setResolveTarget([rec])
    setResolveDialogOpen(true)
  }

  // Open resolve dialog for selected (bulk)
  const openResolveBulk = () => {
    const targets = sortedRecords.filter((r) => selectedRecords.has(r.id) && r.status !== "matched")
    if (targets.length > 0) {
      setResolveTarget(targets)
      setResolveDialogOpen(true)
    }
  }

  const handleResolve = (ids: string[], method: ResolutionMethod, reason: string, notes: string) => {
    setResolvedRecords((prev) => {
      const next = new Map(prev)
      for (const id of ids) {
        next.set(id, {
          id,
          method,
          reason,
          notes,
          resolvedAt: new Date().toISOString(),
          resolvedBy: "Current User",
        })
      }
      return next
    })
    setSelectedRecords((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.delete(id)
      return next
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-5 space-y-4 animate-fade-in">
      <PageHeader
        title="Reconciliation Center"
        description="Compare POS records against bank settlements and resolve discrepancies"
        actions={
          selectedRecords.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">{selectedRecords.size} selected</span>
              <Button size="sm" onClick={openResolveBulk} className="gap-1.5">
                <CheckCircle2 size={14} />
                Resolve Selected
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkMatched} className="gap-1.5">
                <FileCheck size={14} />
                Mark Matched
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Auto-Matched" value={`${matched} (${matchRate}%)`} icon={FileCheck} iconColor="text-success" />
        <StatCard title="Unmatched" value={String(unmatched)} icon={FileX} iconColor="text-danger" />
        <StatCard title="Discrepancies" value={String(discrepancy)} icon={AlertTriangle} iconColor="text-warning" />
        <StatCard title="Total Records" value={String(liveRecords.length)} icon={GitCompare} iconColor="text-primary" />
      </div>

      {/* Side-by-side: POS vs Bank + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Comparison Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitCompare size={16} className="text-primary" />
                POS vs Bank Settlement
              </CardTitle>
              <CardDescription className="mt-1 text-xs">Side-by-side comparison of transaction records</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
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
                <SelectTrigger className="w-[150px] h-8 text-xs">
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
          <CardContent className="px-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-2 py-2 w-7">
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
                  <th className="px-2 py-2 w-5"></th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Txn ID</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-2 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <SortableHeader label="POS Amt" field="posAmount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bank Amt</th>
                  <th className="px-2 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <SortableHeader label="Diff" field="difference" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Issue</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.slice(0, 50).map((rec) => {
                  const diff = rec.bankAmount !== null ? rec.posAmount - rec.bankAmount : null
                  const config = rec.discrepancyType ? DISCREPANCY_CONFIG[rec.discrepancyType] : null
                  const DiscIcon = config?.icon ?? AlertTriangle
                  const isExpanded = expandedRow === rec.id
                  const isResolved = resolvedRecords.has(rec.id)
                  const resolveInfo = resolvedRecords.get(rec.id)
                  const rowBg = selectedRecords.has(rec.id) ? "bg-primary-50" : ""

                  return (
                    <React.Fragment key={rec.id}>
                      <tr className="group transition-colors hover:bg-background">
                        <td className={`px-2 py-2 border-b border-border-light ${rowBg}`}>
                          {rec.status !== "matched" && (
                            <input
                              type="checkbox"
                              checked={selectedRecords.has(rec.id)}
                              onChange={() => toggleRecord(rec.id)}
                              className="rounded border-border"
                            />
                          )}
                        </td>
                        <td className={`px-1 py-2 border-b border-border-light ${rowBg}`}>
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : rec.id)}
                            className="p-0.5 rounded hover:bg-secondary transition-colors"
                            title="Show details"
                          >
                            {isExpanded ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          </button>
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light font-mono text-[11px] text-primary font-medium ${rowBg}`}>
                          {rec.transactionId}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-muted-foreground whitespace-nowrap ${rowBg}`}>
                          {formatDate(rec.date)}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-foreground max-w-[100px] truncate ${rowBg}`} title={rec.branch}>
                          {rec.branch.replace("Topgolf ", "")}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-right font-medium whitespace-nowrap ${rowBg}`}>
                          {formatCurrency(rec.posAmount)}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-right font-medium whitespace-nowrap ${rowBg}`}>
                          {rec.bankAmount !== null ? formatCurrency(rec.bankAmount) : (
                            <span className="text-red-500 italic">Missing</span>
                          )}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-right whitespace-nowrap ${rowBg}`}>
                          {isResolved ? (
                            <span className="text-emerald-600 font-medium">Rp 0</span>
                          ) : diff !== null && diff !== 0 ? (
                            <span className={diff > 0 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                              {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                            </span>
                          ) : diff === 0 ? (
                            <span className="text-emerald-600">-</span>
                          ) : (
                            <span className="text-text-muted">N/A</span>
                          )}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light text-center ${rowBg}`}>
                          {isResolved ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">Reconciled</Badge>
                          ) : (
                            <StatusBadge status={rec.status} />
                          )}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light ${rowBg}`}>
                          {isResolved ? (
                            <span className="text-[10px] text-emerald-600 capitalize">{resolveInfo!.method.replace(/_/g, " ")}</span>
                          ) : config ? (
                            <div className="flex items-center gap-1">
                              <DiscIcon size={11} className={config.color} />
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{config.label}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted">-</span>
                          )}
                        </td>
                        <td className={`px-2 py-2 border-b border-border-light ${rowBg}`}>
                          {rec.status !== "matched" && !isResolved && (
                            <button
                              onClick={() => openResolveSingle(rec)}
                              className="text-[10px] text-primary hover:text-primary/80 font-medium whitespace-nowrap"
                              title="Resolve this discrepancy"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="bg-slate-50/60 border-b border-border-light p-0">
                            <TransactionDetailRow transactionId={rec.transactionId} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>

            {sortedRecords.length > 50 && (
              <div className="px-3 py-2 text-center text-xs text-text-muted border-t border-border">
                Showing first 50 of {sortedRecords.length} records
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarDays size={16} className="text-primary" />
              Reconciliation Calendar
            </CardTitle>
            <CardDescription className="text-xs">Last 28 days - color indicates status</CardDescription>
          </CardHeader>
          <CardContent>
            <ReconciliationCalendar records={liveRecords} />
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
                const count = liveRecords.filter((r) => r.discrepancyType === key).length
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

      {/* Resolve Discrepancy Dialog */}
      <ResolveDiscrepancyDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        records={resolveTarget}
        onResolve={handleResolve}
      />
    </div>
  )
}
