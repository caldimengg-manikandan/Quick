import { useState, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { isOffline } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { routes } from "../routes.js"
import { ThemeToggle } from "./ThemeToggle.jsx"
import { CommandPalette } from "./CommandPalette.jsx"
import { NotificationCenter } from "./NotificationCenter.jsx"
import logoDark from "../../assets/logo.png"
import logoWhite from "../../assets/logo_white.png"

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
  Search,
  ChevronDown
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

function TopbarClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  
  const formattedTime = now.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit' })
  const formattedDate = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  
  return (
    <div className="topbarWidget clockWidget">
      <Clock size={14} className="widgetIcon" />
      <span className="clockTime">{formattedTime}</span>
      <span className="clockDate">{formattedDate}</span>
    </div>
  )
}

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
        {/* Left: Brand */}
        <div className="topbarLeft">
          <div className="brand">
            <img src={logoDark} alt="QuickTIMS" className="brand-logo logo-light-mode" />
            <img src={logoWhite} alt="QuickTIMS" className="brand-logo logo-dark-mode" />
            <div className="brand-divider" />
            <span className="brand-module">Enterprise ERP</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="topbarCenter">
          <button
            type="button"
            className="topbar-search-btn"
            onClick={() => setCmdOpen(true)}
            title="Search command palette (⌘K)"
          >
            <Search size={15} className="searchIcon" />
            <span className="searchText">Search everywhere...</span>
            <span className="searchKbd">⌘K</span>
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="topbarRight">
          {offline && (
            <span className="topbarBadge warnPulse" title="Backend unreachable — showing demo data">
              <span className="pulseDot"></span> Demo Mode
            </span>
          )}

          <TopbarClock />

          <div className="topbarActions">
           <NotificationCenter />
           <ThemeToggle />
          </div>

          <div className="topbarDivider"></div>

          <button className="userProfilePill" onClick={logout} title="Click to log out">
            <div className="userAvatarWrap">
              <div className="userAvatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="activeStatus"></div>
            </div>
            <div className="userInfoStack">
              <span className="userName">{user.username}</span>
              <span className="userRole">{user.role}</span>
            </div>
            <ChevronDown size={14} className="userChevron" />
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
