import { useState, useMemo } from "react"
import {
  CreditCard, Calendar, CheckCircle2, Clock, Layers,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { vendors, vendorInvoices } from "@/data/mock-vendors"
import { formatCurrency, formatCurrencyShort, formatDate } from "@/lib/utils"
import type { VendorInvoice } from "@/types"

const TODAY = new Date("2026-04-11")

export function VendorPayments() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)

  // Payment queue: approved invoices ready for payment
  const paymentQueue = useMemo(
    () => vendorInvoices.filter((inv) => inv.status === "approved" || inv.status === "scheduled"),
    [],
  )

  const approvedInvoices = paymentQueue.filter((i) => i.status === "approved")
  const scheduledInvoices = paymentQueue.filter((i) => i.status === "scheduled")

  const totalApproved = approvedInvoices.reduce((s, i) => s + i.amount, 0)
  const totalScheduled = scheduledInvoices.reduce((s, i) => s + i.amount, 0)
  const totalQueue = totalApproved + totalScheduled

  // Batch grouping by vendor
  const batchGroups = useMemo(() => {
    const map = new Map<string, { vendorId: string; vendorName: string; invoices: VendorInvoice[]; total: number }>()
    for (const inv of paymentQueue) {
      const existing = map.get(inv.vendorId)
      if (existing) {
        existing.invoices.push(inv)
        existing.total += inv.amount
      } else {
        map.set(inv.vendorId, {
          vendorId: inv.vendorId,
          vendorName: inv.vendorName,
          invoices: [inv],
          total: inv.amount,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [paymentQueue])

  // Calendar: scheduled payments for next 30 days
  const calendarData = useMemo(() => {
    const weeks: { date: Date; dayNum: number; month: string; invoices: VendorInvoice[]; isToday: boolean; isPast: boolean }[][] = []
    let currentWeek: typeof weeks[0] = []

    for (let i = 0; i < 28; i++) {
      const d = new Date(TODAY)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const invoices = scheduledInvoices.filter((inv) => inv.dueDate === dateStr)

      currentWeek.push({
        date: d,
        dayNum: d.getDate(),
        month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()],
        invoices,
        isToday: i === 0,
        isPast: false,
      })

      if (currentWeek.length === 7 || i === 27) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    return weeks
  }, [scheduledInvoices])

  // Recently paid
  const recentlyPaid = useMemo(
    () => vendorInvoices
      .filter((inv) => inv.status === "paid" && inv.issueDate >= "2026-03-01")
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .slice(0, 10),
    [],
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Payment Scheduling"
        description="Manage payment queue, batch payments, and track scheduled disbursements"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Payment Queue"
          value={formatCurrencyShort(totalQueue)}
          icon={CreditCard}
          iconColor="text-primary"
        />
        <StatCard
          title="Approved (Ready)"
          value={`${approvedInvoices.length} invoices`}
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <StatCard
          title="Scheduled"
          value={`${scheduledInvoices.length} invoices`}
          icon={Calendar}
          iconColor="text-info"
        />
        <StatCard
          title="Batch Groups"
          value={`${batchGroups.length} vendors`}
          icon={Layers}
          iconColor="text-gold"
        />
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Payment Queue</TabsTrigger>
          <TabsTrigger value="batch">Batch Payments</TabsTrigger>
          <TabsTrigger value="calendar">Schedule Calendar</TabsTrigger>
          <TabsTrigger value="confirmed">Recently Paid</TabsTrigger>
        </TabsList>

        {/* Payment Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Approved Invoices Ready for Payment
              </CardTitle>
              <CardDescription>{approvedInvoices.length} invoices totaling {formatCurrency(totalApproved)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentQueue.map((inv) => {
                      const isOverdue = new Date(inv.dueDate) < TODAY
                      return (
                        <tr key={inv.id} className="border-b border-border-light last:border-0 hover:bg-background transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.invoiceNumber.split("/").slice(-3).join("/")}</td>
                          <td className="px-4 py-3">
                            <p className="text-foreground font-medium">{inv.vendorName.length > 30 ? inv.vendorName.substring(0, 30) + "..." : inv.vendorName}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                              {formatDate(inv.dueDate)}
                            </span>
                            {isOverdue && <Badge variant="danger" className="ml-2 text-[10px]">Overdue</Badge>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{inv.paymentTerms}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="outline" size="sm">Schedule</Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Payments Tab */}
        <TabsContent value="batch">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  Batch Payment Groups
                </CardTitle>
                <CardDescription>Invoices grouped by vendor for batch processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchGroups.map((group) => (
                    <div
                      key={group.vendorId}
                      className={`rounded-lg border p-4 cursor-pointer transition-all ${
                        selectedBatch === group.vendorId
                          ? "border-primary bg-primary-50 shadow-sm"
                          : "border-border hover:border-primary/30 hover:shadow-sm"
                      }`}
                      onClick={() => setSelectedBatch(selectedBatch === group.vendorId ? null : group.vendorId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{group.vendorName}</p>
                          <p className="text-xs text-text-muted">{group.invoices.length} invoice{group.invoices.length > 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{formatCurrency(group.total)}</p>
                          <Button variant="outline" size="sm" className="mt-1">Process Batch</Button>
                        </div>
                      </div>

                      {selectedBatch === group.vendorId && (
                        <div className="mt-4 space-y-2 animate-fade-in border-t border-border pt-3">
                          {group.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between text-sm rounded-lg bg-card px-3 py-2 border border-border-light">
                              <div>
                                <p className="font-mono text-xs text-foreground">{inv.invoiceNumber.split("/").slice(-3).join("/")}</p>
                                <p className="text-xs text-text-muted">{inv.items.slice(0, 2).join(", ")}</p>
                              </div>
                              <div className="text-right">
                                <CurrencyDisplay amount={inv.amount} size="sm" />
                                <div className="mt-0.5"><StatusBadge status={inv.status} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Scheduled Payment Calendar
              </CardTitle>
              <CardDescription>Next 4 weeks of scheduled payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-text-muted py-1">{d}</div>
                  ))}
                </div>

                {calendarData.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-2">
                    {week.map((day, di) => {
                      const totalAmount = day.invoices.reduce((s, inv) => s + inv.amount, 0)
                      return (
                        <div
                          key={di}
                          className={`rounded-lg border p-2 min-h-[80px] transition-all ${
                            day.isToday
                              ? "border-primary bg-primary-50 ring-2 ring-primary/20"
                              : day.invoices.length > 0
                                ? "border-amber-200 bg-amber-50"
                                : "border-border-light"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                              {day.dayNum} {day.month}
                            </span>
                          </div>
                          {day.invoices.length > 0 && (
                            <div className="mt-1">
                              <p className="text-[10px] font-semibold text-amber-700">{day.invoices.length} payment{day.invoices.length > 1 ? "s" : ""}</p>
                              <p className="text-[10px] text-amber-600">{formatCurrencyShort(totalAmount)}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recently Paid Tab */}
        <TabsContent value="confirmed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                Payment Confirmations
              </CardTitle>
              <CardDescription>Recently completed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyPaid.map((inv) => (
                      <tr key={inv.id} className="border-b border-border-light last:border-0 hover:bg-background transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber.split("/").slice(-3).join("/")}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{inv.vendorName.length > 35 ? inv.vendorName.substring(0, 35) + "..." : inv.vendorName}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
