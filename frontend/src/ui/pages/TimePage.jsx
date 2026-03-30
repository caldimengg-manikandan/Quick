import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { apiRequest, unwrapResults } from "../../api/client.js"
import { getAddress } from "../../api/geocoding.js"
import { formatDateTime } from "../components/kit.jsx"
import { useAuth } from "../../state/auth/useAuth.js"

import {
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  Play,
  Square,
  Coffee,
  Loader2,
  Paperclip,
  Check,
  RotateCcw,
  Edit3,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Calendar,
  Timer,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  ChevronDown,
  BarChart2,
  Clock3,
} from "lucide-react"

// ─── GPS helpers ──────────────────────────────────────────────
const TARGET_ACCURACY_M = 100
const GPS_TIMEOUT_MS    = 20000
const DAILY_TARGET_HRS  = 8

function findOpenLog(logs)  { return logs.find((l) => !l.clock_out) ?? null }
function findOpenBreak(log) {
  if (!log?.breaks) return null
  return log.breaks.find((b) => !b.break_end) ?? null
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "--:--:--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":")
}

function formatHrMin(seconds) {
  if (!seconds) return "0h 0m"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function getPosition(onProgress) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported.")); return }
    let watchId = null, best = null
    const cleanup = () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId) }
    const timer   = setTimeout(() => { cleanup(); best ? resolve(best) : reject(new Error("GPS timed out.")) }, GPS_TIMEOUT_MS)
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }
        if (onProgress) onProgress(fix.accuracy)
        if (!best || fix.accuracy < best.accuracy) best = fix
        if (fix.accuracy <= TARGET_ACCURACY_M) { clearTimeout(timer); cleanup(); resolve(fix) }
      },
      (err) => { clearTimeout(timer); cleanup(); best ? resolve(best) : reject(err) },
      { enableHighAccuracy: true, maximumAge: 0, timeout: GPS_TIMEOUT_MS }
    )
  })
}

// ─── Hooks ─────────────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function useElapsed(clockInStr) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!clockInStr) { setElapsed(0); return }
    const start = new Date(clockInStr).getTime()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockInStr])
  return elapsed
}

function useBreakTimer(openBreak) {
  const [breakElapsed, setBreakElapsed] = useState(0)
  useEffect(() => {
    if (!openBreak?.break_start) { setBreakElapsed(0); return }
    const start = new Date(openBreak.break_start).getTime()
    const tick = () => setBreakElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openBreak?.break_start])
  return breakElapsed
}

// ─── Sub-components ────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8, style = {} }) {
  return <div className="tp-skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

function StatCard({ icon, label, value, sub, color = "#6366F1", pulse }) {
  return (
    <div className="tp-stat-card">
      <div className="tp-stat-icon" style={{ background: color + "18", color }}>
        {icon}
        {pulse && <span className="tp-stat-pulse" style={{ background: color }} />}
      </div>
      <div className="tp-stat-body">
        <div className="tp-stat-value">{value}</div>
        <div className="tp-stat-label">{label}</div>
        {sub && <div className="tp-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Selfie Capture Modal ─────────────────────────────────────
function SelfieCapture({ onCapture, onCancel }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [ready,    setReady]    = useState(false)
  const [captured, setCaptured] = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)
  const [camError, setCamError] = useState("")

  useEffect(() => { startCamera(); return () => stopStream() }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"user", width:{ideal:640}, height:{ideal:640} }, audio:false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setReady(true) }
    } catch { setCamError("Camera access denied or unavailable.") }
  }
  function stopStream() { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }
  function captureFrame() {
    const [video, canvas] = [videoRef.current, canvasRef.current]
    if (!video || !canvas) return
    const size = 400; canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    ctx.save(); ctx.translate(size, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, size, size); ctx.restore()
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    setCaptured(dataUrl); stopStream()
    canvas.toBlob(blob => {
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type:"image/jpeg" })
      setCapturedFile(file)
    }, "image/jpeg", 0.92)
  }
  function retake() { setCaptured(null); setCapturedFile(null); setReady(false); startCamera() }
  function submitPhoto() {
    if (capturedFile && captured) onCapture(capturedFile, captured)
  }
  const timeStr = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })

  return (
    <div className="selfieOverlay">
      <div className="selfieSheet">
        <div className="selfieHeader">
          <button className="selfieClose" onClick={onCancel} type="button">✕</button>
          <div><h2 className="selfieTitle">Verify Identity</h2><div className="selfieSubtitle" style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}><Clock size={12}/> {timeStr}, IST</div></div>
        </div>
        <div className="selfieRingWrap">
          <svg className={`selfieRingSvg ${captured?"ringDone":ready?"ringActive":""}`} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" className="ringTrack"/><circle cx="120" cy="120" r="108" className="ringFill"/>
          </svg>
          <div className="selfieCircle">
            {camError ? <div className="selfieCamError"><Camera size={32} opacity={0.5}/><p>{camError}</p></div>
              : captured ? <img src={captured} alt="selfie" className="selfieImg"/>
              : <video ref={videoRef} autoPlay muted playsInline className="selfieVideo" style={{transform:"scaleX(-1)"}}/>}
          </div>
          <canvas ref={canvasRef} style={{display:"none"}}/>
        </div>
        <div className="selfieInstruction">{captured?"Kindly, smile 😊":ready?"Position your face in the circle":camError?"Camera unavailable":"Opening camera…"}</div>
        <div className="selfieWarning"><span className="selfieWarnDot">ℹ</span>Make sure you are in a well-lit place.</div>
        <div className="selfieActions">
          {captured ? (
            <><button className="selfieBtnOutline" onClick={retake} type="button"><RotateCcw size={16} style={{marginRight:6}}/> Retake</button>
            <button className="selfieBtnPrimary" onClick={submitPhoto} type="button"><Check size={16} strokeWidth={3} style={{marginRight:6}}/> Use this photo</button></>
          ) : <button className="selfieBtnPrimary" onClick={captureFrame} disabled={!ready||!!camError} type="button">Capture Selfie</button>}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN VIEW
// ═══════════════════════════════════════════════════════════════
function AdminTimePage() {
  const now = useLiveClock()
  const [logs,      setLogs]      = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")

  // Filters
  const todayStr = new Date().toLocaleDateString("en-CA")
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-CA")
  const [filterFrom, setFilterFrom]   = useState(weekAgo)
  const [filterTo,   setFilterTo]     = useState(todayStr)
  const [filterEmp,  setFilterEmp]    = useState("")   // employee id
  const [searchQ,    setSearchQ]      = useState("")
  const [sortField,  setSortField]    = useState("clock_in")
  const [sortDir,    setSortDir]      = useState("desc")
  const [logsOpen,   setLogsOpen]     = useState(true)
  const [statusFilter, setStatusFilter] = useState("all") // all | live | done

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams()
      if (filterFrom) params.set("date_from", filterFrom)
      if (filterTo)   params.set("date_to",   filterTo)
      const [logsRes, empRes] = await Promise.allSettled([
        apiRequest(`/time/logs/?${params}`),
        apiRequest("/employees/"),
      ])
      if (logsRes.status === "fulfilled") setLogs(unwrapResults(logsRes.value))
      if (empRes.status === "fulfilled")  setEmployees(unwrapResults(empRes.value))
    } catch (e) { setError("Failed to load data.") }
    finally { setLoading(false) }
  }, [filterFrom, filterTo])

  useEffect(() => { load() }, [load])

  // ── Derived stats ──
  const todayLogs = useMemo(() => logs.filter(l => l.work_date === todayStr), [logs, todayStr])
  const liveNow   = useMemo(() => todayLogs.filter(l => !l.clock_out), [todayLogs])
  const totalHrs  = useMemo(() => logs.reduce((s, l) => s + (l.worked_seconds || 0), 0), [logs])
  const avgHrs    = useMemo(() => {
    const uniqueEmps = new Set(logs.map(l => l.employee)).size
    return uniqueEmps > 0 ? Math.round(totalHrs / uniqueEmps) : 0
  }, [logs, totalHrs])

  // Per-employee summary for the "who's in" cards
  const empStatus = useMemo(() => {
    const map = {}
    employees.forEach(e => {
      const name = [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || e.user?.username
      map[e.id] = { id: e.id, name, username: e.user?.username, avatarLetter: (name || "?").charAt(0).toUpperCase(), log: null }
    })
    liveNow.forEach(l => { if (map[l.employee]) map[l.employee].log = l })
    return Object.values(map)
  }, [employees, liveNow])

  // ── Filtered + sorted logs ──
  const filteredLogs = useMemo(() => {
    let arr = [...logs]
    if (filterEmp) arr = arr.filter(l => l.employee === filterEmp)
    if (statusFilter === "live") arr = arr.filter(l => !l.clock_out)
    if (statusFilter === "done") arr = arr.filter(l => !!l.clock_out)
    if (searchQ) {
      const q = searchQ.toLowerCase()
      arr = arr.filter(l =>
        (l.employee_name || "").toLowerCase().includes(q) ||
        (l.employee_username || "").toLowerCase().includes(q) ||
        (l.work_date || "").includes(q)
      )
    }
    arr.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === "clock_in" || sortField === "clock_out") {
        va = va ? new Date(va).getTime() : 0
        vb = vb ? new Date(vb).getTime() : 0
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [logs, filterEmp, statusFilter, searchQ, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  return (
    <div className="tp-layout">
      {/* ── Header ── */}
      <div className="tp-header">
        <div>
          <h1 className="tp-title">Attendance Dashboard</h1>
          <div className="tp-secure"><CheckCircle2 size={13}/> Admin Overview — All Employees</div>
        </div>
      </div>

      {error && <div className="tp-error"><AlertCircle size={14}/> {error}</div>}

      {/* ── Summary stats ── */}
      <div className="tp-stats-row">
        <StatCard icon={<Users size={16}/>}      label="Total Employees"  value={loading ? "—" : employees.length}       color="#6366F1"/>
        <StatCard icon={<UserCheck size={16}/>}  label="Clocked In Now"   value={loading ? "—" : liveNow.length}          color="#10B981" pulse={liveNow.length > 0}/>
        <StatCard icon={<UserX size={16}/>}      label="Not Clocked In"   value={loading ? "—" : employees.length - liveNow.length} color="#EF4444"/>
        <StatCard icon={<BarChart2 size={16}/>}  label="Total Hours (range)" value={loading ? "—" : formatHrMin(totalHrs)} color="#F59E0B"/>
        <StatCard icon={<Clock3 size={16}/>}     label="Avg per Employee" value={loading ? "—" : formatHrMin(avgHrs)}      color="#8B5CF6"/>
      </div>

      {/* ── Live status cards (who's in right now) ── */}
      <div className="adm-live-section">
        <div className="adm-live-header">
          <div className="adm-live-dot"/><span>Live — Today's Status</span>
          <span className="adm-live-count">{liveNow.length} active</span>
        </div>
        {loading ? (
          <div className="adm-emp-grid">{[1,2,3,4].map(i => <Skeleton key={i} h={72} r={12}/>)}</div>
        ) : (
          <div className="adm-emp-grid">
            {empStatus.map(e => (
              <div key={e.id} className={`adm-emp-card ${e.log ? "adm-emp-card--in" : "adm-emp-card--out"}`}>
                <div className="adm-emp-card-avatar" style={{ background: e.log ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#9CA3AF,#6B7280)" }}>
                  {e.avatarLetter}
                </div>
                <div className="adm-emp-card-info">
                  <div className="adm-emp-card-name">{e.name}</div>
                  <div className="adm-emp-card-status">
                    {e.log ? (
                      <><span className="adm-live-pill">● Live</span> since {formatDateTime(e.log.clock_in).split(",")[1]?.trim()}</>
                    ) : (
                      <span className="adm-out-pill">Not clocked in</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Logs table ── */}
      <div className="tp-logs">
        <div className="tp-logs-header">
          <div>
            <h2 className="tp-logs-title">Attendance Logs</h2>
            <div className="tp-logs-subtitle">{filterFrom} – {filterTo} · {filteredLogs.length} records</div>
          </div>
          <div className="tp-logs-meta">
            <button className="tp-logs-refresh" onClick={load} title="Refresh"><RefreshCw size={13}/></button>
            <span className="tp-logs-badge">{filteredLogs.length} entries</span>
            <button className="tp-logs-chevron" onClick={() => setLogsOpen(v => !v)}>
              <ChevronUp size={15} style={{ transform: logsOpen ? "rotate(0deg)" : "rotate(180deg)", transition:"transform 0.25s ease" }}/>
            </button>
          </div>
        </div>

        {/* ── Filters row ── */}
        <div className="adm-filters-row">
          {/* Date range */}
          <div className="tp-date-filter-group">
            <label className="tp-date-label">From</label>
            <input id="adm-date-from" type="date" className="tp-date-input" value={filterFrom} max={filterTo}
              onChange={e => setFilterFrom(e.target.value)}/>
          </div>
          <div className="tp-date-filter-sep">→</div>
          <div className="tp-date-filter-group">
            <label className="tp-date-label">To</label>
            <input id="adm-date-to" type="date" className="tp-date-input" value={filterTo} min={filterFrom} max={todayStr}
              onChange={e => setFilterTo(e.target.value)}/>
          </div>

          {/* Quick presets */}
          <button className="tp-date-preset" onClick={() => { setFilterFrom(todayStr); setFilterTo(todayStr) }}>Today</button>
          <button className="tp-date-preset" onClick={() => { setFilterFrom(weekAgo); setFilterTo(todayStr) }}>This Week</button>
          <button className="tp-date-preset" onClick={() => {
            const m = new Date(); m.setDate(1)
            setFilterFrom(m.toLocaleDateString("en-CA")); setFilterTo(todayStr)
          }}>This Month</button>

          {/* Employee dropdown */}
          <div className="adm-select-wrap">
            <Filter size={13} color="#9CA3AF"/>
            <select className="adm-select" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {[e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || e.user?.username}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color="#9CA3AF"/>
          </div>

          {/* Status filter */}
          <div className="adm-status-tabs">
            {["all","live","done"].map(s => (
              <button key={s} className={`adm-status-tab ${statusFilter === s ? "adm-status-tab--active" : ""}`}
                onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All" : s === "live" ? "● Live" : "Completed"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="adm-search-wrap">
            <Search size={13} color="#9CA3AF"/>
            <input className="adm-search" placeholder="Search employee…" value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
          </div>
        </div>

        {logsOpen && (
          <div className="tp-table-wrap">
            {loading ? (
              <div style={{padding:24,display:"flex",flexDirection:"column",gap:12}}>
                {[1,2,3,4].map(i => <Skeleton key={i} h={24}/>)}
              </div>
            ) : (
              <table className="tp-table adm-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th className="adm-sortable" onClick={() => toggleSort("work_date")}>
                      DATE {sortField==="work_date" && (sortDir==="asc" ? "↑" : "↓")}
                    </th>
                    <th className="adm-sortable" onClick={() => toggleSort("clock_in")}>
                      CLOCK IN {sortField==="clock_in" && (sortDir==="asc" ? "↑" : "↓")}
                    </th>
                    <th className="adm-sortable" onClick={() => toggleSort("clock_out")}>
                      CLOCK OUT {sortField==="clock_out" && (sortDir==="asc" ? "↑" : "↓")}
                    </th>
                    <th>BREAKS</th>
                    <th className="right adm-sortable" onClick={() => toggleSort("worked_seconds")}>
                      HOURS {sortField==="worked_seconds" && (sortDir==="asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(l => (
                    <AdminLogRow key={l.id} log={l}/>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={6} className="tp-empty">No records found for the selected filters</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Admin table row with live elapsed ────────────────────────
function AdminLogRow({ log }) {
  const elapsed = useElapsed(log.clock_out ? null : log.clock_in)
  const completedBreaks = (log.breaks || []).filter(b => b.break_end)
  const totalBreakSecs  = completedBreaks.reduce((s, b) => s + (b.duration_seconds || 0), 0)
  const isLive = !log.clock_out

  return (
    <tr className={isLive ? "adm-row-live" : ""}>
      <td>
        <div className="tp-emp-cell">
          <div className="tp-emp-avatar"
            style={{ background: isLive ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            {(log.employee_name || log.employee_username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="tp-emp-name">{log.employee_name || log.employee_username || "Unknown"}</div>
            {log.employee_username && log.employee_name && (
              <div className="tp-emp-username">@{log.employee_username}</div>
            )}
          </div>
        </div>
      </td>
      <td className="tp-td-date">{log.work_date}</td>
      <td>
        <div className="tp-time-cell">
          <span>{formatDateTime(log.clock_in).split(",")[1]?.trim()}</span>
          {log.clock_in_photo && (
            <a href={log.clock_in_photo} target="_blank" rel="noreferrer" className="tp-photo-chip tp-photo-chip--link" title="View verification photo">
              <Camera size={10}/>
            </a>
          )}
        </div>
      </td>
      <td>
        {isLive
          ? <span className="tp-pending-badge">● Live</span>
          : <span>{formatDateTime(log.clock_out).split(",")[1]?.trim()}</span>}
      </td>
      <td>
        {completedBreaks.length > 0 ? (
          <div className="adm-break-cell">
            <span className="adm-break-count">{completedBreaks.length}×</span>
            <span className="adm-break-total">{formatDuration(totalBreakSecs)}</span>
          </div>
        ) : <span className="adm-no-break">—</span>}
      </td>
      <td className="right">
        <span className={`tp-hours-pill ${isLive ? "tp-hours-pill--live" : ""}`}>
          {isLive ? formatDuration(elapsed) : formatDuration(log.worked_seconds)}
        </span>
      </td>
    </tr>
  )
}

// ═══════════════════════════════════════════════════════════════
//  EMPLOYEE VIEW (same as before)
// ═══════════════════════════════════════════════════════════════
function EmployeeTimePage() {
  const { user } = useAuth()
  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "Employee"

  const [logs, setLogs]           = useState([])
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(false)
  const [logsOpen, setLogsOpen]   = useState(true)
  const [gpsStatus, setGpsStatus] = useState("locating")

  const todayStr = new Date().toLocaleDateString("en-CA")
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-CA")
  const [filterFrom, setFilterFrom] = useState(weekAgo)
  const [filterTo,   setFilterTo]   = useState(todayStr)

  const [resolvedAddr, setResolvedAddr] = useState("")
  const [currentGPS,   setCurrentGPS]   = useState(null)
  const [gpsAccuracy,  setGpsAccuracy]  = useState(null)

  const [sessionNotes, setSessionNotes] = useState("")
  const [sessionPhoto, setSessionPhoto] = useState(null)
  const [selfieFile,    setSelfieFile]    = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [showSelfie,    setShowSelfie]    = useState(false)

  const now        = useLiveClock()
  const openLog    = useMemo(() => findOpenLog(logs),      [logs])
  const openBreak  = useMemo(() => findOpenBreak(openLog), [openLog])
  const elapsed    = useElapsed(openLog?.clock_in)
  const breakElapsed = useBreakTimer(openBreak)

  const completedBreaks = useMemo(() => (openLog?.breaks || []).filter(b => b.break_end), [openLog])
  const totalBreakSecs  = useMemo(() => completedBreaks.reduce((s, b) => s + (b.duration_seconds || 0), 0), [completedBreaks])

  const weekStats = useMemo(() => {
    const total = logs.reduce((s, l) => s + (l.worked_seconds || 0), 0)
    const days  = new Set(logs.map(l => l.work_date)).size
    return { total, days, avg: days > 0 ? Math.round(total / days) : 0 }
  }, [logs])

  const todayLog = useMemo(() => logs.find(l => l.work_date === todayStr), [logs, todayStr])
  const todayPct = Math.min(100, Math.round(((todayLog?.worked_seconds || 0) / (DAILY_TARGET_HRS * 3600)) * 100))

  useEffect(() => {
    async function initGPS() {
      try {
        const pos = await getPosition(acc => { setGpsAccuracy(acc); setGpsStatus("locating") })
        setCurrentGPS(pos); setGpsAccuracy(pos.accuracy); setGpsStatus("ok")
        const addr = await getAddress(pos.lat, pos.lon)
        setResolvedAddr(addr)
      } catch { setGpsStatus("error") }
    }
    initGPS()
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams()
      if (filterFrom) params.set("date_from", filterFrom)
      if (filterTo)   params.set("date_to",   filterTo)
      const [logsRes] = await Promise.allSettled([apiRequest(`/time/logs/?${params}`)])
      if (logsRes.status === "fulfilled") setLogs(unwrapResults(logsRes.value))
    } finally { setLoading(false) }
  }, [filterFrom, filterTo])
  useEffect(() => { load() }, [load])

  async function action(path) {
    setBusy(true); setError("")
    try {
      const fd = new FormData()
      if (path.includes("clock-in") || path.includes("clock-out")) {
        let gps = currentGPS
        try {
          const fresh = await getPosition(acc => setGpsAccuracy(acc))
          gps = fresh; setCurrentGPS(fresh); setGpsAccuracy(fresh.accuracy); setGpsStatus("ok")
          const addr = await getAddress(fresh.lat, fresh.lon)
          if (addr) setResolvedAddr(addr)
        } catch {}
        if (gps)           { fd.append("lat", gps.lat); fd.append("lon", gps.lon) }
        if (resolvedAddr)    fd.append("address", resolvedAddr)
        if (sessionNotes)    fd.append("notes",   sessionNotes)
        if (selfieFile)      fd.append("photo",   selfieFile)
        else if (sessionPhoto) fd.append("photo", sessionPhoto)
      }
      await apiRequest(path, { method:"POST", body:fd })
      setSessionNotes(""); setSessionPhoto(null); setSelfieFile(null); setSelfiePreview(null)
      await load()
    } catch { setError("Action failed. Please try again.") }
    finally { setBusy(false) }
  }

  return (
    <>
      {showSelfie && (
        <SelfieCapture
          onCapture={(file, preview) => { setSelfieFile(file); setSelfiePreview(preview); setShowSelfie(false) }}
          onCancel={() => setShowSelfie(false)}
        />
      )}

      <div className="tp-layout">
        {/* Header */}
        <div className="tp-header">
          <div>
            <h1 className="tp-title">Time Tracker</h1>
            <div className="tp-secure"><CheckCircle2 size={13}/> Secure Verification</div>
          </div>
        </div>

        {error && <div className="tp-error"><AlertCircle size={14}/> {error}</div>}

<div className="tp-content-grid">
          <div className="tp-content-main">
        {/* Status Card */}
        <div className="tp-card tp-status-card">
          <div className="tp-status-row">
            <div className="tp-status-left">
              <span className={`tp-dot ${openLog ? "tp-dot--green" : "tp-dot--red"}`}/>
              <div>
                <div className="tp-status-label">{openLog ? "Clocked In" : "Not Clocked In"}</div>
                <div className="tp-status-sub">
                  {openLog ? `Since ${formatDateTime(openLog.clock_in).split(",")[1]?.trim()}` : "Your shift hasn't started yet"}
                </div>
              </div>
            </div>
            <div className="tp-status-loc">
              <MapPin size={14} color="#9CA3AF" style={{flexShrink:0,marginTop:2}}/>
              <div style={{minWidth:0}}>
                <div className="tp-loc-name">{resolvedAddr || "Locating…"}</div>
                {currentGPS && <div className="tp-loc-coords">{currentGPS.lat.toFixed(6)}, {currentGPS.lon.toFixed(6)}</div>}
              </div>
            </div>
            <div className={`tp-accuracy tp-accuracy--${gpsStatus}`}>
              {gpsStatus==="ok"       && <><Wifi size={11}/> ±{gpsAccuracy}m</>}
              {gpsStatus==="locating" && <><Loader2 size={11} className="spin"/> Locating</>}
              {gpsStatus==="error"    && <><WifiOff size={11}/> No GPS</>}
            </div>
          </div>
          {!loading && (
            <div className="tp-progress-wrap">
              <div className="tp-progress-labels">
                <span>Today's Progress</span>
                <span>{formatHrMin(todayLog?.worked_seconds || 0)} / {DAILY_TARGET_HRS}h target</span>
              </div>
              <div className="tp-progress-track"><div className="tp-progress-fill" style={{width:`${todayPct}%`}}/></div>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className="tp-stats-row">
            <StatCard icon={<TrendingUp size={16}/>} label="Hours This Week" value={formatHrMin(weekStats.total)} color="#6366F1"/>
            <StatCard icon={<Calendar size={16}/>}   label="Days Worked"     value={`${weekStats.days} days`}     color="#10B981"/>
            <StatCard icon={<Timer size={16}/>}      label="Daily Average"   value={formatHrMin(weekStats.avg)}   color="#F59E0B"/>
            {openLog && <StatCard icon={<Clock size={16}/>} label="Current Session" value={formatDuration(elapsed)} color="#EF4444"/>}
          </div>
        )}

        {/* Recent Logs */}
        <div className="tp-logs">
          <div className="tp-logs-header">
            <div>
              <h2 className="tp-logs-title">Recent Logs</h2>
              <div className="tp-logs-subtitle">{filterFrom} – {filterTo} · {logs.length} entries</div>
            </div>
            <div className="tp-logs-meta">
              <span className="tp-logs-badge">{logs.length} entries</span>
              <button className="tp-logs-chevron" onClick={() => setLogsOpen(v => !v)}>
                <ChevronUp size={15} style={{transform:logsOpen?"rotate(0deg)":"rotate(180deg)",transition:"transform 0.25s ease"}}/>
              </button>
            </div>
          </div>

          <div className="tp-date-filter">
            <div className="tp-date-filter-group">
              <label className="tp-date-label">From</label>
              <input id="emp-date-from" type="date" className="tp-date-input" value={filterFrom} max={filterTo} onChange={e => setFilterFrom(e.target.value)}/>
            </div>
            <div className="tp-date-filter-sep">→</div>
            <div className="tp-date-filter-group">
              <label className="tp-date-label">To</label>
              <input id="emp-date-to" type="date" className="tp-date-input" value={filterTo} min={filterFrom} max={todayStr} onChange={e => setFilterTo(e.target.value)}/>
            </div>
            <button className="tp-date-preset" onClick={() => { setFilterFrom(todayStr); setFilterTo(todayStr) }}>Today</button>
            <button className="tp-date-preset" onClick={() => { setFilterFrom(weekAgo); setFilterTo(todayStr) }}>This Week</button>
            <button className="tp-date-preset" onClick={() => { const m=new Date(); m.setDate(1); setFilterFrom(m.toLocaleDateString("en-CA")); setFilterTo(todayStr) }}>This Month</button>
          </div>

          {logsOpen && (
            <div className="tp-table-wrap">
              {loading ? (
                <div style={{padding:24,display:"flex",flexDirection:"column",gap:12}}>{[1,2,3].map(i => <Skeleton key={i} h={20}/>)}</div>
              ) : (
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th><th>DATE</th><th>CLOCK IN</th><th>CLOCK OUT</th><th className="right">HOURS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id}>
                        <td>
                          <div className="tp-emp-cell">
                            <div className="tp-emp-avatar">{(l.employee_name||l.employee_username||"?").charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="tp-emp-name">{l.employee_name||l.employee_username||"Unknown"}</div>
                              {l.employee_username && l.employee_name && <div className="tp-emp-username">@{l.employee_username}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="tp-td-date">{l.work_date}</td>
                        <td>
                          <div className="tp-time-cell">
                            <span>{formatDateTime(l.clock_in).split(",")[1]?.trim()}</span>
                            {l.clock_in_photo && (
                              <a href={l.clock_in_photo} target="_blank" rel="noreferrer" className="tp-photo-chip tp-photo-chip--link" title="View verification photo">
                                <Camera size={10}/>
                              </a>
                            )}
                          </div>
                        </td>
                        <td>{l.clock_out ? <span>{formatDateTime(l.clock_out).split(",")[1]?.trim()}</span> : <span className="tp-pending-badge">● Live</span>}</td>
                        <td className="right">
                          <span className={`tp-hours-pill ${!l.clock_out?"tp-hours-pill--live":""}`}>
                            {!l.clock_out ? formatDuration(elapsed) : formatDuration(l.worked_seconds)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={5} className="tp-empty">No records found for this date range</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
          </div>
          <div className="tp-content-side">
        {/* Action Card */}
        <div className="tp-card tp-action-card">
          {loading ? (
            <div className="tp-form" style={{gap:16}}>
              <Skeleton h={52} r={12}/><Skeleton h={24} w="60%"/><Skeleton h={100} r={10}/><Skeleton h={52} r={10}/><Skeleton h={48} r={10}/>
            </div>
          ) : openLog ? (
            <div className="tp-form">
              <div className="tp-clocked-meta">
                <div className="tp-meta-item">
                  <div className="tp-meta-label">SHIFT STARTED</div>
                  <div className="tp-meta-value">{formatDateTime(openLog.clock_in).split(",")[1]?.trim()}</div>
                </div>
                <div className="tp-meta-item">
                  <div className="tp-meta-label">TIME ELAPSED</div>
                  <div className="tp-meta-value tp-mono">{formatDuration(elapsed)}</div>
                </div>
                <div className="tp-meta-item">
                  <div className="tp-meta-label">BREAKS TAKEN</div>
                  <div className="tp-meta-value">{openLog.breaks?.length || 0} sessions</div>
                </div>
              </div>

              {openBreak && (
                <div className="tp-break-panel">
                  <div className="tp-break-panel-header">
                    <div className="tp-break-live-dot"/>
                    <Coffee size={14}/><span>Currently on break</span>
                    <span className="tp-break-live-timer">{formatDuration(breakElapsed)}</span>
                  </div>
                  <div className="tp-break-panel-sub">
                    Started at {formatDateTime(openBreak.break_start).split(",")[1]?.trim()} · tap <strong>Resume</strong> when ready
                  </div>
                </div>
              )}

              {completedBreaks.length > 0 && (
                <div className="tp-break-history">
                  <div className="tp-break-history-header">
                    <Coffee size={12}/><span>Break History</span>
                    <span className="tp-break-history-total">Total: {formatDuration(totalBreakSecs)}</span>
                  </div>
                  {completedBreaks.map((b, i) => (
                    <div key={b.id || i} className="tp-break-row">
                      <span className="tp-break-num">#{i+1}</span>
                      <span className="tp-break-time">
                        {formatDateTime(b.break_start).split(",")[1]?.trim()} → {formatDateTime(b.break_end).split(",")[1]?.trim()}
                      </span>
                      <span className="tp-break-dur">{formatDuration(b.duration_seconds)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="tp-field">
                <label className="tp-field-label"><Edit3 size={13}/> Current Task Summary</label>
                <textarea className="tp-textarea" placeholder="What have you accomplished so far…" value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3}/>
              </div>

              <div className="tp-actions">
                {!openBreak ? (
                  <button className="tp-btn tp-btn--secondary" disabled={busy} onClick={() => action("/time/break/start/")}>
                    {busy ? <Loader2 size={15} className="spin"/> : <Coffee size={15}/>} Take Break
                  </button>
                ) : (
                  <button className="tp-btn tp-btn--warning" disabled={busy} onClick={() => action("/time/break/end/")}>
                    {busy ? <Loader2 size={15} className="spin"/> : <Play size={15}/>} Resume Work
                  </button>
                )}
                <button className="tp-btn tp-btn--danger" disabled={busy} onClick={() => action("/time/clock-out/")}>
                  {busy ? <Loader2 size={15} className="spin"/> : <Square size={15} fill="currentColor"/>} Clock Out
                </button>
              </div>
            </div>
          ) : (
            <div className="tp-form">
              <div className="tp-selfie-row" onClick={() => setShowSelfie(true)}>
                <div className="tp-selfie-left">
                  <div className="tp-cam-icon">
                    {selfiePreview
                      ? <img src={selfiePreview} alt="selfie" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>
                      : <Camera size={22} color="#6366F1"/>}
                  </div>
                  <div>
                    <div className="tp-selfie-title">{selfiePreview ? <><Check size={13} style={{color:"#10B981",marginRight:4}}/>Selfie Captured</> : "Capture Selfie"}</div>
                    <div className="tp-selfie-sub">{selfiePreview ? "Tap to retake" : "Required for clock-in verification"}</div>
                  </div>
                </div>
                <button className={`tp-open-camera-btn ${selfiePreview?"tp-open-camera-btn--done":""}`} onClick={e => { e.stopPropagation(); setShowSelfie(true) }}>
                  <Camera size={13}/> {selfiePreview ? "Retake" : "Open Camera"}
                </button>
              </div>

              <div className="tp-field">
                <label className="tp-field-label"><Edit3 size={13}/> What are you working on?</label>
                <textarea className="tp-textarea" placeholder="Enter today's task or project details…" value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={4}/>
              </div>

              <div className="tp-attach-wrap">
                <div className="tp-attach-label"><span>Photo Attachment</span><span className="tp-optional-badge">OPTIONAL</span></div>
                <label className="tp-attach-box" htmlFor="tp-file-input">
                  <input id="tp-file-input" type="file" style={{display:"none"}} onChange={e => setSessionPhoto(e.target.files[0])}/>
                  <Paperclip size={16} color={sessionPhoto?"#6366F1":"#9CA3AF"}/>
                  <span style={{color:sessionPhoto?"#6366F1":"inherit"}}>{sessionPhoto ? sessionPhoto.name : "Click to choose a file, or drag and drop"}</span>
                  {sessionPhoto && <RefreshCw size={13} color="#9CA3AF" style={{marginLeft:"auto"}}/>}
                </label>
              </div>

              {!resolvedAddr && gpsStatus!=="error" && (
                <div className="tp-gps-hint"><Loader2 size={13} className="spin"/> Waiting for GPS lock before you can clock in…</div>
              )}
              {gpsStatus==="error" && (
                <div className="tp-gps-hint tp-gps-hint--err"><WifiOff size={13}/> GPS unavailable — location will not be recorded.</div>
              )}

              <button className="tp-clock-in-btn" disabled={busy || (!resolvedAddr && gpsStatus!=="error")} onClick={() => action("/time/clock-in/")}>
                {busy ? <Loader2 className="spin" size={18}/> : "Clock In"}
              </button>
            </div>
          )}
        </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ROUTER: admin vs employee
// ═══════════════════════════════════════════════════════════════
export function TimePage() {
  const { user } = useAuth()
  return user?.role === "admin" ? <AdminTimePage/> : <EmployeeTimePage/>
}
