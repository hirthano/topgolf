import { useState, useMemo } from "react"
import {
  ClipboardCheck, CheckCircle2, XCircle, RotateCcw, MessageSquare,
  FileImage, Info, CheckSquare, Square,
} from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ApprovalChain } from "@/components/shared/ApprovalChain"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { reimbursements } from "@/data/mock-reimbursements"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Reimbursement } from "@/types"

// Simulate manager view: show pending requests where the current approver is Rina Wijaya or Budi Santoso
const MANAGER_NAMES = ["Rina Wijaya", "Budi Santoso", "Dewi Kusuma"]

export function ApprovalsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "reject" | "revision"
    reimbursementId: string
  } | null>(null)
  const [comment, setComment] = useState("")
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set())

  const pendingRequests = useMemo(
    () =>
      reimbursements.filter((r) => {
        if (processedIds.has(r.id)) return false
        if (r.status !== "pending_approval") return false
        const currentApprover = r.approvalChain[r.currentStep]
        return currentApprover && MANAGER_NAMES.includes(currentApprover.approver)
      }),
    [processedIds],
  )

  const batchEligible = useMemo(
    () => pendingRequests.filter((r) => r.amount < 500_000),
    [pendingRequests],
  )

  const totalPending = pendingRequests.reduce((s, r) => s + r.amount, 0)
  const selectedRequest = pendingRequests.find((r) => r.id === selectedId) || pendingRequests[0]

  const handleAction = (type: "approve" | "reject" | "revision", id: string) => {
    setActionDialog({ type, reimbursementId: id })
    setComment("")
  }

  const confirmAction = () => {
    if (!actionDialog) return
    setProcessedIds((prev) => new Set([...prev, actionDialog.reimbursementId]))
    setActionDialog(null)
    setComment("")
    if (selectedId === actionDialog.reimbursementId) {
      setSelectedId(null)
    }
  }

  const handleBatchApprove = () => {
    setProcessedIds((prev) => new Set([...prev, ...batchSelected]))
    setBatchSelected(new Set())
  }

  const toggleBatchItem = (id: string) => {
    setBatchSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllBatch = () => {
    if (batchSelected.size === batchEligible.length) {
      setBatchSelected(new Set())
    } else {
      setBatchSelected(new Set(batchEligible.map((r) => r.id)))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Reimbursement Approvals"
        description="Review and approve pending reimbursement requests from your team"
        actions={
          batchSelected.size > 0 ? (
            <Button className="gap-2" onClick={handleBatchApprove}>
              <CheckCircle2 size={16} />
              Batch Approve ({batchSelected.size})
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Requests"
          value={String(pendingRequests.length)}
          icon={ClipboardCheck}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Pending Amount"
          value={formatCurrency(totalPending)}
          icon={ClipboardCheck}
          iconColor="text-primary"
        />
        <StatCard
          title="Batch Eligible (< 500K)"
          value={String(batchEligible.length)}
          icon={CheckSquare}
          iconColor="text-info"
        />
      </div>

      {/* Approval Thresholds Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Approval Thresholds</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Under Rp 500.000: Manager only
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Rp 500K - 2M: Manager + Finance
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Over Rp 2M: Manager + Finance + COO
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Request List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Batch header */}
          {batchEligible.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <button onClick={toggleAllBatch} className="hover:text-foreground transition-colors">
                {batchSelected.size === batchEligible.length ? (
                  <CheckSquare size={16} className="text-primary" />
                ) : (
                  <Square size={16} />
                )}
              </button>
              <span>Select all under Rp 500.000 for batch approval</span>
            </div>
          )}

          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-muted-foreground">All caught up! No pending approvals.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((r) => (
              <Card
                key={r.id}
                className={`cursor-pointer transition-all card-hover ${
                  selectedId === r.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedId(r.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Batch checkbox */}
                    {r.amount < 500_000 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBatchItem(r.id)
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        {batchSelected.has(r.id) ? (
                          <CheckSquare size={18} className="text-primary" />
                        ) : (
                          <Square size={18} className="text-text-muted" />
                        )}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{r.employeeName}</span>
                        <span className="text-sm font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={r.category.toLowerCase().replace(/\//g, "_")} />
                        <span className="text-xs text-text-muted">{r.category}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>Submitted: {formatDate(r.dateSubmitted)}</span>
                        <span>{r.department}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRequest ? (
            <>
              {/* Request Detail */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Request Detail - {selectedRequest.id}</CardTitle>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-muted block text-xs">Employee</span>
                      <span className="font-medium text-foreground">{selectedRequest.employeeName}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Department</span>
                      <span className="font-medium text-foreground">{selectedRequest.department}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Category</span>
                      <span className="font-medium text-foreground">{selectedRequest.category}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Branch</span>
                      <span className="font-medium text-foreground">{selectedRequest.branch}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Expense Date</span>
                      <span className="font-medium text-foreground">{formatDate(selectedRequest.dateExpense)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Amount</span>
                      <span className="font-bold text-lg text-primary">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs mb-1">Description</span>
                    <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{selectedRequest.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileImage size={16} className="text-primary" />
                    Receipt Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48 rounded-lg bg-secondary border border-border-light">
                    <div className="text-center space-y-2">
                      <FileImage size={36} className="mx-auto text-text-muted" />
                      <div className="text-xs text-text-muted space-y-0.5">
                        <p className="font-mono">RECEIPT</p>
                        <p>{selectedRequest.category}</p>
                        <p>{formatCurrency(selectedRequest.amount)}</p>
                        <p>{formatDate(selectedRequest.dateExpense)}</p>
                        <p className="text-[10px] mt-1">{selectedRequest.receiptUrl || "No receipt attached"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Chain */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Approval Chain</CardTitle>
                </CardHeader>
                <CardContent>
                  <ApprovalChain
                    steps={selectedRequest.approvalChain}
                    currentStep={selectedRequest.currentStep}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleAction("approve", selectedRequest.id)}
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => handleAction("reject", selectedRequest.id)}
                    >
                      <XCircle size={16} />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleAction("revision", selectedRequest.id)}
                    >
                      <RotateCcw size={16} />
                      Request Revision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardCheck size={36} className="mx-auto text-text-muted mb-3" />
                <p className="text-muted-foreground">Select a request to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" && "Approve Reimbursement"}
              {actionDialog?.type === "reject" && "Reject Reimbursement"}
              {actionDialog?.type === "revision" && "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve" && "Add an optional comment and confirm approval."}
              {actionDialog?.type === "reject" && "Please provide a reason for rejection."}
              {actionDialog?.type === "revision" && "Describe what needs to be revised."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              {actionDialog?.type === "approve" ? "Comment (optional)" : "Comment"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                actionDialog?.type === "approve"
                  ? "Optional approval note..."
                  : actionDialog?.type === "reject"
                    ? "Reason for rejection..."
                    : "What needs to be revised..."
              }
              rows={3}
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ring-offset-surface placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={actionDialog?.type === "reject" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={actionDialog?.type !== "approve" && !comment.trim()}
              className="gap-2"
            >
              <MessageSquare size={14} />
              {actionDialog?.type === "approve" && "Confirm Approval"}
              {actionDialog?.type === "reject" && "Confirm Rejection"}
              {actionDialog?.type === "revision" && "Request Revision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
