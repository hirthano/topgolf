import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft, Upload, Receipt, Calculator, Users, CheckCircle2, Info,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import type { ReimbursementCategory } from "@/types"

const categories: ReimbursementCategory[] = [
  "Dinner/Meals",
  "Parking",
  "Transportation",
  "Office Supplies",
  "Client Entertainment",
  "Fuel",
  "Toll",
  "Other",
]

const branches = [
  "Topgolf Bellezza",
  "Topgolf SCBD Premier",
  "Topgolf Kelapa Gading",
  "Topgolf Pluit Village",
  "Topgolf Cilandak",
  "Topgolf Pondok Indah",
  "Topgolf PIK Avenue",
  "Topgolf Mall of Indonesia",
  "Topgolf Surabaya",
  "Topgolf Hosel Yogyakarta",
  "Topgolf Plaza Indonesia",
]

interface FormState {
  category: string
  dateExpense: string
  amount: string
  description: string
  branch: string
}

export function NewReimbursement() {
  const [form, setForm] = useState<FormState>({
    category: "",
    dateExpense: "",
    amount: "",
    description: "",
    branch: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const amountNum = useMemo(() => {
    const n = parseFloat(form.amount.replace(/\./g, "").replace(",", "."))
    return isNaN(n) ? 0 : n
  }, [form.amount])

  const taxComponent = useMemo(() => Math.round(amountNum * 0.1), [amountNum])
  const totalReimbursable = useMemo(() => amountNum + taxComponent, [amountNum, taxComponent])

  // Approval chain preview
  const approvalPreview = useMemo(() => {
    const steps: { role: string; name: string }[] = []
    steps.push({ role: "Direct Manager", name: "Rina Wijaya" })
    if (amountNum > 500_000) {
      steps.push({ role: "Finance Manager", name: "Dewi Kusuma" })
    }
    if (amountNum > 2_000_000) {
      steps.push({ role: "COO", name: "Budi Santoso" })
    }
    return steps
  }, [amountNum])

  const isFormValid = form.category && form.dateExpense && amountNum > 0 && form.description && form.branch

  const handleAmountChange = (val: string) => {
    // Allow only digits and dots for thousand separator display
    const clean = val.replace(/[^\d]/g, "")
    setForm((prev) => ({ ...prev, amount: clean }))
  }

  const formattedAmount = useMemo(() => {
    if (!form.amount) return ""
    return Number(form.amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }, [form.amount])

  const handleSubmit = () => {
    if (!isFormValid) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-5 animate-fade-in">
        <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Reimbursement Submitted!</h2>
          <p className="text-muted-foreground">
            Your reimbursement request for {formatCurrency(amountNum)} has been submitted successfully.
            It will be reviewed by {approvalPreview.map((s) => s.name).join(" > ")}.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/reimbursements">
              <Button variant="outline">View My Reimbursements</Button>
            </Link>
            <Button onClick={() => {
              setSubmitted(false)
              setForm({ category: "", dateExpense: "", amount: "", description: "", branch: "" })
            }}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Submit Reimbursement"
        description="Fill in the details below to submit a new reimbursement request"
        actions={
          <Link to="/reimbursements">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Expense Category</label>
                <Select value={form.category} onValueChange={(val) => setForm((p) => ({ ...p, category: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Expense */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Date of Expense</label>
                <Input
                  type="date"
                  value={form.dateExpense}
                  onChange={(e) => setForm((p) => ({ ...p, dateExpense: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Amount (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formattedAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
                {amountNum > 0 && (
                  <p className="text-xs text-text-muted">{formatCurrency(amountNum)}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description / Notes</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the business purpose of this expense..."
                  rows={3}
                  className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ring-offset-surface placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 resize-none"
                />
              </div>

              {/* Receipt Upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Receipt Upload</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors cursor-pointer ${
                    dragOver
                      ? "border-primary bg-primary-50"
                      : "border-border hover:border-primary/40 hover:bg-secondary"
                  }`}
                >
                  <Upload size={24} className="text-text-muted" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop receipt here, or <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-xs text-text-muted">PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Branch / Cost Center</label>
                <Select value={form.branch} onValueChange={(val) => setForm((p) => ({ ...p, branch: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tax Calculation */}
          {amountNum > 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={18} className="text-primary" />
                  Tax & Total Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base Amount</span>
                    <span className="font-medium text-foreground">{formatCurrency(amountNum)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PPN (10%)</span>
                    <span className="font-medium text-foreground">{formatCurrency(taxComponent)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total Reimbursable</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(totalReimbursable)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Approval Preview + Submit */}
        <div className="space-y-6">
          {/* Approval Chain Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Approval Chain Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {amountNum > 0 ? (
                <div className="space-y-4">
                  {/* Threshold Info */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 border border-primary-100">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-primary-dark">
                      {amountNum <= 500_000 && "Under Rp 500.000: Direct Manager approval only"}
                      {amountNum > 500_000 && amountNum <= 2_000_000 && "Rp 500.000 - Rp 2.000.000: Manager + Finance Manager approval"}
                      {amountNum > 2_000_000 && "Over Rp 2.000.000: Manager + Finance Manager + COO approval"}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-0">
                    {approvalPreview.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary border-2 border-border text-text-muted text-xs font-bold">
                            {i + 1}
                          </div>
                          {i < approvalPreview.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[16px] bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-foreground">{step.name}</p>
                          <p className="text-xs text-text-muted">{step.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Enter an amount to see the approval chain</p>
              )}
            </CardContent>
          </Card>

          {/* Thresholds Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approval Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Under Rp 500.000 - Manager only</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Rp 500K - 2M - Manager + Dept Head</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Over Rp 2M - Manager + Dept Head + Finance</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!isFormValid}
            onClick={handleSubmit}
          >
            <CheckCircle2 size={18} />
            Submit Reimbursement
          </Button>
        </div>
      </div>
    </div>
  )
}
