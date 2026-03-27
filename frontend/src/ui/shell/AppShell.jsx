import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { isOffline } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { routes } from "../routes.js"
import { ThemeToggle } from "./ThemeToggle.jsx"

const NAV = [
  { label: "Dashboard",  to: routes.dashboard,  icon: "🏠" },
  { label: "Time",       to: routes.time,        icon: "⏱" },
  { label: "Tasks",      to: routes.tasks,       icon: "✅" },
  { label: "Leaves",     to: routes.leaves,      icon: "📅" },
  { label: "Payroll",    to: routes.payroll,     icon: "💰" },
  { label: "Scheduling", to: routes.scheduling,  icon: "📋" },
  { label: "Employees",  to: routes.employees,   icon: "👥",  adminOnly: true },
  { label: "Reports",    to: routes.reports,     icon: "📊",  adminOnly: true },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setOffline(isOffline()), 1500)
    return () => clearInterval(t)
  }, [])

  if (!user) return null

  const items = NAV.filter((i) => !i.adminOnly || user.role === "admin")

  return (
    <div className="app">
      {/* ── Topbar ───────────────────────────── */}
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div className="brandText">
            <div className="brandName">QuickTIMS</div>
          </div>
        </div>

        <div className="topbarRight">
          {offline && (
            <span className="offlineBadge" title="Backend unreachable — showing demo data">
              🟡 Demo mode
            </span>
          )}

          {/* User pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--stroke2)", background: "var(--surface2)", fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: "var(--fg2)" }}>{user.username}</span>
            <span className="pill" style={{ padding: "2px 7px", fontSize: 10.5 }}>{user.role}</span>
          </div>

          <ThemeToggle />

          <button className="btn btnGhost" onClick={logout} type="button" style={{ fontSize: 12.5, padding: "6px 12px" }}>
            Sign out
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
              >
                <span className="navIcon">{item.icon}</span>
                <span className="navLabel">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
