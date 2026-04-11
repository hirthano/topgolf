import { Routes, Route, Navigate } from "react-router-dom"
import type { ReactNode } from "react"

import { useAuthStore } from "@/stores/auth-store"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/auth/LoginPage"
import { PaymentDashboard } from "@/pages/payments/PaymentDashboard"
import { TransactionsPage } from "@/pages/payments/TransactionsPage"
import { ReconciliationPage } from "@/pages/payments/ReconciliationPage"
import { SettlementsPage } from "@/pages/payments/SettlementsPage"
import { SalesDashboard } from "@/pages/sales/SalesDashboard"
import { BranchReportsPage } from "@/pages/sales/BranchReportsPage"
import { AIAssistantPage } from "@/pages/sales/AIAssistantPage"
import { TrendsPage } from "@/pages/sales/TrendsPage"
import { MyReimbursements } from "@/pages/reimbursements/MyReimbursements"
import { NewReimbursement } from "@/pages/reimbursements/NewReimbursement"
import { ApprovalsPage } from "@/pages/reimbursements/ApprovalsPage"
import { ReimbursementAdmin } from "@/pages/reimbursements/ReimbursementAdmin"
import { FreelancerDirectory } from "@/pages/freelancers/FreelancerDirectory"
import { FreelancerPayments } from "@/pages/freelancers/FreelancerPayments"
import { TaxSummaryPage } from "@/pages/freelancers/TaxSummaryPage"
import { FreelancerReports } from "@/pages/freelancers/FreelancerReports"
import { VendorDashboard } from "@/pages/vendors/VendorDashboard"
import { VendorDirectory } from "@/pages/vendors/VendorDirectory"
import { InvoicesPage } from "@/pages/vendors/InvoicesPage"
import { VendorPayments } from "@/pages/vendors/VendorPayments"
import { VendorReports } from "@/pages/vendors/VendorReports"
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview"

/* ─── Protected Route wrapper ─── */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/* ─── Guest Route wrapper (redirect to app if already logged in) ─── */
function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/payments" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardOverview />} />

        {/* Payments */}
        <Route path="/payments" element={<PaymentDashboard />} />
        <Route path="/payments/transactions" element={<TransactionsPage />} />
        <Route path="/payments/reconciliation" element={<ReconciliationPage />} />
        <Route path="/payments/settlements" element={<SettlementsPage />} />

        {/* Sales */}
        <Route path="/sales" element={<SalesDashboard />} />
        <Route path="/sales/branches" element={<BranchReportsPage />} />
        <Route path="/sales/ai" element={<AIAssistantPage />} />
        <Route path="/sales/trends" element={<TrendsPage />} />

        {/* Reimbursements */}
        <Route path="/reimbursements" element={<MyReimbursements />} />
        <Route path="/reimbursements/submit" element={<NewReimbursement />} />
        <Route path="/reimbursements/approvals" element={<ApprovalsPage />} />
        <Route path="/reimbursements/admin" element={<ReimbursementAdmin />} />

        {/* Freelancers */}
        <Route path="/freelancers" element={<FreelancerDirectory />} />
        <Route path="/freelancers/payments" element={<FreelancerPayments />} />
        <Route path="/freelancers/tax" element={<TaxSummaryPage />} />
        <Route path="/freelancers/reports" element={<FreelancerReports />} />

        {/* Vendors */}
        <Route path="/vendors" element={<VendorDashboard />} />
        <Route path="/vendors/directory" element={<VendorDirectory />} />
        <Route path="/vendors/invoices" element={<InvoicesPage />} />
        <Route path="/vendors/payments" element={<VendorPayments />} />
        <Route path="/vendors/reports" element={<VendorReports />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/payments" replace />} />
    </Routes>
  )
}
