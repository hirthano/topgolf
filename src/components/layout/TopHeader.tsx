import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Search, Bell, ChevronDown, LogOut, User, Settings, ChevronRight,
} from "lucide-react"

import { useAuthStore } from "@/stores/auth-store"
import { getInitials } from "@/lib/utils"

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  payments: "Payments",
  transactions: "Transactions",
  reconciliation: "Reconciliation",
  settlements: "Settlements",
  sales: "Sales",
  branches: "Branch Reports",
  ai: "AI Assistant",
  trends: "Trends",
  reimbursements: "Reimbursements",
  submit: "Submit New",
  approvals: "Approvals",
  admin: "Admin",
  freelancers: "Freelancers",
  tax: "Tax Summary",
  reports: "Reports",
  vendors: "Vendors",
  directory: "Directory",
  invoices: "Invoices",
}

export function TopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const pathParts = location.pathname.split("/").filter(Boolean)
  const breadcrumbs = pathParts.map((part, i) => ({
    label: breadcrumbMap[part] || part.charAt(0).toUpperCase() + part.slice(1),
    path: "/" + pathParts.slice(0, i + 1).join("/"),
    isLast: i === pathParts.length - 1,
  }))

  const displayName = user?.name || "User"
  const initials = getInitials(displayName)

  return (
    <header
      className="shrink-0 border-b flex items-center sticky top-0 z-20"
      style={{
        height: 44,
        padding: '0 16px',
        gap: 12,
        borderColor: 'var(--color-border)',
        background: 'var(--color-card)',
      }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center min-w-0 flex-shrink-0" style={{ gap: 4, fontSize: 13 }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center" style={{ gap: 4 }}>
            {i > 0 && <ChevronRight size={11} className="text-text-muted" />}
            {crumb.isLast ? (
              <span className="font-medium text-foreground truncate">{crumb.label}</span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {crumb.label}
              </button>
            )}
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div
          className="flex items-center rounded-lg border"
          style={{
            gap: 8,
            padding: '0 10px',
            height: 32,
            width: '100%',
            maxWidth: 360,
            borderColor: 'var(--color-border)',
            background: 'var(--color-background)',
          }}
        >
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ fontSize: 13 }}
            className="bg-transparent outline-none flex-1 placeholder:text-text-muted text-foreground"
          />
          {searchValue && (
            <button onClick={() => setSearchValue("")} className="text-text-muted hover:text-foreground">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center shrink-0" style={{ gap: 6 }}>
        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          style={{ height: 32, width: 32 }}
        >
          <Bell size={16} />
          <span
            className="absolute flex items-center justify-center rounded-full bg-danger text-white font-bold"
            style={{
              top: 2, right: 2,
              minWidth: 15, height: 15,
              padding: '0 3px',
              fontSize: 9,
              boxShadow: '0 0 0 2px var(--color-card)',
            }}
          >
            3
          </span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center rounded-lg hover:bg-secondary transition-colors"
            style={{ gap: 8, height: 32, padding: '0 8px' }}
          >
            <div
              className="rounded-full bg-primary flex items-center justify-center text-white font-semibold shrink-0"
              style={{ height: 26, width: 26, fontSize: 10 }}
            >
              {initials}
            </div>
            <span className="font-medium text-foreground hidden md:block" style={{ fontSize: 12 }}>{displayName}</span>
            <ChevronDown size={11} className="text-text-muted" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 z-50 rounded-xl border shadow-lg"
                style={{
                  top: 38,
                  width: 220,
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-card)',
                  padding: 4,
                }}
              >
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                  <p className="font-semibold text-foreground" style={{ fontSize: 13 }}>{displayName}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{user?.email}</p>
                  <p className="text-text-muted capitalize" style={{ fontSize: 10, marginTop: 2 }}>
                    {user?.role} {user?.branch ? `· ${user.branch}` : ""}
                  </p>
                </div>

                <button
                  className="w-full flex items-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                  style={{ gap: 10, padding: '8px 12px', fontSize: 13 }}
                >
                  <User size={14} /> Profile
                </button>
                <button
                  className="w-full flex items-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                  style={{ gap: 10, padding: '8px 12px', fontSize: 13 }}
                >
                  <Settings size={14} /> Settings
                </button>
                <div style={{ margin: '4px 0', borderTop: '1px solid var(--color-border)' }} />
                <button
                  onClick={() => { logout(); navigate("/login"); setShowUserMenu(false) }}
                  className="w-full flex items-center rounded-lg text-danger hover:bg-red-50 transition-colors"
                  style={{ gap: 10, padding: '8px 12px', fontSize: 13 }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
