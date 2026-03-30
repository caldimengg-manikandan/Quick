import { useEffect, useState } from "react"
import { apiRequest, unwrapResults } from "../../api/client.js"
import { useAuth } from "../../state/auth/useAuth.js"
import { Pill } from "../components/kit.jsx"
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Plus, MapPin, AlignLeft, Calendar as CalIcon, Play, Save, Trash2, Tag, Loader2 } from "lucide-react"

// ─── Constants & Helpers ─────────────────────────────────────
const CATEGORIES = [
  { value: "electrician",  label: "Electrician"  },
  { value: "plumber",      label: "Plumber"      },
  { value: "carpenter",    label: "Carpenter"     },
  { value: "hvac",         label: "HVAC"          },
  { value: "maintenance",  label: "Maintenance"   },
  { value: "inspection",   label: "Inspection"    },
  { value: "cleaning",     label: "Cleaning"      },
  { value: "installation", label: "Installation"  },
  { value: "repair",       label: "Repair"         },
  { value: "other",        label: "Other"         },
]

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "#6B7280" },
  { value: "medium", label: "Medium", color: "#2563EB" },
  { value: "high",   label: "High",   color: "#D97706" },
  { value: "urgent", label: "Urgent", color: "#DC2626" },
]

const STATUS_FILTERS = ["all", "pending", "in_progress", "completed", "cancelled"]

function categoryLabel(val) { return CATEGORIES.find(c => c.value === val)?.label ?? val }
function statusTone(s) { return s === "completed" ? "good" : s === "in_progress" ? "warn" : s === "cancelled" ? "bad" : "neutral" }
function statusLabel(s) { return { pending: "Pending", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" }[s] ?? s }
function priorityColor(p) { return PRIORITIES.find(x => x.value === p)?.color ?? "#6B7280" }

const EMPTY_FORM = {
  title: "", description: "", category: "other", priority: "medium",
  assigned_to: "", due_date: new Date().toISOString().slice(0, 10),
  estimated_hours: "1", location: "", admin_notes: "",
}

// ─── Task Card (Employee) ────────────────────────────────────
function TaskCard({ task, onAction, busy }) {
  const [note, setNote] = useState(task.employee_notes || "")
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="tsk-card">
      <div className="tsk-card-head">
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span className="tsk-badge tsk-badge-cat"><Tag size={12}/> {categoryLabel(task.category)}</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor(task.priority), display:"block" }} title={task.priority} />
        </div>
        <Pill tone={statusTone(task.status)}>{statusLabel(task.status)}</Pill>
      </div>

      <div>
        <div className="tsk-card-title">{task.title}</div>
        {task.description && (
          <div className="tsk-card-desc" style={{ marginTop: 8, maxHeight: expanded ? "none" : "2.8em", overflow: "hidden" }}>
            {task.description}
          </div>
        )}
        {task.description && task.description.length > 100 && (
          <button style={{color:"#6366F1", fontSize:12, fontWeight:600, background:"none", border:"none", padding:0, marginTop:4, cursor:"pointer"}} onClick={() => setExpanded(v => !v)}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <div className="tsk-card-meta">
        {task.location && <div className="tsk-card-meta-item"><MapPin size={13}/> {task.location}</div>}
        <div className="tsk-card-meta-item"><CalIcon size={13}/> {task.due_date}</div>
        <div className="tsk-card-meta-item"><Clock size={13}/> {task.estimated_hours}h est.</div>
        {task.actual_hours > 0 && <div className="tsk-card-meta-item"><CheckCircle2 size={13}/> {task.actual_hours}h actual</div>}
      </div>

      {task.admin_notes && (
        <div style={{background:"#FEF3C7", color:"#92400E", padding:"10px 14px", borderRadius:8, fontSize:13}}>
          <strong>Admin note:</strong> {task.admin_notes}
        </div>
      )}

      {task.status !== "completed" && task.status !== "cancelled" && (
        <div style={{borderTop:"1px solid var(--stroke)", margin:"10px -20px -20px", padding:20}}>
          {task.status === "pending" && (
            <button className="tsk-btn tsk-btn-primary" disabled={busy} onClick={() => onAction(task.id, "start")} style={{width:"100%", justifyContent:"center"}}>
              <Play size={15}/> Start Task
            </button>
          )}
          {task.status === "in_progress" && (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <textarea 
                className="tsk-input" 
                rows={2} 
                placeholder="Optional completion notes..." 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
              />
              <div style={{display:"flex", gap:10}}>
                <button className="tsk-btn tsk-btn-outline" style={{flex:1, justifyContent:"center"}} disabled={busy} onClick={() => onAction(task.id, "notes", { employee_notes: note })}>
                  <Save size={15}/> Save Note
                </button>
                <button className="tsk-btn tsk-btn-primary" style={{flex:1.5, justifyContent:"center", background:"#10B981"}} disabled={busy} onClick={() => onAction(task.id, "complete")}>
                  <CheckCircle2 size={15}/> Mark Complete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ADMIN: Assign Panel ─────────────────────────────────────
function AssignTaskPanel({ employees, onAssigned }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState("")

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.assigned_to) return setErr("Please select an employee.")
    if (!form.title.trim()) return setErr("Title is required.")
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
      setErr(ex?.body?.detail || "Failed to assign task.")
    } finally { setBusy(false) }
  }

  return (
    <div className="tsk-panel">
      <div className="tsk-panel-head">
        <div style={{background:"#6366F1", color:"#fff", width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center"}}>
          <Plus size={16}/>
        </div>
        <div className="tsk-panel-title">Assign New Task</div>
      </div>
      <form className="tsk-panel-body" onSubmit={submit}>
        {err && <div style={{color:"#DC2626", fontSize:13, fontWeight:600}}><AlertCircle size={14} style={{verticalAlign:"middle", marginRight:4}}/> {err}</div>}

        <div>
          <label className="tsk-label">Assign To *</label>
          <select className="tsk-input tsk-select" value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} required>
            <option value="">— Select employee —</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.user?.id}>{emp.user?.first_name || emp.user?.username} {emp.user?.last_name || ""}</option>
            ))}
          </select>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div>
            <label className="tsk-label">Category</label>
            <select className="tsk-input tsk-select" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="tsk-label">Priority</label>
            <select className="tsk-input tsk-select" value={form.priority} onChange={e => set("priority", e.target.value)}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="tsk-label">Task Title *</label>
          <input className="tsk-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Fix wiring in Room 204" required />
        </div>

        <div>
          <label className="tsk-label">Description</label>
          <textarea className="tsk-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detailed instructions..." />
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div>
            <label className="tsk-label">Due Date</label>
            <input className="tsk-input" type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
          </div>
          <div>
            <label className="tsk-label">Est. Hours</label>
            <input className="tsk-input" type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={e => set("estimated_hours", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="tsk-label">Work Location</label>
          <input className="tsk-input" value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Building A, Floor 2" />
        </div>

        <button type="submit" className="tsk-btn tsk-btn-primary" disabled={busy} style={{justifyContent:"center", marginTop:8}}>
          {busy ? <Loader2 size={16} className="spin"/> : <CheckCircle2 size={16}/>} Assign Task
        </button>
      </form>
    </div>
  )
}

// ─── ADMIN: All Tasks Table ──────────────────────────────────
function AdminTasksTable({ tasks, employees, onRefresh }) {
  const [busy, setBusy] = useState(false)

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return
    setBusy(true)
    try { await apiRequest(`/tasks/admin/${id}/`, { method: "DELETE" }); onRefresh() }
    catch { /* ignore */ }
    finally { setBusy(false) }
  }

  function getEmp(id) { return employees.find((x) => x.user?.id === id) }

  return (
    <div className="tsk-table-wrap">
      <table className="tsk-table">
        <thead>
          <tr>
            <th>Task Details</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Status</th>
            <th style={{textAlign:"right"}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && <tr><td colSpan={5} style={{textAlign:"center", color:"var(--muted)", padding:40}}>No tasks actively assigned.</td></tr>}
          {tasks.map(t => {
            const emp = getEmp(t.assigned_to)
            return (
              <tr key={t.id} className="tsk-row">
                <td>
                  <div className="tsk-table-title">{t.title}</div>
                  <div className="tsk-table-sub">
                    <span style={{color:priorityColor(t.priority)}}>● {t.priority}</span> · {categoryLabel(t.category)} {t.location && `· 📍 ${t.location}`}
                  </div>
                </td>
                <td>
                  {emp && emp.user ? (
                    <div className="tsk-avatar-wrap">
                      <div className="tsk-avatar">{(emp.user.first_name||emp.user.username||"?").charAt(0).toUpperCase()}</div>
                      <div style={{fontWeight:600}}>{emp.user.first_name||emp.user.username} {emp.user.last_name||""}</div>
                    </div>
                  ) : <span className="muted">Unassigned</span>}
                </td>
                <td style={{fontWeight:500}}>{t.due_date}</td>
                <td><Pill tone={statusTone(t.status)}>{statusLabel(t.status)}</Pill></td>
                <td style={{textAlign:"right"}}>
                  <button style={{background:"none", border:"none", color:"#EF4444", cursor:"pointer", padding:8}} onClick={() => deleteTask(t.id)} disabled={busy} title="Delete">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── ADMIN LAYOUT ────────────────────────────────────────────
function AdminTasksPage({ tasks, employees, loadTasks }) {
  return (
    <div className="tsk-admin-grid">
      <AssignTaskPanel employees={employees} onAssigned={loadTasks} />
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <h2 style={{fontSize:18, fontWeight:700, margin:0}}>All System Tasks</h2>
          <span style={{fontSize:13, fontWeight:600, color:"var(--muted)"}}>{tasks.length} Total</span>
        </div>
        <AdminTasksTable tasks={tasks} employees={employees} onRefresh={loadTasks} />
      </div>
    </div>
  )
}

// ─── EMPLOYEE LAYOUT ─────────────────────────────────────────
function EmployeeTasksPage({ tasks, handleAction, busy }) {
  const [filter, setFilter] = useState("all")
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter)

  return (
    <>
      <div className="tsk-filters">
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`tsk-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All Tasks" : statusLabel(f)}
            {f !== "all" && <span className="tsk-count">{tasks.filter(t => t.status === f).length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:"center", padding:"80px 20px", background:"var(--surface)", border:"1px dashed var(--stroke)", borderRadius:16}}>
          <ClipboardList size={48} color="var(--stroke2)" style={{marginBottom:16}}/>
          <div style={{fontSize:18, fontWeight:700}}>No tasks found</div>
          <div style={{color:"var(--muted)", marginTop:8}}>You're all caught up for now!</div>
        </div>
      ) : (
        <div className="tsk-kanban">
          {filtered.map(t => <TaskCard key={t.id} task={t} onAction={handleAction} busy={busy} />)}
        </div>
      )}
    </>
  )
}

// ─── MAIN ROUTER PAGE ────────────────────────────────────────
export function TasksPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

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
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      await loadTasks()
    } catch (e) { setError(e?.body?.detail || "Action failed.") }
    finally { setBusy(false) }
  }

  return (
    <div className="tsk-layout">
      <div className="tsk-header">
        <div className="tsk-title-group">
          <h1>Tasks & Work Orders</h1>
          <p>{isAdmin ? "Dispatch and monitor work activity across all employees." : "Your personal task feed and execution queue."}</p>
        </div>
      </div>

      {error && (
        <div style={{background:"#FEF2F2", color:"#B91C1C", padding:"16px", borderRadius:"12px", border:"1px solid #FECACA", display:"flex", alignItems:"center", gap:8, fontWeight:600}}>
          <AlertCircle size={18}/> {error}
        </div>
      )}

      {loading ? (
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:80, color:"var(--muted)", gap:10}}>
          <Loader2 className="spin" size={24}/> Syncing tasks...
        </div>
      ) : isAdmin ? (
        <AdminTasksPage tasks={tasks} employees={employees} loadTasks={loadTasks} />
      ) : (
        <EmployeeTasksPage tasks={tasks} handleAction={handleAction} busy={busy} />
      )}
    </div>
  )
}
