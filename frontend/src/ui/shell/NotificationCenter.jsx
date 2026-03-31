import { useState, useRef, useEffect } from "react"
import { Bell, CheckSquare, Clock, ArrowRight } from "lucide-react"

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button 
        className="btn btnGhost" 
        onClick={() => setOpen(!open)}
        style={{ padding: 8, position: "relative", background: open ? "var(--surface2)" : "transparent" }}
      >
        <Bell size={18} color={open ? "var(--fg)" : "var(--muted)"} />
        {/* Unread badge */}
        <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid var(--surface)", display: "block" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: -12, width: 360,
          background: "var(--surface)", borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px var(--stroke)",
          zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--stroke)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Notifications</h3>
            <button style={{ background: "none", border: "none", fontSize: 11, color: "#5d5fef", fontWeight: 800, cursor: "pointer" }}>MARK ALL READ</button>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            
            {/* Notif 1 */}
            <div style={{ padding: "16px 20px", display: "flex", gap: 16, borderBottom: "1px solid var(--stroke2)", background: "var(--surface)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff0fe", color: "#5d5fef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.4, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800 }}>Sarah Jenkins</span> submitted her timesheet for Week 42.
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>10 mins ago</div>
              </div>
              <div style={{ width: 8, height: 8, background: "#5d5fef", borderRadius: "50%", marginTop: 6 }} />
            </div>

            {/* Notif 2 */}
            <div style={{ padding: "16px 20px", display: "flex", gap: 16, borderBottom: "1px solid var(--stroke2)", background: "transparent", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckSquare size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.4, marginBottom: 4 }}>
                  Overdue tasks detected in <span style={{ fontWeight: 800 }}>Q4 Launch Project</span>.
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>2 hours ago</div>
              </div>
            </div>

            {/* Empty State spacer or View All */}
          </div>

          <div style={{ padding: "12px 20px", background: "var(--surface2)", borderTop: "1px solid var(--stroke)", textAlign: "center" }}>
             <button style={{ background: "none", border: "none", fontSize: 12, fontWeight: 800, color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
               VIEW ALL <ArrowRight size={14} />
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
