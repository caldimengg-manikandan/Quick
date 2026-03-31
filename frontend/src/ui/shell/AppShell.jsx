import { useState, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { isOffline } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { routes } from "../routes.js"
import { ThemeToggle } from "./ThemeToggle.jsx"
import { CommandPalette } from "./CommandPalette.jsx"
import { NotificationCenter } from "./NotificationCenter.jsx"
import logo from "../../assets/logo.png"

import {
  Home,
  Clock,
  CheckSquare,
  CalendarDays,
  Banknote,
  CalendarRange,
  Users,
  BarChart3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search
} from "lucide-react"

const NAV = [
  { label: "Dashboard", to: routes.dashboard, icon: <Home size={18} strokeWidth={2.5} /> },
  { label: "Locations", to: routes.locations, icon: <MapPin size={18} strokeWidth={2.5} /> },
  { label: "Time", to: routes.time, icon: <Clock size={18} strokeWidth={2.5} /> },
  { label: "Tasks", to: routes.tasks, icon: <CheckSquare size={18} strokeWidth={2.5} /> },
  { label: "Leaves", to: routes.leaves, icon: <CalendarDays size={18} strokeWidth={2.5} /> },
  { label: "Payroll", to: routes.payroll, icon: <Banknote size={18} strokeWidth={2.5} /> },
  { label: "Scheduling", to: routes.scheduling, icon: <CalendarRange size={18} strokeWidth={2.5} /> },
  { label: "Employees", to: routes.employees, icon: <Users size={18} strokeWidth={2.5} />, adminOnly: true },
  { label: "Reports", to: routes.reports, icon: <BarChart3 size={18} strokeWidth={2.5} />, adminOnly: true },
  { label: "Settings", to: routes.settings, icon: <Settings size={18} strokeWidth={2.5} /> },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [offline, setOffline] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setOffline(isOffline()), 1500)
    return () => clearInterval(t)
  }, [])

  if (!user) return null

  const items = NAV.filter((i) => !i.adminOnly || user.role === "admin")

  return (
    <div className="app">
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      {/* ── Topbar ───────────────────────────── */}
      <header className="topbar">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg className="qtHourglass" width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="qtHgBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <rect width="44" height="44" rx="12" fill="url(#qtHgBg)" />
            <rect x="11" y="10" width="22" height="3" rx="1.5" fill="white" />
            <rect x="11" y="31" width="22" height="3" rx="1.5" fill="white" />
            <path className="qtHourglassTop" d="M12 13 L32 13 L25 21.8 L19 21.8 Z" fill="rgba(255,255,255,0.92)" />
            <path className="qtHourglassBottom" d="M12 31 L32 31 L25 22.2 L19 22.2 Z" fill="rgba(255,255,255,0.45)" />
            <rect className="qtHourglassStream" x="21.25" y="21.5" width="1.5" height="2.5" rx="0.75" fill="rgba(255,255,255,0.95)" />
            <circle className="qtHourglassDrop qtHourglassDrop1" cx="22" cy="24.5" r="1.15" fill="rgba(255,255,255,0.95)" />
            <circle className="qtHourglassDrop qtHourglassDrop2" cx="22" cy="24.5" r="1.15" fill="rgba(255,255,255,0.95)" />
            <circle className="qtHourglassDrop qtHourglassDrop3" cx="22" cy="24.5" r="1.15" fill="rgba(255,255,255,0.95)" />
          </svg>
          <img src={logo} alt="QuickTIMS" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
          <button
            type="button"
            className="btn btnGhost"
            style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", minWidth: 320, padding: "6px 12px", background: "var(--surface2)", borderRadius: 8, color: "var(--muted)", fontSize: 13, border: "1px solid var(--stroke)" }}
            onClick={() => setCmdOpen(true)}
            title="Search command palette"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Search size={14} /> Search anything...
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, background: "var(--surface)", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>⌘K</span>
          </button>
        </div>

        <div className="topbarRight">
          {offline && (
            <span className="badge badgeBase badgeWarn" title="Backend unreachable — showing demo data">
              <span className="badgeDot"></span> Demo Mode
            </span>
          )}

          

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
