import { useEffect, useMemo, useState } from "react"

import { apiRequest, unwrapResults } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { Card, Pill } from "../components/kit.jsx"
import { routes } from "../routes.js"

function startOfISODate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

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
      { label: "Clock In/Out", to: routes.time },
      { label: "Request Leave", to: routes.leaves },
      { label: "View Payroll", to: routes.payroll },
      { label: "My Shifts", to: routes.scheduling }
    ]
    if (user.role === "admin") base.push({ label: "Employees", to: routes.employees }, { label: "Reports", to: routes.reports })
    return base
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const [timesheet, leaves, shifts, payroll] = await Promise.all([
          apiRequest("/time/timesheets/"),
          apiRequest("/leaves/"),
          apiRequest("/scheduling/shifts/"),
          apiRequest("/payroll/records/")
        ])

        const weekHours = timesheet?.totals?.hours ?? null
        const leaveItems = unwrapResults(leaves)
        const pendingLeaves = leaveItems.filter((l) => l.status === "pending").length

        const shiftItems = unwrapResults(shifts)
        const now = new Date()
        const nextShift = shiftItems
          .map((s) => ({ ...s, start: new Date(s.shift_start), end: new Date(s.shift_end) }))
          .filter((s) => s.start.getTime() >= now.getTime())
          .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

        const payrollItems = unwrapResults(payroll)
        const lastPayroll = payrollItems[0] ?? null

        let adminOverview = null
        if (user?.role === "admin") {
          adminOverview = await apiRequest("/reports/overview/")
        }

        if (!cancelled) {
          setPulse({ weekHours, pendingLeaves, nextShift, lastPayroll, adminOverview })
        }
      } catch (err) {
        if (!cancelled) setError(err?.body?.detail || "Failed to load dashboard.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (user) load()
    return () => {
      cancelled = true
    }
  }, [user])

  const today = startOfISODate(new Date())

  return (
    <div className="stackLg">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <div className="pageSub">Your day, distilled into signals.</div>
        </div>
        <div className="row">
          <Pill tone="neutral">{today.toLocaleDateString()}</Pill>
        </div>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}

      <div className="grid3">
        <Card title="This Week">
          <div className="metric">
            <div className="metricValue">{loading ? "…" : pulse.weekHours ?? "—"}</div>
            <div className="metricLabel">hours logged (last 7 days)</div>
          </div>
        </Card>
        <Card title="Leaves">
          <div className="metric">
            <div className="metricValue">{loading ? "…" : pulse.pendingLeaves ?? "—"}</div>
            <div className="metricLabel">pending requests</div>
          </div>
        </Card>
        <Card title="Next Shift">
          {loading ? (
            <div className="muted">Loading…</div>
          ) : pulse.nextShift ? (
            <div className="stack">
              <div className="big">{new Date(pulse.nextShift.shift_start).toLocaleString()}</div>
              <div className="muted">{pulse.nextShift.title || "Shift"}</div>
            </div>
          ) : (
            <div className="muted">No upcoming shifts.</div>
          )}
        </Card>
      </div>

      <Card
        title="Action Dock"
        actions={
          <div className="row">
            <span className="muted">Fast lane</span>
          </div>
        }
      >
        <div className="dock">
          {actions.map((a) => (
            <a key={a.to} className="dockItem" href={a.to}>
              <div className="dockLabel">{a.label}</div>
            </a>
          ))}
        </div>
      </Card>

      <div className="grid2">
        <Card title="Payroll (Latest)">
          {loading ? (
            <div className="muted">Loading…</div>
          ) : pulse.lastPayroll ? (
            <div className="stack">
              <div className="row">
                <Pill tone="good">${pulse.lastPayroll.net_pay}</Pill>
                <span className="muted">
                  {pulse.lastPayroll.period?.start_date} → {pulse.lastPayroll.period?.end_date}
                </span>
              </div>
              <div className="muted">Regular {pulse.lastPayroll.regular_hours}h · OT {pulse.lastPayroll.overtime_hours}h</div>
            </div>
          ) : (
            <div className="muted">No records yet.</div>
          )}
        </Card>

        <Card title="Admin Overview">
          {user?.role !== "admin" ? (
            <div className="muted">Admin-only insights appear here.</div>
          ) : loading ? (
            <div className="muted">Loading…</div>
          ) : pulse.adminOverview ? (
            <div className="grid2Tight">
              <div className="miniMetric">
                <div className="miniValue">{pulse.adminOverview.employees?.total}</div>
                <div className="miniLabel">employees</div>
              </div>
              <div className="miniMetric">
                <div className="miniValue">{pulse.adminOverview.leaves?.pending}</div>
                <div className="miniLabel">pending leaves</div>
              </div>
              <div className="miniMetric">
                <div className="miniValue">{pulse.adminOverview.time_tracking?.time_logs_in_range}</div>
                <div className="miniLabel">time logs</div>
              </div>
              <div className="miniMetric">
                <div className="miniValue">{pulse.adminOverview.payroll?.records_generated_in_range}</div>
                <div className="miniLabel">payroll runs</div>
              </div>
            </div>
          ) : (
            <div className="muted">No data.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
