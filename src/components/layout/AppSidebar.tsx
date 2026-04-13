import { useState, useEffect, useMemo } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  Home, CreditCard, ArrowRightLeft, GitCompareArrows, Landmark,
  BarChart3, Building2, Bot, TrendingUp,
  Receipt, FilePlus, ClipboardCheck, ShieldCheck,
  Users, Wallet, FileSpreadsheet, FileBarChart,
  Store, BookOpen, FileText, DollarSign, PieChart,
  ChevronDown, Pin, PinOff,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NavItem { icon: LucideIcon; label: string; path: string }
interface NavGroup { label: string; icon: LucideIcon; items: NavItem[] }

const STORAGE_KEY = "topgolf-sidebar-pinned"

export function AppSidebar() {
  const location = useLocation()
  const [pinned, setPinned] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === "true"
  })
  const [hovered, setHovered] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: "Dashboard",
      icon: Home,
      items: [
        { icon: Home, label: "Overview", path: "/dashboard" },
      ],
    },
    {
      label: "Payments",
      icon: CreditCard,
      items: [
        { icon: CreditCard, label: "Overview", path: "/payments" },
        { icon: ArrowRightLeft, label: "Transactions", path: "/payments/transactions" },
        { icon: GitCompareArrows, label: "Reconciliation", path: "/payments/reconciliation" },
        { icon: Landmark, label: "Settlements", path: "/payments/settlements" },
      ],
    },
    {
      label: "Sales",
      icon: BarChart3,
      items: [
        { icon: BarChart3, label: "Dashboard", path: "/sales" },
        { icon: Building2, label: "Branch Reports", path: "/sales/branches" },
        { icon: Bot, label: "AI Assistant", path: "/sales/ai" },
        { icon: TrendingUp, label: "Trends", path: "/sales/trends" },
      ],
    },
    {
      label: "Reimbursements",
      icon: Receipt,
      items: [
        { icon: Receipt, label: "My Requests", path: "/reimbursements" },
        { icon: FilePlus, label: "Submit New", path: "/reimbursements/submit" },
        { icon: ClipboardCheck, label: "Approvals", path: "/reimbursements/approvals" },
        { icon: ShieldCheck, label: "Admin", path: "/reimbursements/admin" },
      ],
    },
    {
      label: "Freelancers",
      icon: Users,
      items: [
        { icon: Users, label: "Directory", path: "/freelancers" },
        { icon: Wallet, label: "Payments", path: "/freelancers/payments" },
        { icon: FileSpreadsheet, label: "Tax Summary", path: "/freelancers/tax" },
        { icon: FileBarChart, label: "Reports", path: "/freelancers/reports" },
      ],
    },
    {
      label: "Vendors",
      icon: Store,
      items: [
        { icon: Store, label: "Dashboard", path: "/vendors" },
        { icon: BookOpen, label: "Directory", path: "/vendors/directory" },
        { icon: FileText, label: "Invoices", path: "/vendors/invoices" },
        { icon: DollarSign, label: "Payments", path: "/vendors/payments" },
        { icon: PieChart, label: "Reports", path: "/vendors/reports" },
      ],
    },
  ], [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(pinned))
  }, [pinned])

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => isActive(i.path)))
    if (activeGroup) {
      setOpenGroups(prev => new Set([...prev, activeGroup.label]))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const expanded = pinned || hovered

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Exact-match paths: these are "index" routes that share a prefix with child routes
  const exactMatchPaths = new Set(['/sales', '/payments', '/freelancers', '/vendors', '/reimbursements'])

  const isActive = (path: string) => {
    if (location.pathname === path) return true
    if (exactMatchPaths.has(path)) return false
    return path !== "/" && path !== "/dashboard" && location.pathname.startsWith(path)
  }

  const isGroupActive = (group: NavGroup) => group.items.some(i => isActive(i.path))

  return (
    <>
      {expanded && !pinned && (
        <div className="fixed inset-0 z-30" onClick={() => setHovered(false)} />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: expanded ? 230 : 52,
          background: 'var(--color-sidebar)',
        }}
        className={`flex h-full flex-col transition-all duration-200 ease-out z-[60] ${
          pinned ? 'relative' : 'fixed left-0 top-0 bottom-0'
        }`}
      >
        {/* Brand header */}
        <div
          className="shrink-0 flex items-center border-b"
          style={{
            height: 44,
            padding: expanded ? '0 12px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderColor: 'var(--color-sidebar-border)',
          }}
        >
          <div className={`flex items-center gap-2.5 min-w-0 ${expanded ? '' : 'justify-center'}`}>
            <div
              className="shrink-0 rounded-lg flex items-center justify-center"
              style={{ height: 24, width: 24, background: 'var(--color-gold)' }}
            >
              <span className="text-white font-bold" style={{ fontSize: 11 }}>T</span>
            </div>
            {expanded && (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-white" style={{ fontSize: 13, letterSpacing: '0.02em' }}>TOPGOLF</span>
                  <span style={{ fontSize: 8, color: 'var(--color-gold)', letterSpacing: '0.2em', marginTop: -1 }} className="uppercase">Indonesia</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setPinned(!pinned) }}
                  className="shrink-0 rounded transition-colors"
                  style={{ padding: 4, color: 'var(--color-sidebar-muted)' }}
                  title={pinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  {pinned ? <Pin size={11} /> : <PinOff size={11} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex flex-1 flex-col overflow-y-auto ${expanded ? '' : 'items-center'}`}
          style={{ padding: '8px 8px', gap: 2 }}
        >
          {expanded ? (
            navGroups.map(group => {
              const open = openGroups.has(group.label)
              const groupActive = isGroupActive(group)
              return (
                <div key={group.label} style={{ marginTop: 4 }}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center w-full rounded-lg transition-all duration-150"
                    style={{
                      gap: 10,
                      padding: '7px 10px',
                      fontSize: 13,
                      color: groupActive && !open ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-sidebar-hover)'
                      e.currentTarget.style.color = 'var(--color-sidebar-text-active)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = groupActive && !open ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)'
                    }}
                  >
                    <group.icon size={17} strokeWidth={1.7} className="shrink-0" />
                    <span className="truncate flex-1 text-left font-medium">{group.label}</span>
                    <ChevronDown
                      size={13}
                      className="shrink-0 transition-transform duration-200"
                      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                  </button>
                  {open && (
                    <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {group.items.map(item => {
                        const active = isActive(item.path)
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center w-full rounded-lg transition-all duration-150 relative"
                            style={{
                              gap: 10,
                              padding: '7px 10px 7px 40px',
                              fontSize: 13,
                              fontWeight: active ? 500 : 400,
                              background: active ? 'var(--color-sidebar-active)' : 'transparent',
                              color: active ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
                            }}
                            onMouseEnter={e => {
                              if (!active) {
                                e.currentTarget.style.background = 'var(--color-sidebar-hover)'
                                e.currentTarget.style.color = 'var(--color-sidebar-text-active)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (!active) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--color-sidebar-text)'
                              }
                            }}
                          >
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            navGroups.map(group => (
              <Link
                key={group.label}
                to={group.items[0].path}
                className="flex items-center justify-center rounded-lg transition-all duration-150"
                style={{
                  width: 36,
                  height: 36,
                  margin: '2px 0',
                  background: isGroupActive(group) ? 'var(--color-sidebar-active)' : 'transparent',
                  color: isGroupActive(group) ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
                }}
                title={group.label}
              >
                <group.icon size={18} strokeWidth={1.7} />
              </Link>
            ))
          )}
        </nav>

        {/* Footer */}
        {expanded && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-sidebar-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-sidebar-muted)', textAlign: 'center' }}>
              Powered by ReOrc
            </p>
          </div>
        )}
      </aside>

      {!pinned && <div style={{ width: 52 }} className="shrink-0" />}
    </>
  )
}
