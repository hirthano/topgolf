import { useState, useMemo, Fragment } from "react"
import {
  Filter, X, Download, ChevronDown, ChevronRight,
  CreditCard, Wallet, Building2, ShoppingBag, Banknote,
  CheckCircle2, Clock, XCircle,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { transactions } from "@/data/mock-transactions"
import { formatCurrency, formatDate, downloadCSV } from "@/lib/utils"
import type { Transaction, PaymentChannel, SettlementStatus } from "@/types"

// --- Constants ---
const branchNames = Array.from(new Set(transactions.map((t) => t.branch))).sort()
const paymentChannels: { value: PaymentChannel; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "marketplace", label: "Marketplace" },
  { value: "cash", label: "Cash" },
]
const settlementStatuses: { value: SettlementStatus; label: string }[] = [
  { value: "settled", label: "Settled" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "disputed", label: "Disputed" },
]

const CHANNEL_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  ewallet: Wallet,
  bank_transfer: Building2,
  marketplace: ShoppingBag,
  cash: Banknote,
}

const CHANNEL_LABELS: Record<string, string> = {
  card: "Card",
  ewallet: "E-Wallet",
  bank_transfer: "Bank Transfer",
  marketplace: "Marketplace",
  cash: "Cash",
}

// --- Lifecycle step component ---
function PaymentLifecycle({ tx }: { tx: Transaction }) {
  const steps = [
    {
      label: "Initiated",
      date: tx.date,
      icon: CreditCard,
      done: true,
    },
    {
      label: "Processed",
      date: tx.date,
      icon: tx.settlementStatus === "failed" ? XCircle : CheckCircle2,
      done: tx.settlementStatus !== "failed",
    },
    {
      label: "Settled",
      date: tx.settlementDate,
      icon: tx.settlementStatus === "settled" ? CheckCircle2 : Clock,
      done: tx.settlementStatus === "settled",
    },
  ]

  return (
    <div className="flex items-center gap-3 py-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <step.icon
              size={16}
              className={step.done ? "text-success" : "text-text-muted"}
            />
            <div>
              <p className={`text-xs font-medium ${step.done ? "text-foreground" : "text-text-muted"}`}>
                {step.label}
              </p>
              <p className="text-xs text-text-muted">
                {step.date ? formatDate(step.date) : "Pending"}
              </p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 ${step.done ? "bg-success" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function TransactionsPage() {
  // Filter states
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [branch, setBranch] = useState("all")
  const [channel, setChannel] = useState("all")
  const [status, setStatus] = useState("all")
  const [amountMin, setAmountMin] = useState("")
  const [amountMax, setAmountMax] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Active filter chips
  const activeFilters = useMemo(() => {
    const chips: { label: string; key: string }[] = []
    if (dateFrom) chips.push({ label: `From: ${dateFrom}`, key: "dateFrom" })
    if (dateTo) chips.push({ label: `To: ${dateTo}`, key: "dateTo" })
    if (branch !== "all") chips.push({ label: `Branch: ${branch}`, key: "branch" })
    if (channel !== "all") chips.push({ label: `Channel: ${CHANNEL_LABELS[channel] ?? channel}`, key: "channel" })
    if (status !== "all") chips.push({ label: `Status: ${status}`, key: "status" })
    if (amountMin) chips.push({ label: `Min: Rp ${amountMin}`, key: "amountMin" })
    if (amountMax) chips.push({ label: `Max: Rp ${amountMax}`, key: "amountMax" })
    return chips
  }, [dateFrom, dateTo, branch, channel, status, amountMin, amountMax])

  const clearFilter = (key: string) => {
    const actions: Record<string, () => void> = {
      dateFrom: () => setDateFrom(""),
      dateTo: () => setDateTo(""),
      branch: () => setBranch("all"),
      channel: () => setChannel("all"),
      status: () => setStatus("all"),
      amountMin: () => setAmountMin(""),
      amountMax: () => setAmountMax(""),
    }
    actions[key]?.()
  }

  const clearAllFilters = () => {
    setDateFrom("")
    setDateTo("")
    setBranch("all")
    setChannel("all")
    setStatus("all")
    setAmountMin("")
    setAmountMax("")
  }

  // Filtered data
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      if (dateFrom && tx.date < dateFrom) return false
      if (dateTo && tx.date > dateTo) return false
      if (branch !== "all" && tx.branch !== branch) return false
      if (channel !== "all" && tx.paymentMethod !== channel) return false
      if (status !== "all" && tx.settlementStatus !== status) return false
      if (amountMin && tx.amount < Number(amountMin)) return false
      if (amountMax && tx.amount > Number(amountMax)) return false
      return true
    })
  }, [dateFrom, dateTo, branch, channel, status, amountMin, amountMax])

  // Export handler
  const handleExport = () => {
    const exportData = filteredData.map((tx) => ({
      "Transaction ID": tx.id,
      "Date": tx.date,
      "Branch": tx.branch,
      "Customer": tx.customerName,
      "Amount": tx.amount,
      "Payment Method": CHANNEL_LABELS[tx.paymentMethod] ?? tx.paymentMethod,
      "Provider": tx.provider,
      "Settlement Status": tx.settlementStatus,
      "POS Reference": tx.posReference,
      "Items": tx.items.join("; "),
    }))
    downloadCSV(exportData, "topgolf-transactions.csv")
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Transaction Explorer"
        description="Search, filter, and analyze all payment transactions"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <Filter size={14} />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter Panel */}
      {showFilters && (
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Branch</label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branchNames.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Payment Channel</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {paymentChannels.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Settlement Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Settlement Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {settlementStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Min Amount</label>
                <Input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Max Amount</label>
                <Input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="No limit"
                  className="h-9"
                />
              </div>

              {/* Clear */}
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5 text-text-muted">
                  <X size={14} />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">Active filters:</span>
          {activeFilters.map((f) => (
            <Badge key={f.key} variant="secondary" className="gap-1 cursor-pointer hover:bg-border" onClick={() => clearFilter(f.key)}>
              {f.label}
              <X size={12} />
            </Badge>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredData.length}</span> of {transactions.length} transactions
        </p>
      </div>

      {/* Data Table with expandable rows */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-3 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (IDR)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">POS Ref</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 50).map((tx) => {
                  const isExpanded = expandedRow === tx.id
                  const Icon = CHANNEL_ICONS[tx.paymentMethod] ?? CreditCard
                  return (
                    <Fragment key={tx.id}>
                      <tr
                        className="border-b border-border-light last:border-0 transition-colors hover:bg-background cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : tx.id)}
                      >
                        <td className="px-3 py-3">
                          <span className="text-text-muted">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{tx.id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.date)}</td>
                        <td className="px-4 py-3 text-foreground">{tx.branch}</td>
                        <td className="px-4 py-3 text-foreground">{tx.customerName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(tx.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} className="text-text-muted" />
                            <span className="text-xs">{tx.provider}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={tx.settlementStatus} /></td>
                        <td className="px-4 py-3 font-mono text-xs text-text-muted">{tx.posReference}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-background">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Payment Lifecycle */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Payment Lifecycle</p>
                                <PaymentLifecycle tx={tx} />
                              </div>
                              {/* Item Details */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Items Purchased</p>
                                <div className="space-y-1">
                                  {tx.items.map((item, i) => (
                                    <p key={i} className="text-sm text-foreground">{item}</p>
                                  ))}
                                </div>
                                <p className="text-xs text-text-muted mt-2">Category: {tx.productCategory}</p>
                              </div>
                              {/* Additional Info */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Settlement Details</p>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-text-muted">Settlement Date:</span> <span className="text-foreground">{tx.settlementDate ? formatDate(tx.settlementDate) : "Pending"}</span></p>
                                  <p><span className="text-text-muted">Channel:</span> <span className="text-foreground">{CHANNEL_LABELS[tx.paymentMethod]}</span></p>
                                  <p><span className="text-text-muted">Provider:</span> <span className="text-foreground">{tx.provider}</span></p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredData.length > 50 && (
            <div className="px-4 py-3 text-center text-sm text-text-muted border-t border-border">
              Showing first 50 of {filteredData.length} results. Use filters to narrow down.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
