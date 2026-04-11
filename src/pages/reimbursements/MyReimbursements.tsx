import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Receipt, Clock, CheckCircle2, XCircle, Banknote, Plus, ChevronDown, ChevronRight,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ApprovalChain } from "@/components/shared/ApprovalChain"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { reimbursements } from "@/data/mock-reimbursements"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@/components/shared/DataTable"
import type { Reimbursement, ReimbursementStatus } from "@/types"

type RowData = Reimbursement & Record<string, unknown>

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "revision", label: "Revision" },
]

// Simulate "current user" - use Fajar Hidayat (EMP005) as the employee view
const CURRENT_EMPLOYEE_ID = "EMP005"

export function MyReimbursements() {
  const [activeTab, setActiveTab] = useState("all")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const myReimbursements = useMemo(
    () => reimbursements.filter((r) => r.employeeId === CURRENT_EMPLOYEE_ID),
    [],
  )

  const filtered = useMemo(() => {
    if (activeTab === "all") return myReimbursements
    return myReimbursements.filter((r) => r.status === activeTab)
  }, [myReimbursements, activeTab])

  // Stats
  const pendingCount = myReimbursements.filter((r) => r.status === "pending_approval").length
  const pendingAmount = myReimbursements
    .filter((r) => r.status === "pending_approval")
    .reduce((s, r) => s + r.amount, 0)

  const approvedCount = myReimbursements.filter((r) => r.status === "approved").length
  const approvedAmount = myReimbursements
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.amount, 0)

  const rejectedCount = myReimbursements.filter((r) => r.status === "rejected").length
  const rejectedAmount = myReimbursements
    .filter((r) => r.status === "rejected")
    .reduce((s, r) => s + r.amount, 0)

  const paidCount = myReimbursements.filter((r) => r.status === "paid").length
  const paidAmount = myReimbursements
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.amount, 0)

  const columns: ColumnDef<RowData>[] = [
    {
      header: "",
      accessor: () => null,
      render: (_val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpandedRow(expandedRow === row.id ? null : row.id)
          }}
          className="text-text-muted hover:text-foreground transition-colors"
        >
          {expandedRow === row.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ),
      className: "w-10",
    },
    {
      header: "Date",
      accessor: "dateSubmitted" as keyof RowData,
      render: (val) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(String(val))}</span>,
      sortable: true,
    },
    {
      header: "Category",
      accessor: "category" as keyof RowData,
      render: (val) => (
        <span className="inline-flex items-center gap-1.5">
          <Receipt size={14} className="text-text-muted" />
          {String(val)}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Amount",
      accessor: "amount" as keyof RowData,
      render: (val) => <span className="font-semibold text-foreground">{formatCurrency(Number(val))}</span>,
      sortable: true,
      className: "text-right",
    },
    {
      header: "Description",
      accessor: "description" as keyof RowData,
      render: (val) => <span className="text-muted-foreground text-sm truncate max-w-[200px] block">{String(val)}</span>,
    },
    {
      header: "Status",
      accessor: "status" as keyof RowData,
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      header: "Current Approver",
      accessor: (row) => {
        const r = row as unknown as Reimbursement
        const currentApprover = r.approvalChain[r.currentStep]
        return currentApprover ? currentApprover.approver : "-"
      },
      render: (val) => <span className="text-muted-foreground text-sm">{String(val)}</span>,
    },
    {
      header: "Expected Payment",
      accessor: (row) => {
        const r = row as unknown as Reimbursement
        if (r.status === "paid") return "Paid"
        if (r.status === "rejected") return "-"
        // Estimate: 7 days from last approval or submission
        const base = r.approvalChain.find((s) => s.status === "approved")?.date || r.dateSubmitted
        const d = new Date(base)
        d.setDate(d.getDate() + 7)
        return formatDate(d)
      },
      render: (val) => <span className="text-muted-foreground text-sm whitespace-nowrap">{String(val)}</span>,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="My Reimbursements"
        description="Track your submitted reimbursement requests and their approval status"
        actions={
          <Link to="/reimbursements/submit">
            <Button className="gap-2">
              <Plus size={16} />
              New Reimbursement
            </Button>
          </Link>
        }
      />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approval"
          value={`${pendingCount} (${formatCurrency(pendingAmount)})`}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Approved"
          value={`${approvedCount} (${formatCurrency(approvedAmount)})`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Rejected"
          value={`${rejectedCount} (${formatCurrency(rejectedAmount)})`}
          icon={XCircle}
          iconColor="text-danger"
        />
        <StatCard
          title="Paid"
          value={`${paidCount} (${formatCurrency(paidAmount)})`}
          icon={Banknote}
          iconColor="text-primary"
        />
      </div>

      {/* Tabs + Table */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {statusTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <DataTable<RowData>
                  columns={columns}
                  data={filtered as unknown as RowData[]}
                  searchPlaceholder="Search reimbursements..."
                  exportFilename="my-reimbursements.csv"
                  onRowClick={(row) =>
                    setExpandedRow(expandedRow === row.id ? null : (row.id as string))
                  }
                />

                {/* Expanded Approval Chain */}
                {expandedRow && (
                  <div className="mt-4 border border-border rounded-lg p-4 bg-background animate-fade-in">
                    {(() => {
                      const r = myReimbursements.find((r) => r.id === expandedRow)
                      if (!r) return null
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                              Approval Chain for {r.id}
                            </h3>
                            <StatusBadge status={r.status} />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {r.category}</span>
                            <span>Amount: {formatCurrency(r.amount)}</span>
                            <span>Submitted: {formatDate(r.dateSubmitted)}</span>
                          </div>
                          <ApprovalChain
                            steps={r.approvalChain}
                            currentStep={r.currentStep}
                          />
                        </div>
                      )
                    })()}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
