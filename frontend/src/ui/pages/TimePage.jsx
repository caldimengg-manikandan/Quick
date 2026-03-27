import { useEffect, useMemo, useRef, useState } from "react"

import { apiRequest, unwrapResults } from "../../api/client.js"
import { getAddress, buildMapUrl } from "../../api/geocoding.js"
import { Button, Pill, formatDateTime } from "../components/kit.jsx"

// ─── GPS helpers ──────────────────────────────────────────────
const TARGET_ACCURACY_M = 100
const GPS_TIMEOUT_MS    = 20000

function findOpenLog(logs)  { return logs.find((l) => !l.clock_out) ?? null }
function findOpenBreak(log) {
  if (!log?.breaks) return null
  return log.breaks.find((b) => !b.break_end) ?? null
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

  const [ready,    setReady]    = useState(false)   // camera stream live
  const [captured, setCaptured] = useState(null)    // data URL after snap
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
    ctx.scale(-1, 1)                         // mirror for selfie
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
        {/* Header */}
        <div className="selfieHeader">
          <button className="selfieClose" onClick={onCancel} type="button" aria-label="Close">✕</button>
          <div>
            <h2 className="selfieTitle">Clock in</h2>
            <div className="selfieSubtitle">🕐 {timeStr}, IST</div>
          </div>
        </div>

        {/* Camera ring */}
        <div className="selfieRingWrap">
          <svg className={`selfieRingSvg ${captured ? "ringDone" : ready ? "ringActive" : ""}`} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" className="ringTrack" />
            <circle cx="120" cy="120" r="108" className="ringFill"  />
          </svg>

          <div className="selfieCircle">
            {camError ? (
              <div className="selfieCamError">
                <span style={{ fontSize: 32 }}>📷</span>
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

        {/* Instruction */}
        <div className="selfieInstruction">
          {captured
            ? "Kindly, smile 😊"
            : ready
              ? "Position your face in the circle"
              : camError ? "Camera unavailable" : "Opening camera…"}
        </div>

        {/* Light warning */}
        <div className="selfieWarning">
          <span className="selfieWarnDot">ℹ</span>
          Make sure you are in a place where there is enough light to take a clear photo.
        </div>

        {/* Actions */}
        <div className="selfieActions">
          {captured ? (
            <>
              <button className="selfieBtnOutline" onClick={retake} type="button">Retake</button>
              <button className="selfieBtnPrimary" onClick={onCancel} type="button">✓ Use this photo</button>
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

// ─── Accordion section ────────────────────────────────────────
function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion">
      <button
        className={`accordionBtn ${open ? "accordionOpen" : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="accordionLabel">{title}</span>
        {badge && <span className="accordionBadge">{badge}</span>}
        <span className="accordionChevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="accordionBody">{children}</div>}
    </div>
  )
}

// ─── Main TimePage ────────────────────────────────────────────
export function TimePage() {
  const [logs, setLogs]         = useState([])
  const [timesheet, setTimesheet] = useState(null)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(false)

  // GPS state
  const [resolvedAddr, setResolvedAddr] = useState("")
  const [currentGPS,   setCurrentGPS]   = useState(null)
  const [gpsAccuracy,  setGpsAccuracy]  = useState(null)

  // Form state
  const [sessionNotes, setSessionNotes] = useState("")
  const [sessionPhoto, setSessionPhoto] = useState(null)

  // Selfie state
  const [selfieFile,    setSelfieFile]    = useState(null)   // File for upload
  const [selfiePreview, setSelfiePreview] = useState(null)   // data URL for preview
  const [showSelfie,    setShowSelfie]    = useState(false)  // modal open

  const openLog   = useMemo(() => findOpenLog(logs),   [logs])
  const openBreak = useMemo(() => findOpenBreak(openLog), [openLog])

  // Init GPS on mount
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
      // Fetch logs and timesheets independently so one failure doesn't block the other
      const [logsRes, tsRes] = await Promise.allSettled([
        apiRequest("/time/logs/"),
        apiRequest("/time/timesheets/"),
      ])
      if (logsRes.status === "fulfilled") setLogs(unwrapResults(logsRes.value))
      else setError(logsRes.reason?.body?.detail || "Failed to load time logs.")
      if (tsRes.status === "fulfilled") setTimesheet(tsRes.value)
      // silently ignore timesheet failures (e.g. admin with no employee profile)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function action(path) {
    setBusy(true); setError("")
    try {
      const fd = new FormData()

      if (path.includes("clock-in") || path.includes("clock-out")) {
        // Fresh GPS fix at the moment of punch
        let gps = currentGPS
        try {
          const fresh = await getPosition((acc) => setGpsAccuracy(acc))
          gps = fresh; setCurrentGPS(fresh); setGpsAccuracy(fresh.accuracy)
          if (!resolvedAddr || Math.abs(fresh.lat - (currentGPS?.lat ?? 0)) > 0.0005) {
            const addr = await getAddress(fresh.lat, fresh.lon)
            if (addr) setResolvedAddr(addr)
          }
        } catch (gpsErr) { console.warn("[Clock] GPS refresh failed:", gpsErr) }

        if (gps)         { fd.append("lat", gps.lat); fd.append("lon", gps.lon) }
        if (resolvedAddr)  fd.append("address", resolvedAddr)
        if (sessionNotes)  fd.append("notes",   sessionNotes)
        if (selfieFile)    fd.append("photo",   selfieFile)         // selfie as clock-in photo
        else if (sessionPhoto) fd.append("photo", sessionPhoto)     // or manual attachment
      }

      await apiRequest(path, { method: "POST", body: fd })
      // Reset form
      setSessionNotes(""); setSessionPhoto(null); setSelfieFile(null); setSelfiePreview(null)
      await load()
    } catch (err) {
      const msg =
        err?.body?.detail ||
        (err?.body && typeof err.body === "object"
          ? Object.entries(err.body).map(([k, v]) => `${k}: ${v}`).join("; ")
          : "") || "Action failed."
      setError(msg)
    } finally { setBusy(false) }
  }

  // ── Render ────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <>
      {/* Selfie modal */}
      {showSelfie && (
        <SelfieCapture
          onCapture={(file, preview) => { setSelfieFile(file); setSelfiePreview(preview); setShowSelfie(false) }}
          onCancel={() => setShowSelfie(false)}
        />
      )}

      <div className="stackLg">
        {/* Page header */}
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Time Tracker</h1>
            <div className="pageSub">Secure clock-in &amp; clock-out with location and selfie verification</div>
          </div>
          <div className="pageSub">{today}</div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {/* ── Punch card ── */}
        <div className="punchCard">

          {/* ── Selfie corner preview (appears after capture) ── */}
          {selfiePreview && (
            <div className="selfieCorner" title="Captured selfie — click to retake" onClick={() => setShowSelfie(true)}>
              <img src={selfiePreview} alt="Selfie" />
              <span className="selfieCornerBadge">✓</span>
            </div>
          )}

          {/* Status bar */}
          <div className="punchStatus">
            <div className="punchStatusLeft">
              {openLog ? (
                <div className="row" style={{ gap: 8 }}>
                  <span className="punchDot punchDotGreen" />
                  <span className="punchStatusLabel">Clocked In</span>
                  {openBreak && <Pill tone="warn">On break</Pill>}
                </div>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <span className="punchDot punchDotRed" />
                  <span className="punchStatusLabel">Not Clocked In</span>
                </div>
              )}
            </div>
            {openLog && (
              <div className="punchShiftMeta">
                <span className="metricLabel">Shift started</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDateTime(openLog.clock_in)}</span>
              </div>
            )}
          </div>

          {/* Location strip */}
          <div className="punchLocation">
            <div className="punchLocIcon">📍</div>
            <div className="punchLocBody">
              <div className="punchLocTitle">{resolvedAddr || (gpsAccuracy != null ? "Resolving address…" : "Locating…")}</div>
              {currentGPS && (
                <div className="punchLocCoords">{currentGPS.lat.toFixed(6)}, {currentGPS.lon.toFixed(6)}</div>
              )}
            </div>
            {gpsAccuracy != null && (
              <div className={`accuracyBadge ${gpsAccuracy <= TARGET_ACCURACY_M ? "accuracyGood" : "accuracyWait"}`}>
                {gpsAccuracy <= TARGET_ACCURACY_M ? `✓ ±${gpsAccuracy}m` : `⟳ ±${gpsAccuracy}m`}
              </div>
            )}
          </div>

          {/* Form body */}
          <div className="punchBody">
            {loading ? (
              <div className="muted" style={{ padding: "32px 0", textAlign: "center" }}>Loading…</div>
            ) : openLog ? (
              /* ── CLOCKED IN VIEW ── */
              <div className="stack">
                {openLog.breaks != null && (
                  <div className="punchStats">
                    <div className="punchStatItem">
                      <div className="metricLabel">Shift Start</div>
                      <div className="metricValueSmall">{formatDateTime(openLog.clock_in)}</div>
                    </div>
                    <div className="punchStatItem">
                      <div className="metricLabel">Breaks</div>
                      <div className="metricValueSmall">{openLog.breaks.length} session{openLog.breaks.length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                )}

                {/* Notes on clock-out */}
                <div className="punchField">
                  <label className="punchFieldLabel">Shift Summary / Notes</label>
                  <textarea
                    className="input textarea"
                    placeholder="Describe what you worked on today…"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="punchActions">
                  {!openBreak ? (
                    <Button variant="ghost" disabled={busy} onClick={() => action("/time/break/start/")}>
                      ☕ Start Break
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled={busy} onClick={() => action("/time/break/end/")}>
                      ▶ Resume Work
                    </Button>
                  )}
                  <Button variant="danger" disabled={busy} onClick={() => action("/time/clock-out/")}>
                    {busy ? "Processing…" : "🔴 Clock Out"}
                  </Button>
                </div>
              </div>

            ) : (
              /* ── CLOCK IN VIEW ── */
              <div className="stack">
                {/* Selfie row */}
                <div className="punchSelfieRow">
                  <div className="punchSelfieLabel">
                    <span className="punchSelfieIcon">🤳</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--fg)" }}>Capture Selfie</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Required for verification</div>
                    </div>
                  </div>
                  <div className="punchSelfieRight">
                    {selfiePreview ? (
                      <button className="punchSelfieRetakeChip" onClick={() => setShowSelfie(true)} type="button">
                        🔄 Retake
                      </button>
                    ) : (
                      <button className="punchSelfieBtn" onClick={() => setShowSelfie(true)} type="button">
                        Open Camera
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="punchField">
                  <label className="punchFieldLabel">What are you working on?</label>
                  <textarea
                    className="input textarea"
                    placeholder="Enter today's task or project details…"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Photo attachment (optional) */}
                <div className="punchField">
                  <label className="punchFieldLabel">
                    Photo Attachment
                    <span className="punchOptional">&#33; optional</span>
                  </label>
                  <label className="punchFileLabel">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSessionPhoto(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                    <span className="punchFileInner">
                      <span>📎</span>
                      <span>{sessionPhoto ? sessionPhoto.name : "Choose a file…"}</span>
                    </span>
                  </label>
                </div>

                {/* Clock In */}
                <div className="punchActions">
                  <button
                    className="punchClockInBtn"
                    disabled={busy || !resolvedAddr}
                    onClick={() => action("/time/clock-in/")}
                    type="button"
                  >
                    {busy ? "Clocking in…" : "▶  Clock In"}
                  </button>
                </div>

                {!resolvedAddr && (
                  <div className="punchGpsHint">⏳ Waiting for GPS lock before clock-in is enabled…</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Accordion: Recent Logs ── */}
        <Accordion
          title="Recent Logs"
          badge={logs.length ? `${logs.length} entries` : null}
        >
          {loading ? (
            <div className="muted">Loading…</div>
          ) : logs.length ? (
            <div className="table">
              <div className="tableRow tableHead">
                <div>Date</div>
                <div>Clock In</div>
                <div>Clock Out</div>
                <div className="right">Hours</div>
              </div>
              {logs.slice(0, 10).map((l) => (
                <div key={l.id} className="tableRow">
                  <div style={{ fontWeight: 500 }}>{l.work_date}</div>
                  <div>
                    <div className="stackTight">
                      <div className="rowTight">
                        <span>{formatDateTime(l.clock_in)}</span>
                        {l.clock_in_photo && (
                          <a href={l.clock_in_photo} target="_blank" rel="noreferrer" className="thumb">📸</a>
                        )}
                      </div>
                      {l.clock_in_address && <span className="addressText">{l.clock_in_address}</span>}
                      {l.clock_in_notes   && <div className="noteQuote">{l.clock_in_notes}</div>}
                    </div>
                  </div>
                  <div>
                    <div className="stackTight">
                      <div className="rowTight">
                        <span>{l.clock_out ? formatDateTime(l.clock_out) : <span className="muted">—</span>}</span>
                        {l.clock_out_photo && (
                          <a href={l.clock_out_photo} target="_blank" rel="noreferrer" className="thumb">📸</a>
                        )}
                      </div>
                      {l.clock_out_address && <span className="addressText">{l.clock_out_address}</span>}
                    </div>
                  </div>
                  <div className="right">
                    <div className="stackTight alignEnd">
                      <span style={{ fontWeight: 600 }}>{l.worked_hours}h</span>
                      <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        {l.clock_in_lat && l.clock_in_lon && (
                          <a href={buildMapUrl(l.clock_in_lat, l.clock_in_lon)} target="_blank" rel="noreferrer"
                            className="mapLinkSmall" title="Clock-in location">📍 In</a>
                        )}
                        {l.clock_out_lat && l.clock_out_lon && (
                          <a href={buildMapUrl(l.clock_out_lat, l.clock_out_lon)} target="_blank" rel="noreferrer"
                            className="mapLinkSmall" title="Clock-out location">📍 Out</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No logs yet.</div>
          )}
        </Accordion>

        {/* ── Accordion: Last 7 Days ── */}
        <Accordion
          title="Last 7 Days Summary"
          badge={timesheet ? `${timesheet.totals?.hours}h total` : null}
        >
          {loading ? (
            <div className="muted">Loading…</div>
          ) : timesheet ? (
            <div className="stack">
              {/* Summary stats */}
              <div className="grid3" style={{ gap: 10 }}>
                <div className="miniMetric">
                  <div className="miniValue">{timesheet.totals?.hours}h</div>
                  <div className="miniLabel">Total Hours</div>
                </div>
                <div className="miniMetric">
                  <div className="miniValue" style={{ color: "var(--warn)" }}>{timesheet.totals?.daily_overtime_hours}h</div>
                  <div className="miniLabel">Daily OT</div>
                </div>
                <div className="miniMetric">
                  <div className="miniValue" style={{ color: "var(--bad)" }}>{timesheet.totals?.weekly_overtime_hours}h</div>
                  <div className="miniLabel">Weekly OT</div>
                </div>
              </div>
              {/* Daily breakdown */}
              <div className="table">
                <div className="tableRow tableHead">
                  <div>Date</div>
                  <div className="right">Hours</div>
                  <div className="right">Overtime</div>
                </div>
                {(timesheet.daily ?? []).map((d) => (
                  <div key={d.date} className="tableRow">
                    <div>{d.date}</div>
                    <div className="right" style={{ fontWeight: 500 }}>{d.hours}h</div>
                    <div className="right" style={{ color: d.overtime_hours > 0 ? "var(--warn)" : "var(--muted)" }}>
                      {d.overtime_hours > 0 ? `+${d.overtime_hours}h` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="muted">No timesheet data.</div>
          )}
        </Accordion>
      </div>
    </>
  )
}
