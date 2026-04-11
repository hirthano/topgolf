import { useState, useMemo } from "react"
import {
  FileText, AlertTriangle, CheckCircle2, Package, Receipt, ClipboardCheck,
  ArrowRight, Flag,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { vendors, vendorInvoices } from "@/data/mock-vendors"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { VendorInvoice, InvoiceStatus } from "@/types"
import type { ColumnDef } from "@/components/shared/DataTable"

const statuses: InvoiceStatus[] = ["received", "verified", "approved", "scheduled", "paid", "disputed"]
const vendorNames = Array.from(new Set(vendorInvoices.map((i) => i.vendorName))).sort()

const columns: ColumnDef<VendorInvoice & Record<string, unknown>>[] = [
  {
    header: "Invoice #",
    accessor: "invoiceNumber" as keyof VendorInvoice,
    sortable: true,
    render: (v) => <span className="font-mono text-xs">{v as string}</span>,
  },
  {
    header: "Vendor",
    accessor: "vendorName" as keyof VendorInvoice,
    sortable: true,
    render: (v) => {
      const name = v as string
      return <span title={name}>{name.length > 30 ? name.substring(0, 30) + "..." : name}</span>
    },
  },
  {
    header: "Amount",
    accessor: "amount" as keyof VendorInvoice,
    sortable: true,
    render: (v) => <CurrencyDisplay amount={v as number} size="sm" />,
    className: "text-right",
  },
  {
    header: "Issue Date",
    accessor: "issueDate" as keyof VendorInvoice,
    sortable: true,
    render: (v) => formatDate(v as string),
  },
  {
    header: "Due Date",
    accessor: "dueDate" as keyof VendorInvoice,
    sortable: true,
    render: (v) => {
      const due = new Date(v as string)
      const today = new Date("2026-04-11")
      const isOverdue = due < today
      return (
        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
          {formatDate(v as string)}
          {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
        </span>
      )
    },
  },
  {
    header: "Terms",
    accessor: "paymentTerms" as keyof VendorInvoice,
    render: (v) => <span className="text-muted-foreground text-xs">{v as string}</span>,
  },
  {
    header: "Status",
    accessor: "status" as keyof VendorInvoice,
    render: (v) => <StatusBadge status={v as string} />,
  },
]

function getApprovalThreshold(amount: number): string {
  if (amount > 50_000_000) return "Purchasing + Finance + Director"
  if (amount > 10_000_000) return "Purchasing + Finance Manager"
  return "Purchasing Manager"
}

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null)

  const filtered = useMemo(() => {
    return vendorInvoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (vendorFilter !== "all" && inv.vendorName !== vendorFilter) return false
      return true
    })
  }, [statusFilter, vendorFilter])

  const totalReceived = vendorInvoices.filter((i) => i.status === "received").length
  const totalVerified = vendorInvoices.filter((i) => i.status === "verified").length
  const totalApproved = vendorInvoices.filter((i) => i.status === "approved").length
  const totalDisputed = vendorInvoices.filter((i) => i.status === "disputed").length

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Invoice Management"
        description="Track, verify, and approve vendor invoices through the payment pipeline"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Received (Pending)" value={String(totalReceived)} icon={FileText} iconColor="text-muted-foreground" />
        <StatCard title="Verified" value={String(totalVerified)} icon={ClipboardCheck} iconColor="text-info" />
        <StatCard title="Approved" value={String(totalApproved)} icon={CheckCircle2} iconColor="text-success" />
        <StatCard title="Disputed" value={String(totalDisputed)} icon={AlertTriangle} iconColor="text-danger" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[280px] h-9 text-sm">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendorNames.map((v) => (
              <SelectItem key={v} value={v}>{v.length > 35 ? v.substring(0, 35) + "..." : v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <DataTable
        columns={columns}
        data={filtered as (VendorInvoice & Record<string, unknown>)[]}
        searchPlaceholder="Search invoices..."
        onRowClick={(row) => setSelectedInvoice(row as unknown as VendorInvoice)}
        exportFilename="vendor-invoices.csv"
        pageSize={10}
      />

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{selectedInvoice.invoiceNumber}</DialogTitle>
                <DialogDescription>{selectedInvoice.vendorName}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Amount</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Status</p>
                    <div className="mt-1"><StatusBadge status={selectedInvoice.status} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Issue Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedInvoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Due Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvoice.items.map((item, i) => (
                      <Badge key={i} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>

                {/* 3-Way Matching Visual */}
                {selectedInvoice.poNumber && (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-3">3-Way Matching</p>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Purchase Order */}
                      <div className="rounded-lg border-2 border-primary/20 bg-primary-50 p-4 text-center">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto mb-2">
                          <Receipt size={20} className="text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-primary mb-1">Purchase Order</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{selectedInvoice.poNumber}</p>
                        <div className="mt-2">
                          <CheckCircle2 size={16} className="text-success mx-auto" />
                        </div>
                      </div>

                      {/* Goods Receipt */}
                      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 text-center relative">
                        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2">
                          <ArrowRight size={16} className="text-text-muted" />
                        </div>
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 mx-auto mb-2">
                          <Package size={20} className="text-emerald-700" />
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Goods Receipt</p>
                        <p className="text-[10px] text-muted-foreground">GR-{selectedInvoice.poNumber?.replace("PO-", "")}</p>
                        <div className="mt-2">
                          <CheckCircle2 size={16} className="text-success mx-auto" />
                        </div>
                      </div>

                      {/* Invoice */}
                      <div className="rounded-lg border-2 border-gold-200 bg-gold-50 p-4 text-center relative">
                        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2">
                          <ArrowRight size={16} className="text-text-muted" />
                        </div>
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 mx-auto mb-2">
                          <FileText size={20} className="text-amber-700" />
                        </div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">Invoice</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{selectedInvoice.invoiceNumber.split("/").slice(-2).join("/")}</p>
                        <div className="mt-2">
                          {selectedInvoice.status === "disputed" ? (
                            <AlertTriangle size={16} className="text-red-500 mx-auto" />
                          ) : (
                            <CheckCircle2 size={16} className="text-success mx-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approval Workflow */}
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Approval Workflow</p>
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Threshold: {getApprovalThreshold(selectedInvoice.amount)}
                      <span className="text-text-muted"> ({formatCurrency(selectedInvoice.amount)})</span>
                    </div>

                    {/* Default: Purchasing Manager always first */}
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        ["approved", "scheduled", "paid"].includes(selectedInvoice.status)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-secondary text-text-muted"
                      }`}>
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Purchasing Manager</p>
                        <p className="text-xs text-text-muted">Initial verification & approval</p>
                      </div>
                      {["approved", "scheduled", "paid"].includes(selectedInvoice.status) ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

                    {selectedInvoice.amount > 10_000_000 && (
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedInvoice.approvalChain?.some((a) => a.role === "Finance Manager" && a.status === "approved")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-secondary text-text-muted"
                        }`}>
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Finance Manager</p>
                          <p className="text-xs text-text-muted">Financial review (&gt;Rp 10jt)</p>
                        </div>
                        {selectedInvoice.approvalChain?.find((a) => a.role === "Finance Manager")?.status === "approved" ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    )}

                    {selectedInvoice.amount > 50_000_000 && (
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedInvoice.approvalChain?.some((a) => a.role === "COO" && a.status === "approved")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-secondary text-text-muted"
                        }`}>
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Director / COO</p>
                          <p className="text-xs text-text-muted">Executive approval (&gt;Rp 50jt)</p>
                        </div>
                        {selectedInvoice.approvalChain?.find((a) => a.role === "COO")?.status === "approved" ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedInvoice.status !== "disputed" && selectedInvoice.status !== "paid" && (
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setSelectedInvoice(null)}>
                    <Flag size={14} />
                    Flag Discrepancy
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
