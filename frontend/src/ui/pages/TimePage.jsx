import { useEffect, useMemo, useRef, useState } from "react"

import { apiRequest, unwrapResults } from "../../api/client.js"
import { getAddress } from "../../api/geocoding.js"
import { formatDateTime } from "../components/kit.jsx"

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
} from "lucide-react"

// ─── GPS helpers ──────────────────────────────────────────────
const TARGET_ACCURACY_M = 100
const GPS_TIMEOUT_MS    = 20000

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
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
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

// ─── Selfie Capture Modal ─────────────────────────────────────
function SelfieCapture({ onCapture, onCancel }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [ready,    setReady]    = useState(false)
  const [captured, setCaptured] = useState(null)
  const [camError, setCamError] = useState("")

  useEffect(() => {
    startCamera()
    return () => stopStream()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setCamError("Camera access denied — please allow camera permission in your browser.")
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const size = 400
    canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    ctx.save()
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, size, size)
    ctx.restore()
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    setCaptured(dataUrl)
    stopStream()
    canvas.toBlob((blob) => {
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" })
      onCapture(file, dataUrl)
    }, "image/jpeg", 0.92)
  }

  function retake() {
    setCaptured(null)
    setReady(false)
    startCamera()
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="selfieOverlay">
      <div className="selfieSheet">
        <div className="selfieHeader">
          <button className="selfieClose" onClick={onCancel} type="button" aria-label="Close">✕</button>
          <div>
            <h2 className="selfieTitle">Verify Identity</h2>
            <div className="selfieSubtitle" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <Clock size={12} /> {timeStr}, IST
            </div>
          </div>
        </div>

        <div className="selfieRingWrap">
          <svg className={`selfieRingSvg ${captured ? "ringDone" : ready ? "ringActive" : ""}`} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" className="ringTrack" />
            <circle cx="120" cy="120" r="108" className="ringFill"  />
          </svg>

          <div className="selfieCircle">
            {camError ? (
              <div className="selfieCamError">
                <Camera size={32} opacity={0.5} />
                <p>{camError}</p>
              </div>
            ) : captured ? (
              <img src={captured} alt="Your selfie" className="selfieImg" />
            ) : (
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="selfieVideo"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div className="selfieInstruction">
          {captured
            ? "Kindly, smile 😊"
            : ready
              ? "Position your face in the circle"
              : camError ? "Camera unavailable" : "Opening camera…"}
        </div>

        <div className="selfieWarning">
          <span className="selfieWarnDot">ℹ</span>
          Make sure you are in a place where there is enough light to take a clear photo.
        </div>

        <div className="selfieActions">
          {captured ? (
            <>
              <button className="selfieBtnOutline" onClick={retake} type="button">
                <RotateCcw size={16} style={{ marginRight: 6 }} /> Retake
              </button>
              <button className="selfieBtnPrimary" onClick={onCancel} type="button">
                <Check size={16} strokeWidth={3} style={{ marginRight: 6 }} /> Use this photo
              </button>
            </>
          ) : (
            <button
              className="selfieBtnPrimary"
              onClick={captureFrame}
              disabled={!ready || !!camError}
              type="button"
            >
              Capture Selfie
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main TimePage ────────────────────────────────────────────
export function TimePage() {
  const [logs, setLogs]           = useState([])
  const [timesheet, setTimesheet] = useState(null)
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(false)
  const [logsOpen, setLogsOpen]   = useState(true)

  // GPS state
  const [resolvedAddr, setResolvedAddr] = useState("")
  const [currentGPS,   setCurrentGPS]   = useState(null)
  const [gpsAccuracy,  setGpsAccuracy]  = useState(null)

  // Form state
  const [sessionNotes, setSessionNotes] = useState("")
  const [sessionPhoto, setSessionPhoto] = useState(null)

  // Selfie state
  const [selfieFile,    setSelfieFile]    = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [showSelfie,    setShowSelfie]    = useState(false)

  const openLog   = useMemo(() => findOpenLog(logs),   [logs])
  const openBreak = useMemo(() => findOpenBreak(openLog), [openLog])

  // Init GPS
  useEffect(() => {
    async function initGPS() {
      try {
        const pos  = await getPosition((acc) => setGpsAccuracy(acc))
        setCurrentGPS(pos)
        setGpsAccuracy(pos.accuracy)
        const addr = await getAddress(pos.lat, pos.lon)
        setResolvedAddr(addr)
      } catch (e) { console.warn("GPS init failed", e) }
    }
    initGPS()
  }, [])

  async function load() {
    setLoading(true); setError("")
    try {
      const [logsRes, tsRes] = await Promise.allSettled([
        apiRequest("/time/logs/"),
        apiRequest("/time/timesheets/"),
      ])
      if (logsRes.status === "fulfilled") setLogs(unwrapResults(logsRes.value))
      if (tsRes.status === "fulfilled") setTimesheet(tsRes.value)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function action(path) {
    setBusy(true); setError("")
    try {
      const fd = new FormData()
      if (path.includes("clock-in") || path.includes("clock-out")) {
        let gps = currentGPS
        try {
          const fresh = await getPosition((acc) => setGpsAccuracy(acc))
          gps = fresh; setCurrentGPS(fresh); setGpsAccuracy(fresh.accuracy)
          const addr = await getAddress(fresh.lat, fresh.lon)
          if (addr) setResolvedAddr(addr)
        } catch (gpsErr) { console.warn("[Clock] GPS refresh failed:", gpsErr) }

        if (gps)          { fd.append("lat", gps.lat); fd.append("lon", gps.lon) }
        if (resolvedAddr)   fd.append("address", resolvedAddr)
        if (sessionNotes)   fd.append("notes",   sessionNotes)
        if (selfieFile)     fd.append("photo",   selfieFile)
        else if (sessionPhoto) fd.append("photo", sessionPhoto)
      }

      await apiRequest(path, { method: "POST", body: fd })
      setSessionNotes(""); setSessionPhoto(null); setSelfieFile(null); setSelfiePreview(null)
      await load()
    } catch (err) {
      setError("Action failed. Please try again.")
    } finally { setBusy(false) }
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <>
      {showSelfie && (
        <SelfieCapture
          onCapture={(file, preview) => { setSelfieFile(file); setSelfiePreview(preview); setShowSelfie(false) }}
          onCancel={() => setShowSelfie(false)}
        />
      )}

      <div className="tp-layout">
        {/* ── Page Header ── */}
        <div className="tp-header">
          <div>
            <h1 className="tp-title">Time Tracker</h1>
            <div className="tp-secure">
              <CheckCircle2 size={13} /> Secure Verification
            </div>
          </div>
          <div className="tp-date">{today}</div>
        </div>

        {error && <div className="tp-error">{error}</div>}

        {/* ── Status Card ── */}
        <div className="tp-card tp-status-card">
          <div className="tp-status-row">
            {/* Left: clock status */}
            <div className="tp-status-left">
              <span className={`tp-dot ${openLog ? "tp-dot--green" : "tp-dot--red"}`} />
              <div>
                <div className="tp-status-label">{openLog ? "Clocked In" : "Not Clocked In"}</div>
                <div className="tp-status-sub">{openLog ? "Logged duty active" : "Your shift hasn't started yet"}</div>
              </div>
            </div>

            {/* Center: location */}
            <div className="tp-status-loc">
              <MapPin size={14} color="#9CA3AF" />
              <div>
                <div className="tp-loc-name">{resolvedAddr || "Waiting for GPS…"}</div>
                {currentGPS && (
                  <div className="tp-loc-coords">{currentGPS.lat.toFixed(6)}, {currentGPS.lon.toFixed(6)}</div>
                )}
              </div>
            </div>

            {/* Right: GPS accuracy */}
            <div className="tp-accuracy">
              <AlertCircle size={12} />
              ±{gpsAccuracy || 0}m
            </div>
          </div>
        </div>

        {/* ── Action Card ── */}
        <div className="tp-card tp-action-card">
          {loading ? (
            <div className="tp-loading"><Loader2 className="spin" size={20} /> Synchronizing…</div>
          ) : openLog ? (
            /* ── CLOCKED IN VIEW ── */
            <div className="tp-form">
              <div className="tp-clocked-meta">
                <div className="tp-meta-item">
                  <div className="tp-meta-label">SHIFT STARTED</div>
                  <div className="tp-meta-value">{formatDateTime(openLog.clock_in).split(',')[1]}</div>
                </div>
                <div className="tp-meta-item">
                  <div className="tp-meta-label">BREAKS TAKEN</div>
                  <div className="tp-meta-value">{openLog.breaks?.length || 0} Sessions</div>
                </div>
              </div>

              <div className="tp-field">
                <label className="tp-field-label"><Clock size={13} /> Current Task Summary</label>
                <textarea
                  className="tp-textarea"
                  placeholder="Enter what you have accomplished so far…"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="tp-actions">
                {!openBreak ? (
                  <button className="tp-btn tp-btn--secondary" onClick={() => action("/time/break/start/")}>
                    <Coffee size={16} /> Take Break
                  </button>
                ) : (
                  <button className="tp-btn tp-btn--warning" onClick={() => action("/time/break/end/")}>
                    <Play size={16} /> Resume Work
                  </button>
                )}
                <button className="tp-btn tp-btn--danger" onClick={() => action("/time/clock-out/")}>
                  <Square size={16} fill="currentColor" /> Clock Out
                </button>
              </div>
            </div>
          ) : (
            /* ── CLOCK IN VIEW ── */
            <div className="tp-form">
              {/* Selfie row */}
              <div className="tp-selfie-row" onClick={() => setShowSelfie(true)}>
                <div className="tp-selfie-left">
                  <div className="tp-cam-icon">
                    {selfiePreview
                      ? <img src={selfiePreview} alt="selfie" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                      : <Camera size={22} color="#6366F1" />}
                  </div>
                  <div>
                    <div className="tp-selfie-title">Capture Selfie</div>
                    <div className="tp-selfie-sub">Required for clock-in verification</div>
                  </div>
                </div>
                <button
                  className="tp-open-camera-btn"
                  onClick={(e) => { e.stopPropagation(); setShowSelfie(true) }}
                >
                  <Camera size={13} />
                  {selfiePreview ? "Retake Selfie" : "Open Camera"}
                </button>
              </div>

              {/* Task notes */}
              <div className="tp-field">
                <label className="tp-field-label"><Edit3 size={13} /> What are you working on?</label>
                <textarea
                  className="tp-textarea"
                  placeholder="Enter today's task or project details…"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Photo attachment */}
              <div className="tp-attach-wrap">
                <div className="tp-attach-label">
                  <span>Photo Attachment</span>
                  <span className="tp-optional-badge">OPTIONAL</span>
                </div>
                <div
                  className="tp-attach-box"
                  onClick={() => document.getElementById("tp-file-input").click()}
                >
                  <input
                    id="tp-file-input"
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => setSessionPhoto(e.target.files[0])}
                  />
                  <Paperclip size={16} color="#9CA3AF" />
                  <span>{sessionPhoto ? sessionPhoto.name : "Click to choose a file, or drag and drop"}</span>
                </div>
              </div>

              {/* Clock In button */}
              <button
                className="tp-clock-in-btn"
                disabled={busy || !resolvedAddr}
                onClick={() => action("/time/clock-in/")}
              >
                {busy ? <Loader2 className="spin" size={18} /> : "Clock In"}
              </button>
            </div>
          )}
        </div>

        {/* ── Recent Logs ── */}
        <div className="tp-logs">
          <div className="tp-logs-header">
            <h2 className="tp-logs-title">Recent Logs</h2>
            <div className="tp-logs-meta">
              <span className="tp-logs-badge">{logs.length} entries</span>
              <button
                className="tp-logs-chevron"
                onClick={() => setLogsOpen(v => !v)}
                aria-label="toggle logs"
              >
                <ChevronUp size={16} style={{ transform: logsOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
              </button>
            </div>
          </div>

          {logsOpen && (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>CLOCK IN</th>
                    <th>CLOCK OUT</th>
                    <th className="right">HOURS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map((l) => (
                    <tr key={l.id}>
                      <td className="tp-td-date">{l.work_date}</td>
                      <td>
                        <div className="tp-time-cell">
                          <span>{formatDateTime(l.clock_in).split(',')[1]?.trim()}</span>
                          {l.clock_in_photo && (
                            <span className="tp-photo-chip"><Camera size={10} /></span>
                          )}
                        </div>
                      </td>
                      <td>
                        {l.clock_out
                          ? <span>{formatDateTime(l.clock_out).split(',')[1]?.trim()}</span>
                          : <span className="tp-pending">Pending</span>}
                      </td>
                      <td className="right">
                        <span className="tp-hours-pill">{formatDuration(l.worked_seconds)}</span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="tp-empty">No logs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
