import { useState, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { isOffline } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { routes } from "../routes.js"
import { ThemeToggle } from "./ThemeToggle.jsx"
import { CommandPalette } from "./CommandPalette.jsx"
import { NotificationCenter } from "./NotificationCenter.jsx"

import { 
  Home, 
  Clock, 
  CheckSquare, 
  CalendarDays, 
  Banknote, 
  CalendarRange, 
  Users, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search
} from "lucide-react"

const NAV = [
  { label: "Dashboard",  to: routes.dashboard,  icon: <Home size={18} strokeWidth={2.5} /> },
  { label: "Time",       to: routes.time,        icon: <Clock size={18} strokeWidth={2.5} /> },
  { label: "Tasks",      to: routes.tasks,       icon: <CheckSquare size={18} strokeWidth={2.5} /> },
  { label: "Leaves",     to: routes.leaves,      icon: <CalendarDays size={18} strokeWidth={2.5} /> },
  { label: "Payroll",    to: routes.payroll,     icon: <Banknote size={18} strokeWidth={2.5} /> },
  { label: "Scheduling", to: routes.scheduling,  icon: <CalendarRange size={18} strokeWidth={2.5} /> },
  { label: "Employees",  to: routes.employees,   icon: <Users size={18} strokeWidth={2.5} />,  adminOnly: true },
  { label: "Reports",    to: routes.reports,     icon: <BarChart3 size={18} strokeWidth={2.5} />,  adminOnly: true },
  { label: "Settings",   to: routes.settings,    icon: <Settings size={18} strokeWidth={2.5} /> },
]

function TopbarClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--fg2)", background: "var(--surface2)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--stroke)" }}>
      <Clock size={14} opacity={0.6} />
      {now.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [offline, setOffline] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setOffline(isOffline()), 1500)
    return () => clearInterval(t)
  }, [])

  if (!user) return null

  const items = NAV.filter((i) => !i.adminOnly || user.role === "admin")

  return (
    <div className={`app ${collapsed ? "app-collapsed" : ""}`}>
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      {/* ── Topbar ───────────────────────────── */}
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div className="brandText">
            <div className="brandName">QuickTIMS</div>
            <div className="brandTag">Enterprise</div>
          </div>
        </div>

        <div className="topbarRight">
          {offline && (
            <span className="badge badgeBase badgeWarn" title="Backend unreachable — showing demo data">
              <span className="badgeDot"></span> Demo Mode
            </span>
          )}

          <TopbarClock />

          <button 
            type="button"
            className="btn btnGhost" 
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 12px", background: "var(--surface2)", borderRadius: 8, color: "var(--muted)", fontSize: 13, border: "1px solid var(--stroke)" }}
            onClick={() => setCmdOpen(true)}
            title="Search command palette"
          >
            <Search size={14} /> Search anything... 
            <span style={{ fontSize: 10, fontWeight: 800, background: "var(--surface)", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>⌘K</span>
          </button>

          <NotificationCenter />

          <div className="topbarDivider"></div>

          {/* Clean User Profile Area */}
          <div className="userProfileWrap">
            <div className="userAvatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="userInfoStack">
              <span className="userName">{user.username}</span>
              <span className="userRole">{user.role}</span>
            </div>
          </div>

          <ThemeToggle />

          <button className="btn btnGhost" onClick={logout} type="button" title="Sign out" style={{ padding: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────── */}
      <div className="layout">
        <aside className="sidebar">
          <nav className="nav">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  ["navItem", isActive || (item.to !== "/" && location.pathname.startsWith(item.to)) ? "active" : ""]
                    .filter(Boolean)
                    .join(" ")
                }
                end={item.to === "/"}
                title={collapsed ? item.label : undefined}
              >
                <span className="navIcon">{item.icon}</span>
                <span className="navLabel">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebarFooter">
            <button className="sidebarToggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Sidebar">
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              <span className="navLabel">Collapse</span>
            </button>
          </div>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
