import { useEffect, useState } from "react"
import { apiRequest, unwrapResults } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { Button, Pill, formatDateTime } from "../components/kit.jsx"

// ─── helpers ─────────────────────────────────────────────────
const CATEGORIES = [
  { value: "electrician",  label: "⚡ Electrician"  },
  { value: "plumber",      label: "🔧 Plumber"      },
  { value: "carpenter",    label: "🪚 Carpenter"     },
  { value: "hvac",         label: "❄️ HVAC"          },
  { value: "maintenance",  label: "🛠 Maintenance"   },
  { value: "inspection",   label: "🔍 Inspection"    },
  { value: "cleaning",     label: "🧹 Cleaning"      },
  { value: "installation", label: "📦 Installation"  },
  { value: "repair",       label: "⚒ Repair"         },
  { value: "other",        label: "📋 Other"         },
]

const PRIORITIES = [
  { value: "low",    label: "Low"    },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High"   },
  { value: "urgent", label: "Urgent" },
]

const STATUS_FILTERS = ["all", "pending", "in_progress", "completed", "cancelled"]

function categoryLabel(val) {
  return CATEGORIES.find((c) => c.value === val)?.label ?? val
}

function statusTone(s) {
  if (s === "completed")   return "good"
  if (s === "in_progress") return "warn"
  if (s === "cancelled")   return "bad"
  return "neutral"
}

function statusLabel(s) {
  return { pending: "Pending", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" }[s] ?? s
}

function priorityColor(p) {
  return { low: "#6B7280", medium: "#2563EB", high: "#D97706", urgent: "#DC2626" }[p] ?? "#6B7280"
}

// ─── Empty assign form ────────────────────────────────────────
const EMPTY_FORM = {
  title:           "",
  description:     "",
  category:        "other",
  priority:        "medium",
  assigned_to:     "",
  due_date:        new Date().toISOString().slice(0, 10),
  estimated_hours: "1",
  location:        "",
  admin_notes:     "",
}

// ─── Task Card (employee) ────────────────────────────────────
function TaskCard({ task, onAction, busy }) {
  const [note, setNote] = useState(task.employee_notes || "")
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`taskCard taskCard--${task.status}`}>
      {/* Header row */}
      <div className="taskCardHeader">
        <div className="taskCardLeft">
          <span className="taskCategoryBadge">{categoryLabel(task.category)}</span>
          <span className="taskPriorityDot" style={{ background: priorityColor(task.priority) }} title={task.priority} />
        </div>
        <Pill tone={statusTone(task.status)}>{statusLabel(task.status)}</Pill>
      </div>

      {/* Title */}
      <div className="taskCardTitle">{task.title}</div>

      {/* Meta */}
      <div className="taskCardMeta">
        {task.location && <span>📍 {task.location}</span>}
        <span>📅 {task.due_date}</span>
        <span>⏱ {task.estimated_hours}h est.</span>
        {task.actual_hours > 0 && <span>✅ {task.actual_hours}h actual</span>}
      </div>

      {/* Description (collapsible) */}
      {task.description && (
        <div className="taskCardDesc" style={{ maxHeight: expanded ? "none" : "2.8em", overflow: "hidden" }}>
          {task.description}
        </div>
      )}
      {task.description && task.description.length > 120 && (
        <button className="taskExpandBtn" onClick={() => setExpanded((v) => !v)} type="button">
          {expanded ? "Show less ▲" : "Show more ▼"}
        </button>
      )}

      {/* Admin note (read-only for employee) */}
      {task.admin_notes && (
        <div className="taskAdminNote">
          <strong>Admin note:</strong> {task.admin_notes}
        </div>
      )}

      {/* Actions */}
      <div className="taskCardActions">
        {task.status === "pending" && (
          <Button variant="primary" disabled={busy} onClick={() => onAction(task.id, "start")}>
            ▶ Start Task
          </Button>
        )}
        {task.status === "in_progress" && (
          <>
            <div className="taskNoteInput">
              <textarea
                className="input textarea"
                rows={2}
                placeholder="Add completion notes…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                className="taskNoteBtn"
                type="button"
                disabled={busy}
                onClick={() => onAction(task.id, "notes", { employee_notes: note })}
              >
                Save note
              </button>
            </div>
            <Button variant="ghost" disabled={busy} onClick={() => onAction(task.id, "complete")}>
              ✅ Mark Complete
            </Button>
          </>
        )}
        {task.status === "completed" && task.started_at && (
          <div className="taskCompletedMeta">
            ✓ Completed · {task.actual_hours}h · {new Date(task.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Admin: Assign Task Form ──────────────────────────────────
function AssignTaskPanel({ employees, onAssigned }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState("")

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.assigned_to) { setErr("Please select an employee."); return }
    if (!form.title.trim()) { setErr("Title is required."); return }
    setBusy(true); setErr("")
    try {
      await apiRequest("/tasks/admin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, estimated_hours: parseFloat(form.estimated_hours) || 1 }),
      })
      setForm(EMPTY_FORM)
      onAssigned()
    } catch (ex) {
      const msg = ex?.body?.detail || JSON.stringify(ex?.body) || "Failed to assign task."
      setErr(msg)
    } finally { setBusy(false) }
  }

  return (
    <div className="assignPanel">
      <div className="assignPanelHeader">
        <span className="assignPanelIcon">📋</span>
        <div>
          <div className="assignPanelTitle">Assign New Task</div>
          <div className="assignPanelSub">Allocate work to any employee</div>
        </div>
      </div>

      <form className="stack" onSubmit={submit}>
        {err && <div className="errorBox">{err}</div>}

        {/* Employee selector */}
        <div className="punchField">
          <label className="punchFieldLabel">Assign To *</label>
          <select className="input" value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} required>
            <option value="">— Select employee —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name || emp.username} {emp.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid2Tight">
          {/* Category */}
          <div className="punchField">
            <label className="punchFieldLabel">Category</label>
            <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {/* Priority */}
          <div className="punchField">
            <label className="punchFieldLabel">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="punchField">
          <label className="punchFieldLabel">Task Title *</label>
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Fix wiring in Block B, Room 204" required />
        </div>

        {/* Description */}
        <div className="punchField">
          <label className="punchFieldLabel">Description</label>
          <textarea className="input textarea" rows={2} value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Detailed instructions for the employee…" />
        </div>

        <div className="grid2Tight">
          {/* Due date */}
          <div className="punchField">
            <label className="punchFieldLabel">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
          {/* Estimated hours */}
          <div className="punchField">
            <label className="punchFieldLabel">Est. Hours</label>
            <input className="input" type="number" min="0.5" step="0.5" value={form.estimated_hours}
              onChange={(e) => set("estimated_hours", e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div className="punchField">
          <label className="punchFieldLabel">Work Location</label>
          <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Building A, Floor 2 or GPS address" />
        </div>

        {/* Admin note */}
        <div className="punchField">
          <label className="punchFieldLabel">Note for Employee</label>
          <input className="input" value={form.admin_notes} onChange={(e) => set("admin_notes", e.target.value)}
            placeholder="Any special instructions…" />
        </div>

        <Button type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Assigning…" : "✅ Assign Task"}
        </Button>
      </form>
    </div>
  )
}

// ─── Admin: All Tasks Table ───────────────────────────────────
function AdminTasksTable({ tasks, employees, onDelete, onRefresh }) {
  const [busy, setBusy] = useState(false)

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return
    setBusy(true)
    try { await apiRequest(`/tasks/admin/${id}/`, { method: "DELETE" }); onRefresh() }
    catch { /* ignore */ }
    finally { setBusy(false) }
  }

  function empName(id) {
    const e = employees.find((x) => x.id === id)
    return e ? (e.first_name || e.username) + " " + (e.last_name || "") : id
  }

  return (
    <div className="table">
      <div className="tableRow tableHead" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px" }}>
        <div>Task</div>
        <div>Employee</div>
        <div>Category</div>
        <div>Due</div>
        <div>Status</div>
        <div />
      </div>
      {tasks.length === 0 && <div className="muted" style={{ padding: "20px 0", textAlign: "center" }}>No tasks yet.</div>}
      {tasks.map((t) => (
        <div key={t.id} className="tableRow" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
            {t.location && <div className="addressText">📍 {t.location}</div>}
          </div>
          <div style={{ fontSize: 12.5 }}>{empName(t.assigned_to)}</div>
          <div style={{ fontSize: 12 }}>{categoryLabel(t.category)}</div>
          <div style={{ fontSize: 12 }}>{t.due_date}</div>
          <div><Pill tone={statusTone(t.status)}>{statusLabel(t.status)}</Pill></div>
          <div>
            <button
              className="taskDeleteBtn"
              onClick={() => deleteTask(t.id)}
              disabled={busy}
              type="button"
              title="Delete task"
            >🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main TasksPage ───────────────────────────────────────────
export function TasksPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [tasks,     setTasks]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busy,      setBusy]      = useState(false)
  const [error,     setError]     = useState("")
  const [filter,    setFilter]    = useState("all")
  const [adminTab,  setAdminTab]  = useState("assign")   // "assign" | "all"

  async function loadTasks() {
    setLoading(true); setError("")
    try {
      const url  = isAdmin ? "/tasks/admin/" : "/tasks/my/"
      const data = await apiRequest(url)
      setTasks(Array.isArray(data) ? data : unwrapResults(data))
    } catch (e) { setError(e?.body?.detail || "Failed to load tasks.") }
    finally { setLoading(false) }
  }

  async function loadEmployees() {
    if (!isAdmin) return
    try {
      const data = await apiRequest("/employees/")
      setEmployees(Array.isArray(data) ? data : unwrapResults(data))
    } catch { /* ignore */ }
  }

  useEffect(() => { loadTasks(); loadEmployees() }, [])

  async function handleAction(taskId, action, body = {}) {
    setBusy(true)
    try {
      await apiRequest(`/tasks/my/${taskId}/${action}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      await loadTasks()
    } catch (e) { setError(e?.body?.detail || "Action failed.") }
    finally { setBusy(false) }
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  const today    = new Date().toISOString().slice(0, 10)
  const todayTasks   = tasks.filter((t) => t.due_date === today)
  const pendingCount = tasks.filter((t) => t.status === "pending").length
  const inProgCount  = tasks.filter((t) => t.status === "in_progress").length
  const doneCount    = tasks.filter((t) => t.status === "completed").length

  return (
    <div className="stackLg">
      {/* Header */}
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Tasks</h1>
          <div className="pageSub">
            {isAdmin ? "Assign and track work orders across your team" : "Your assigned work orders for today and upcoming"}
          </div>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {/* ── Summary stats ── */}
      <div className="grid3" style={{ gap: 10 }}>
        <div className="miniMetric">
          <div className="miniValue">{todayTasks.length}</div>
          <div className="miniLabel">Today's Tasks</div>
        </div>
        <div className="miniMetric">
          <div className="miniValue" style={{ color: "var(--warn)" }}>{inProgCount}</div>
          <div className="miniLabel">In Progress</div>
        </div>
        <div className="miniMetric">
          <div className="miniValue" style={{ color: "var(--good)" }}>{doneCount}</div>
          <div className="miniLabel">Completed</div>
        </div>
      </div>

      {/* ── Admin panel: assign + view all ── */}
      {isAdmin && (
        <div className="adminTaskLayout">
          {/* Left: assign form */}
          <AssignTaskPanel employees={employees} onAssigned={() => loadTasks()} />

          {/* Right: all tasks */}
          <div className="adminTaskRight">
            <div className="taskTabRow">
              <button
                className={`taskTab ${adminTab === "assign" ? "taskTabActive" : ""}`}
                onClick={() => setAdminTab("assign")} type="button"
              >All Tasks ({tasks.length})</button>
            </div>
            <AdminTasksTable tasks={tasks} employees={employees} onRefresh={loadTasks} />
          </div>
        </div>
      )}

      {/* ── Employee: filter + task cards ── */}
      <div>
        <div className="taskFilterRow">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={`taskFilterBtn ${filter === f ? "taskFilterActive" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "all" ? "All" : statusLabel(f)}
              {f !== "all" && (
                <span className="taskFilterCount">
                  {tasks.filter((t) => t.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="muted" style={{ padding: "40px 0", textAlign: "center" }}>Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="taskEmpty">
            <div style={{ fontSize: 40 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No tasks</div>
            <div className="muted">
              {filter === "all" ? (isAdmin ? "Create a task to get started." : "You have no assigned tasks.") : `No ${statusLabel(filter).toLowerCase()} tasks.`}
            </div>
          </div>
        ) : (
          <div className="taskGrid">
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t} onAction={handleAction} busy={busy} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
