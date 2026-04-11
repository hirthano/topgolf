import { useState } from "react"
import { Users, UserPlus, Shield, ShieldOff, Search } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { freelancers, freelancerPayments } from "@/data/mock-freelancers"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Freelancer } from "@/types"
import type { ColumnDef } from "@/components/shared/DataTable"

const roles = Array.from(new Set(freelancers.map((f) => f.role))).sort()

const columns: ColumnDef<Freelancer & Record<string, unknown>>[] = [
  {
    header: "Name",
    accessor: "name" as keyof Freelancer,
    sortable: true,
    render: (_v, row) => (
      <div>
        <p className="font-medium text-foreground">{row.name as string}</p>
        <p className="text-xs text-text-muted">{row.specialty as string}</p>
      </div>
    ),
  },
  {
    header: "Role",
    accessor: "role" as keyof Freelancer,
    sortable: true,
  },
  {
    header: "Tax Status",
    accessor: "hasNPWP" as keyof Freelancer,
    render: (v) => (
      <Badge variant={v ? "success" : "warning"}>
        {v ? "NPWP" : "No NPWP"}
      </Badge>
    ),
  },
  {
    header: "Arrangement",
    accessor: "taxArrangement" as keyof Freelancer,
    render: (v) => (
      <Badge variant={v === "gross_up" ? "default" : "secondary"}>
        {v === "gross_up" ? "Gross-Up" : "Gross"}
      </Badge>
    ),
  },
  {
    header: "Total Paid YTD",
    accessor: "totalPaidYTD" as keyof Freelancer,
    sortable: true,
    render: (v) => <CurrencyDisplay amount={v as number} size="sm" />,
    className: "text-right",
  },
  {
    header: "Last Payment",
    accessor: "lastPaymentDate" as keyof Freelancer,
    sortable: true,
    render: (v) => (v ? formatDate(v as string) : "-"),
  },
  {
    header: "Status",
    accessor: "status" as keyof Freelancer,
    render: (v) => <StatusBadge status={v as string} />,
  },
]

export function FreelancerDirectory() {
  const [roleFilter, setRoleFilter] = useState("all")
  const [taxFilter, setTaxFilter] = useState("all")
  const [arrangementFilter, setArrangementFilter] = useState("all")
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const filtered = freelancers.filter((f) => {
    if (roleFilter !== "all" && f.role !== roleFilter) return false
    if (taxFilter === "npwp" && !f.hasNPWP) return false
    if (taxFilter === "no_npwp" && f.hasNPWP) return false
    if (arrangementFilter !== "all" && f.taxArrangement !== arrangementFilter) return false
    return true
  })

  const activeCount = freelancers.filter((f) => f.status === "active").length
  const npwpCount = freelancers.filter((f) => f.hasNPWP).length
  const grossUpCount = freelancers.filter((f) => f.taxArrangement === "gross_up").length

  const freelancerPaymentHistory = selectedFreelancer
    ? freelancerPayments.filter((p) => p.freelancerId === selectedFreelancer.id).slice(0, 5)
    : []

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        title="Freelancer Directory"
        description="Manage freelancer profiles, tax status, and payment arrangements"
        actions={
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <UserPlus size={16} />
            Add Freelancer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Freelancers" value={String(freelancers.length)} icon={Users} iconColor="text-primary" />
        <StatCard title="Active" value={String(activeCount)} icon={Users} iconColor="text-success" />
        <StatCard title="With NPWP" value={String(npwpCount)} icon={Shield} iconColor="text-info" />
        <StatCard title="Gross-Up Arrangement" value={String(grossUpCount)} icon={ShieldOff} iconColor="text-gold" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={taxFilter} onValueChange={setTaxFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Tax Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tax Status</SelectItem>
            <SelectItem value="npwp">With NPWP</SelectItem>
            <SelectItem value="no_npwp">No NPWP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={arrangementFilter} onValueChange={setArrangementFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Arrangement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Arrangements</SelectItem>
            <SelectItem value="gross">Gross</SelectItem>
            <SelectItem value="gross_up">Gross-Up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered as (Freelancer & Record<string, unknown>)[]}
        searchPlaceholder="Search freelancers..."
        onRowClick={(row) => setSelectedFreelancer(row as unknown as Freelancer)}
        exportFilename="freelancer-directory.csv"
      />

      {/* Freelancer Detail Dialog */}
      <Dialog open={!!selectedFreelancer} onOpenChange={() => setSelectedFreelancer(null)}>
        <DialogContent className="max-w-lg">
          {selectedFreelancer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFreelancer.name}</DialogTitle>
                <DialogDescription>{selectedFreelancer.role} - {selectedFreelancer.specialty}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Email</p>
                    <p className="text-sm text-foreground">{selectedFreelancer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Phone</p>
                    <p className="text-sm text-foreground">{selectedFreelancer.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Bank</p>
                    <p className="text-sm text-foreground">{selectedFreelancer.bankName} - ****{selectedFreelancer.bankAccount.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Status</p>
                    <StatusBadge status={selectedFreelancer.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-3 bg-background">
                  <p className="text-sm font-semibold text-foreground">Tax Profile</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedFreelancer.hasNPWP ? "success" : "warning"}>
                        {selectedFreelancer.hasNPWP ? "NPWP" : "No NPWP"}
                      </Badge>
                    </div>
                    <div>
                      <Badge variant={selectedFreelancer.taxArrangement === "gross_up" ? "default" : "secondary"}>
                        {selectedFreelancer.taxArrangement === "gross_up" ? "Gross-Up" : "Gross"}
                      </Badge>
                    </div>
                    {selectedFreelancer.npwpNumber && (
                      <div className="col-span-2">
                        <p className="text-xs text-text-muted">NPWP Number</p>
                        <p className="text-sm font-mono text-foreground">{selectedFreelancer.npwpNumber}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-text-muted">Total Paid YTD (2026)</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(selectedFreelancer.totalPaidYTD)}</p>
                    </div>
                  </div>
                </div>
                {freelancerPaymentHistory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Recent Payments</p>
                    <div className="space-y-2">
                      {freelancerPaymentHistory.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg border border-border-light px-3 py-2">
                          <div>
                            <p className="text-foreground">{p.description}</p>
                            <p className="text-xs text-text-muted">{formatDate(p.paymentDate)}</p>
                          </div>
                          <div className="text-right">
                            <CurrencyDisplay amount={p.totalCompanyCost} size="sm" />
                            <div className="mt-0.5"><StatusBadge status={p.status} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Freelancer Demo Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Freelancer</DialogTitle>
            <DialogDescription>Register a new freelancer in the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="Enter full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Specialty</label>
                <Input placeholder="e.g. Short game" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input placeholder="0812-xxxx-xxxx" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Has NPWP?</label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tax Arrangement</label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">Gross</SelectItem>
                    <SelectItem value="gross_up">Gross-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bank</label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {["BCA", "Mandiri", "BRI", "BNI", "CIMB Niaga"].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Account Number</label>
                <Input placeholder="1234567890" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddDialogOpen(false)}>Save Freelancer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
