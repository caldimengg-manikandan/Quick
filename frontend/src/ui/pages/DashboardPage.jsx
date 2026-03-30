import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Clock, Calendar, Briefcase, FileText, Users, Activity, Loader2, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react"

import { apiRequest, unwrapResults } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { routes } from "../routes.js"

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pulse, setPulse] = useState({
    weekHours: null,
    pendingLeaves: null,
    nextShift: null,
    lastPayroll: null,
    adminOverview: null
  })

  const actions = useMemo(() => {
    if (!user) return []
    const base = [
      { label: "Clock In/Out", to: routes.time, icon: <Clock size={20}/> },
      { label: "Request Leave", to: routes.leaves, icon: <Calendar size={20}/> },
      { label: "View Payroll", to: routes.payroll, icon: <FileText size={20}/> },
      { label: "My Shifts", to: routes.scheduling, icon: <Briefcase size={20}/> }
    ]
    if (user.role === "admin") {
      base.push(
        { label: "Employees", to: routes.employees, icon: <Users size={20}/> },
        { label: "Reports", to: routes.reports, icon: <Activity size={20}/> }
      )
    }
    return base
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const [timesheetRes, leavesRes, shiftsRes, payrollRes] = await Promise.allSettled([
          apiRequest("/time/timesheets/"),
          apiRequest("/leaves/"),
          apiRequest("/scheduling/shifts/"),
          apiRequest("/payroll/records/")
        ])

        const timesheet = timesheetRes.status === "fulfilled" ? timesheetRes.value : null
        const weekHours = timesheet?.totals?.hours ?? null

        const leaveItems = leavesRes.status === "fulfilled" ? unwrapResults(leavesRes.value) : []
        const pendingLeaves = leaveItems.filter((l) => l.status === "pending").length

        const shiftItems = shiftsRes.status === "fulfilled" ? unwrapResults(shiftsRes.value) : []
        const now = new Date()
        const nextShift = shiftItems
          .map((s) => ({ ...s, start: new Date(s.shift_start), end: new Date(s.shift_end) }))
          .filter((s) => s.start.getTime() >= now.getTime())
          .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

        const payrollItems = payrollRes.status === "fulfilled" ? unwrapResults(payrollRes.value) : []
        const lastPayroll = payrollItems[0] ?? null

        let adminOverview = null
        if (user?.role === "admin") {
          try {
            adminOverview = await apiRequest("/reports/overview/")
          } catch (e) {
             // Admin overview failed silently
          }
        }

        if (!cancelled) {
          setPulse({ weekHours, pendingLeaves, nextShift, lastPayroll, adminOverview })
        }
      } catch (err) {
        if (!cancelled) setError("Unexpected error loading dashboard.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (user) load()
    return () => { cancelled = true }
  }, [user])

  return (
    <div className="dash-layout">
      
      {error && (
        <div style={{background:"#FEF2F2", color:"#B91C1C", padding:"16px", borderRadius:"12px", border:"1px solid #FECACA", display:"flex", alignItems:"center", gap:8, fontWeight:600}}>
          <AlertCircle size={18}/> {error}
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="dash-hero">
        <h1 className="dash-hero-title">Welcome back, {user?.username}</h1>
        <div className="dash-hero-sub">Here is your {user?.role === "admin" ? "executive" : "operational"} pulse for today.</div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <span className="dash-stat-title">Hours This Week</span>
            <div className="dash-stat-icon-wrap" style={{background: "rgba(99,102,241,0.1)", color: "#6366F1"}}><Clock size={18}/></div>
          </div>
          <div className="dash-stat-value">{loading ? "—" : pulse.weekHours ?? "0"}</div>
          <div className="dash-stat-desc">Logged in the last 7 days</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <span className="dash-stat-title">Pending Leaves</span>
            <div className="dash-stat-icon-wrap" style={{background: "rgba(245,158,11,0.1)", color: "#F59E0B"}}><Calendar size={18}/></div>
          </div>
          <div className="dash-stat-value">{loading ? "—" : pulse.pendingLeaves ?? "0"}</div>
          <div className="dash-stat-desc">Requests waiting for action</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <span className="dash-stat-title">Latest Payroll</span>
            <div className="dash-stat-icon-wrap" style={{background: "rgba(16,185,129,0.1)", color: "#10B981"}}><FileText size={18}/></div>
          </div>
          <div className="dash-stat-value">
            {loading ? "—" : pulse.lastPayroll ? `$${pulse.lastPayroll.net_pay}` : "N/A"}
          </div>
          <div className="dash-stat-desc">
            {pulse.lastPayroll 
              ? `${pulse.lastPayroll.period?.start_date} → ${pulse.lastPayroll.period?.end_date}` 
              : "No records found"}
          </div>
        </div>
      </div>

      {/* ── Content Split ── */}
      <div className="dash-content-grid">
        
        {/* Left: Quick Actions */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">Quick Actions</span>
          </div>
          <div className="dash-panel-body">
            <div className="dash-dock-grid">
              {actions.map(a => (
                <Link key={a.to} to={a.to} className="dash-dock-btn">
                  {a.icon}
                  <span className="dash-dock-label">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Insight Panel */}
        <div className="dash-panel">
          {user?.role === "admin" ? (
            <>
              <div className="dash-panel-header">
                <span className="dash-panel-title">System Overview</span>
              </div>
              <div className="dash-panel-body">
                {loading ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--muted)",justifyContent:"center",padding:20}}>
                    <Loader2 className="spin" size={16}/> Loading insights...
                  </div>
                ) : pulse.adminOverview ? (
                  <div className="dash-admin-grid">
                    <div className="dash-admin-card">
                      <div className="dash-admin-val">{pulse.adminOverview.employees?.total}</div>
                      <div className="dash-admin-lbl">Active Employees</div>
                    </div>
                    <div className="dash-admin-card">
                      <div className="dash-admin-val">{pulse.adminOverview.leaves?.pending}</div>
                      <div className="dash-admin-lbl">Pending Leaves</div>
                    </div>
                    <div className="dash-admin-card">
                      <div className="dash-admin-val">{pulse.adminOverview.time_tracking?.time_logs_in_range}</div>
                      <div className="dash-admin-lbl">Recent Time Logs</div>
                    </div>
                    <div className="dash-admin-card">
                      <div className="dash-admin-val">{pulse.adminOverview.payroll?.records_generated_in_range}</div>
                      <div className="dash-admin-lbl">Payroll Runs</div>
                    </div>
                  </div>
                ) : (
                  <div style={{color:"var(--muted)", textAlign:"center", padding:20}}>Overview unavailable.</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="dash-panel-header">
                <span className="dash-panel-title">Next Shift</span>
              </div>
              <div className="dash-panel-body" style={{padding:0}}>
                {loading ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--muted)",justifyContent:"center",padding:32}}>
                    <Loader2 className="spin" size={16}/> Finding shifts...
                  </div>
                ) : pulse.nextShift ? (
                  <div style={{padding: 32, textAlign:"center"}}>
                    <div style={{fontSize: 24, fontWeight: 800, color: "var(--fg)", marginBottom: 6}}>
                      {new Date(pulse.nextShift.shift_start).toLocaleDateString([], {weekday:"long", month:"short", day:"numeric"})}
                    </div>
                    <div style={{fontSize: 16, fontWeight: 600, color: "var(--fg2)"}}>
                      {new Date(pulse.nextShift.shift_start).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} → {new Date(pulse.nextShift.shift_end).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
                    </div>
                    <div style={{fontSize: 13, fontWeight: 600, color: "var(--primary)", background:"var(--surface2)", padding:"6px 12px", borderRadius:20, display:"inline-flex", marginTop:16}}>
                      {pulse.nextShift.title || "Regular Shift"}
                    </div>
                  </div>
                ) : (
                  <div style={{padding: 32, textAlign:"center", color:"var(--muted)"}}>
                    <CheckCircle2 size={32} opacity={0.3} style={{margin:"0 auto 12px"}}/>
                    You have no upcoming shifts assigned.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
