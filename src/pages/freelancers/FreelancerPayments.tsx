import { useState, useMemo } from "react"
import {
  Calculator, Receipt, ArrowRight, CheckCircle2, Info,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { freelancers, freelancerPayments } from "@/data/mock-freelancers"
import { calculatePPh21 } from "@/lib/tax-calculator"
import type { TaxCalculation } from "@/lib/tax-calculator"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { FreelancerPayment } from "@/types"
import type { ColumnDef } from "@/components/shared/DataTable"

const COLORS = {
  primary: "#1B4332",
  gold: "#C9A84C",
  lightGreen: "#2D6A4F",
  emerald: "#46AF83",
}

const paymentColumns: ColumnDef<FreelancerPayment & Record<string, unknown>>[] = [
  {
    header: "Date",
    accessor: "paymentDate" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => formatDate(v as string),
  },
  {
    header: "Freelancer",
    accessor: "freelancerName" as keyof FreelancerPayment,
    sortable: true,
  },
  {
    header: "Description",
    accessor: "description" as keyof FreelancerPayment,
  },
  {
    header: "Service Fee",
    accessor: "serviceFee" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => <CurrencyDisplay amount={v as number} size="sm" />,
    className: "text-right",
  },
  {
    header: "PPh 21",
    accessor: "pph21" as keyof FreelancerPayment,
    render: (v) => <span className="text-red-600 text-sm">{formatCurrency(v as number)}</span>,
    className: "text-right",
  },
  {
    header: "To Freelancer",
    accessor: "amountToFreelancer" as keyof FreelancerPayment,
    render: (v) => <CurrencyDisplay amount={v as number} size="sm" />,
    className: "text-right",
  },
  {
    header: "Company Cost",
    accessor: "totalCompanyCost" as keyof FreelancerPayment,
    sortable: true,
    render: (v) => <span className="font-semibold text-sm">{formatCurrency(v as number)}</span>,
    className: "text-right",
  },
  {
    header: "Status",
    accessor: "status" as keyof FreelancerPayment,
    render: (v) => <StatusBadge status={v as string} />,
  },
]

export function FreelancerPayments() {
  const [selectedFreelancerId, setSelectedFreelancerId] = useState("")
  const [serviceDesc, setServiceDesc] = useState("")
  const [serviceDate, setServiceDate] = useState("")
  const [baseAmount, setBaseAmount] = useState("")
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null)

  const selectedFreelancer = useMemo(
    () => freelancers.find((f) => f.id === selectedFreelancerId),
    [selectedFreelancerId],
  )

  const handleCalculate = () => {
    if (!selectedFreelancer || !baseAmount) return
    const amount = parseFloat(baseAmount.replace(/\./g, "").replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0) return
    const result = calculatePPh21(
      amount,
      selectedFreelancer.hasNPWP,
      selectedFreelancer.taxArrangement === "gross_up",
    )
    setCalculation(result)
  }

  const handleReset = () => {
    setSelectedFreelancerId("")
    setServiceDesc("")
    setServiceDate("")
    setBaseAmount("")
    setCalculation(null)
  }

  const rateLabel = selectedFreelancer
    ? selectedFreelancer.hasNPWP ? "2.5%" : "3% (no NPWP, +20%)"
    : ""

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Freelancer Payment Calculator"
        description="Calculate PPh 21 withholding and process freelancer payments"
      />

      {/* Payment Calculator - Star Feature */}
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/10">
              <Calculator size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">PPh 21 Payment Calculator</h2>
              <p className="text-sm text-white/70">Calculate tax withholding for freelancer payments</p>
            </div>
          </div>
        </div>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Freelancer</label>
                <Select value={selectedFreelancerId} onValueChange={(v) => { setSelectedFreelancerId(v); setCalculation(null); }}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Choose a freelancer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {freelancers.filter((f) => f.status === "active").map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} - {f.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFreelancer && (
                <div className="rounded-lg border border-border bg-background p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={selectedFreelancer.hasNPWP ? "success" : "warning"}>
                      {selectedFreelancer.hasNPWP ? "NPWP" : "No NPWP"}
                    </Badge>
                    <Badge variant={selectedFreelancer.taxArrangement === "gross_up" ? "default" : "secondary"}>
                      {selectedFreelancer.taxArrangement === "gross_up" ? "Gross-Up" : "Gross"}
                    </Badge>
                    <span className="text-xs text-text-muted">PPh 21 Rate: {rateLabel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedFreelancer.specialty} | {selectedFreelancer.bankName} ****{selectedFreelancer.bankAccount.slice(-4)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Service Description</label>
                <Input
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="e.g. 10 private golf lesson sessions"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Service Date</label>
                  <Input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Base Amount (Rp)</label>
                  <Input
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    placeholder="e.g. 10000000"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCalculate} className="gap-2 flex-1" disabled={!selectedFreelancer || !baseAmount}>
                  <Calculator size={16} />
                  Calculate Tax
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>

            {/* Calculation Results */}
            <div>
              {calculation ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-success" />
                    <p className="text-sm font-semibold text-foreground">Tax Calculation Breakdown</p>
                  </div>

                  <div className="rounded-lg border-2 border-primary/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-border-light bg-background">
                          <td className="px-5 py-3.5 text-muted-foreground font-medium">Service Fee (Agreed)</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                            {formatCurrency(calculation.serviceFee)}
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-5 py-3.5 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              DPP (50% of Gross)
                              <Info size={13} className="text-text-muted" />
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-foreground">
                            {formatCurrency(calculation.dpp)}
                          </td>
                        </tr>
                        <tr className="border-b border-border-light bg-red-50">
                          <td className="px-5 py-3.5 text-red-700 font-medium">
                            PPh 21 ({(calculation.pphRate * 100).toFixed(1)}%)
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-red-700">
                            {formatCurrency(calculation.pph21)}
                          </td>
                        </tr>
                        <tr className="border-b border-border-light bg-emerald-50">
                          <td className="px-5 py-3.5 text-emerald-700 font-medium">
                            <span className="flex items-center gap-1.5">
                              <ArrowRight size={14} />
                              Amount to Freelancer
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-emerald-700 text-base">
                            {formatCurrency(calculation.amountToFreelancer)}
                          </td>
                        </tr>
                        {calculation.taxBorneByCompany > 0 && (
                          <tr className="border-b border-border-light bg-amber-50">
                            <td className="px-5 py-3.5 text-amber-700 font-medium">
                              Tax Borne by Company
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-amber-700">
                              {formatCurrency(calculation.taxBorneByCompany)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-[#1B4332]">
                          <td className="px-5 py-4 text-white font-semibold text-base">
                            Total Company Cost
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-[#C9A84C] text-lg">
                            {formatCurrency(calculation.totalCompanyCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {selectedFreelancer && (
                    <div className="rounded-lg bg-background border border-border p-4 text-xs text-muted-foreground space-y-1">
                      <p><span className="font-medium">Method:</span> {selectedFreelancer.taxArrangement === "gross_up" ? "Gross-Up (company absorbs tax)" : "Gross (tax deducted from payment)"}</p>
                      <p><span className="font-medium">NPWP:</span> {selectedFreelancer.hasNPWP ? `Yes (${selectedFreelancer.npwpNumber})` : "No (20% surcharge applied)"}</p>
                      <p><span className="font-medium">Formula:</span> DPP = 50% x Service Fee; PPh 21 = {(calculation.pphRate * 100).toFixed(1)}% x DPP</p>
                    </div>
                  )}

                  <Button className="w-full gap-2" variant="gold">
                    <Receipt size={16} />
                    Process Payment
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-text-muted">
                  <Calculator size={48} strokeWidth={1} className="mb-4 text-border" />
                  <p className="text-sm font-medium mb-1">No Calculation Yet</p>
                  <p className="text-xs">Select a freelancer, enter the service fee amount, and click "Calculate Tax" to see the breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            Payment History
          </CardTitle>
          <CardDescription>All freelancer payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={paymentColumns}
            data={freelancerPayments as (FreelancerPayment & Record<string, unknown>)[]}
            searchPlaceholder="Search payments..."
            exportFilename="freelancer-payments.csv"
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
