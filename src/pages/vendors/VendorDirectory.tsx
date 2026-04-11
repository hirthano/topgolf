import { useState, Fragment } from "react"
import { Building2, ChevronDown, ChevronUp } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { vendors, vendorInvoices } from "@/data/mock-vendors"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Vendor, VendorCategory } from "@/types"

const categories = Array.from(new Set(vendors.map((v) => v.category))).sort() as VendorCategory[]

export function VendorDirectory() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  const filtered = vendors.filter((v) => {
    if (categoryFilter !== "all" && v.category !== categoryFilter) return false
    if (statusFilter !== "all" && v.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)
    }
    return true
  })

  const activeCount = vendors.filter((v) => v.status === "active").length
  const totalPaidYTD = vendors.reduce((s, v) => s + v.totalPaidYTD, 0)
  const totalOutstanding = vendors.reduce((s, v) => s + v.outstandingBalance, 0)

  const getVendorPaymentHistory = (vendorId: string) =>
    vendorInvoices
      .filter((inv) => inv.vendorId === vendorId && inv.status === "paid")
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Vendor Directory"
        description="Manage vendor profiles, payment terms, and track outstanding balances"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vendors" value={String(vendors.length)} icon={Building2} iconColor="text-primary" />
        <StatCard title="Active Vendors" value={String(activeCount)} icon={Building2} iconColor="text-success" />
        <StatCard title="Total Paid YTD" value={formatCurrency(totalPaidYTD)} icon={Building2} iconColor="text-info" />
        <StatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={Building2} iconColor="text-warning" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendor Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Terms</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Paid YTD</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor) => {
                  const isExpanded = expandedVendor === vendor.id
                  const paymentHistory = isExpanded ? getVendorPaymentHistory(vendor.id) : []

                  return (
                    <Fragment key={vendor.id}>
                      <tr
                        className="border-b border-border-light cursor-pointer hover:bg-background transition-colors"
                        onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                      >
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-text-muted" />
                          ) : (
                            <ChevronDown size={16} className="text-text-muted" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{vendor.name}</p>
                          <p className="text-xs text-text-muted">{vendor.contactPerson}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{vendor.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{vendor.paymentTerms}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(vendor.totalPaidYTD)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={vendor.outstandingBalance > 0 ? "font-medium text-amber-600" : "text-text-muted"}>
                            {formatCurrency(vendor.outstandingBalance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={vendor.status} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-background border-b border-border">
                            <div className="px-6 py-5 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Contact Info</p>
                                  <p className="text-sm text-foreground">{vendor.contactPerson}</p>
                                  <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                                  <p className="text-sm text-muted-foreground">{vendor.email}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Bank Info</p>
                                  <p className="text-sm text-foreground">{vendor.bankName}</p>
                                  <p className="text-sm font-mono text-muted-foreground">****{vendor.bankAccount.slice(-4)}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Payment Terms</p>
                                  <p className="text-sm font-medium text-foreground">{vendor.paymentTerms}</p>
                                  <p className="text-sm text-muted-foreground">Category: {vendor.category}</p>
                                </div>
                              </div>

                              {paymentHistory.length > 0 && (
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Recent Payment History</p>
                                  <div className="space-y-2">
                                    {paymentHistory.map((inv) => (
                                      <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border-light bg-card px-4 py-2.5 text-sm">
                                        <div>
                                          <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                                          <p className="text-xs text-text-muted">{inv.items.join(", ")}</p>
                                        </div>
                                        <div className="text-right">
                                          <CurrencyDisplay amount={inv.amount} size="sm" />
                                          <p className="text-xs text-text-muted">{formatDate(inv.issueDate)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
        </CardContent>
      </Card>
    </div>
  )
}
