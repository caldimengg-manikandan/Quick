import { useState, useEffect } from "react"
import { 
  Building2, Palette, CreditCard, Users2, History, ScrollText, 
  Clock, CalendarDays, Banknote, FileText, ShieldCheck, BarChart3, 
  Bell, Workflow, Search, Globe, Image as ImageIcon, Target, Settings,
  Sun, Moon, Monitor, RefreshCcw,
  Zap, Shield, Crown, Check, Minus, Star, ArrowRight,
  Plus, ChevronDown, ChevronUp, MoreHorizontal, UserCheck, UserMinus, UserX, Activity, Info, Lock
} from "lucide-react"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const MENU = [
    {
      group: "ORGANIZATION",
      items: [
        { id: "general", label: "General & Organization", icon: <Building2 size={16} /> },
        { id: "branding", label: "Branding & Theme", icon: <Palette size={16} /> },
        { id: "plan", label: "Plan & Subscription", icon: <CreditCard size={16} /> },
      ]
    },
    {
      group: "ACCESS & CONTROL",
      items: [
        { id: "users", label: "Users & Roles", icon: <Users2 size={16} /> },
        { id: "permissions", label: "Permission History", icon: <History size={16} /> },
        { id: "logs", label: "System Logs", icon: <ScrollText size={16} /> },
      ]
    },
    {
      group: "POLICIES",
      items: [
        { id: "timesheet", label: "Timesheet Policy", icon: <Clock size={16} /> },
        { id: "leave", label: "Leave Policy", icon: <CalendarDays size={16} /> },
        { id: "payroll", label: "Payroll Policy", icon: <Banknote size={16} /> },
        { id: "payslip", label: "Payslip Templates", icon: <FileText size={16} /> },
        { id: "compliance", label: "Compliance & Locks", icon: <ShieldCheck size={16} /> },
      ]
    },
    {
      group: "SYSTEM",
      items: [
        { id: "reports", label: "Reports & Automation", icon: <BarChart3 size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
        { id: "integrations", label: "Integrations", icon: <Workflow size={16} /> },
      ]
    }
  ]

  return (
    <div className="settingsPage">
      <div className="pageHeader" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="pageTitle">Enterprise Settings</h1>
          <div className="pageSub">Configure system-wide preferences, policies, and integrations.</div>
        </div>
      </div>

      <div className="settingsLayout">
        <aside className="settingsSidebar">
          <div className="settingsSearch">
            <Search size={16} className="settingsSearchIcon" />
            <input type="text" placeholder="Find a setting..." className="input settingsSearchInput" />
          </div>

          <nav className="settingsNav">
            {MENU.map((group, i) => (
              <div key={i} className="settingsNavGroup">
                <div className="settingsNavGroupTitle">{group.group}</div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    className={`settingsNavItem ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="settingsNavIcon">{item.icon}</span>
                    <span className="settingsNavLabel">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="settingsContent">
          {activeTab === "general" && <GeneralOrganizationTab />}
          {activeTab === "branding" && <BrandingThemeTab />}
          {activeTab === "plan" && <PlanSubscriptionTab />}
          {activeTab === "users" && <UsersRolesTab />}
          {activeTab !== "general" && activeTab !== "branding" && activeTab !== "plan" && activeTab !== "users" && (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
              <Settings size={48} opacity={0.2} style={{ margin: "0 auto 16px auto", display: "block" }} />
              <h3 style={{ margin: 0, color: "var(--fg)", fontSize: 16 }}>{MENU.flatMap(g => g.items).find(i => i.id === activeTab)?.label}</h3>
              <p style={{ marginTop: 8 }}>Configuration options for this section will be available soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function GeneralOrganizationTab() {
  return (
    <div className="settingsSection">
      {/* Tab Header */}
      <div className="settingsSectionHeader">
        <div>
          <h2 className="settingsSectionTitle">Organization Landscape</h2>
          <p className="settingsSectionSub">Manage company identity, localization and operational basics</p>
        </div>
        <div className="badge badgeBase" style={{ background: "var(--primary-glow)", color: "var(--primary)", borderColor: "var(--primary)", fontWeight: 700 }}>
          CURRENT PLAN: PRO
        </div>
      </div>

      {/* Grid Layout for Cards */}
      <div className="settingsGrid">
        
        {/* Left Column */}
        <div className="settingsCol">
          
          {/* Corporate Identity */}
          <div className="card">
            <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
              <div className="row">
                <div className="iconWrap"><Globe size={18} /></div>
                <div>
                  <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 14 }}>Corporate Identity</div>
                  <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Define your company's core public information</div>
                </div>
              </div>
            </div>
            <div className="cardBody stackLg">
              <div className="field">
                <label className="fieldLabel">OFFICIAL COMPANY NAME</label>
                <input type="text" className="input" defaultValue="CALTIMS" />
              </div>
              <div className="field">
                <label className="fieldLabel">HEADQUARTERS ADDRESS</label>
                <textarea className="input textarea" defaultValue="123 Enterprise Way, Tech City..."></textarea>
              </div>
              <div className="grid2Tight">
                <div className="field">
                  <label className="fieldLabel">OPERATIONAL COUNTRY</label>
                  <input type="text" className="input" defaultValue="India" />
                </div>
                <div className="field">
                  <label className="fieldLabel">BASE CURRENCY</label>
                  <select className="input">
                    <option>USD ($)</option>
                    <option>INR (₹)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* System Localization */}
          <div className="card">
            <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
              <div className="row">
                <div className="iconWrap"><Target size={18} /></div>
                <div>
                  <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 14 }}>System Localization</div>
                  <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Regional and time-based configurations</div>
                </div>
              </div>
            </div>
            <div className="cardBody stackLg">
              <div className="grid2Tight">
                <div className="field">
                  <label className="fieldLabel">ENTERPRISE TIMEZONE</label>
                  <select className="input">
                    <option>Select Timezone</option>
                    <option selected>Asia/Kolkata (IST)</option>
                    <option>America/New_York (EST)</option>
                  </select>
                </div>
                <div className="field">
                  <label className="fieldLabel">DISPLAY DATE FORMAT</label>
                  <select className="input">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="field">
                  <label className="fieldLabel">FISCAL YEAR START</label>
                  <select className="input">
                    <option>April</option>
                    <option>January</option>
                    <option>July</option>
                  </select>
                </div>
                <div className="field">
                  <label className="fieldLabel">STANDARD WORK WEEK</label>
                  <select className="input">
                    <option>Monday - Friday</option>
                    <option>Monday - Saturday</option>
                    <option>Sunday - Thursday</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="settingsCol">
          
          {/* Company Logo */}
          <div className="card">
            <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
              <div className="row">
                <div className="iconWrap"><ImageIcon size={18} /></div>
                <div>
                  <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 14 }}>Company Logo</div>
                  <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Brand assets for system reporting</div>
                </div>
              </div>
            </div>
            <div className="cardBody">
              <div className="logoUploadBox">
                <Globe size={32} opacity={0.3} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5 }}>SELECT IMAGE ASSET</div>
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button className="btn btnGhost" style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, display: "inline-flex" }}>UPLOAD NEW LOGO</button>
              </div>
            </div>
          </div>

          {/* Operational Pace */}
          <div className="card">
            <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
              <div className="row">
                <div className="iconWrap"><Clock size={18} /></div>
                <div>
                  <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 14 }}>Operational Pace</div>
                  <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Default system-wide pace rules</div>
                </div>
              </div>
            </div>
            <div className="cardBody stackLg">
              
              <div className="field">
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="fieldLabel">STANDARD WORK DAY</label>
                  <div className="pill" style={{ background: "var(--primary)", color: "#fff", border: "none" }}>8 HRS</div>
                </div>
                <input type="range" min="1" max="12" defaultValue="8" className="rangeSlider" />
                <div className="fieldHint" style={{ marginTop: 8 }}>Leaves threshold tracking for timesheet compliance.</div>
              </div>

              <div className="divider" style={{ height: 1, background: "var(--stroke)", margin: "8px 0" }}></div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>STRICT ENFORCEMENT</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Mark late, checkout strikes</div>
                </div>
                <ToggleSwitch defaultChecked={true} />
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>WEEKEND ACCESS</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Allow entries on Sat/Sun</div>
                </div>
                <ToggleSwitch defaultChecked={true} />
              </div>

            </div>
          </div>
          
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button className="btn btnPrimary" style={{ background: "#5d5fef", borderRadius: 8, padding: "12px 24px", fontSize: 13, letterSpacing: 0.5, fontWeight: 700 }}>
          <Settings size={16} /> APPLY INSTITUTIONAL SETTINGS
        </button>
      </div>

    </div>
  )
}

function ToggleSwitch({ defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div 
      className={`toggleSwitch ${checked ? "checked" : ""}`} 
      onClick={() => setChecked(!checked)}
    >
      <div className="toggleKnob" />
    </div>
  )
}

function BrandingThemeTab() {
  const [activeColor, setActiveColor] = useState("#4F46E5")
  const [activeMode, setActiveMode] = useState("light")
  
  const colors = [
    { hex: "#4F46E5", name: "Indigo" },
    { hex: "#A855F7", name: "Purple" },
    { hex: "#F43F5E", name: "Rose" },
    { hex: "#F59E0B", name: "Amber" },
    { hex: "#10B981", name: "Emerald" },
    { hex: "#38BDF8", name: "Sky" }
  ]

  return (
    <div className="settingsSection">
      {/* Tab Header */}
      <div className="settingsSectionHeader" style={{ borderBottom: "none", paddingBottom: 0 }}>
        <div>
          <h2 className="settingsSectionTitle">Institutional Branding</h2>
          <p className="settingsSectionSub">Customize your enterprise identity and global interface</p>
        </div>
      </div>

      <div className="stackLg" style={{ maxWidth: 640 }}>
        
        {/* Card 1: Atmosphere */}
        <div className="card">
          <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
            <div className="row">
              <div className="iconWrap" style={{ width: 32, height: 32 }}><Palette size={16} /></div>
              <div>
                <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 13.5 }}>Atmosphere</div>
                <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Applied accent color system</div>
              </div>
            </div>
          </div>
          <div className="cardBody stackLg">
            <div className="row" style={{ gap: 16 }}>
              {colors.map(c => (
                <div 
                  key={c.hex}
                  onClick={() => setActiveColor(c.hex)}
                  title={c.name}
                  style={{
                    width: 48, 
                    height: 48,
                    borderRadius: "50%",
                    background: c.hex,
                    cursor: "pointer",
                    border: activeColor === c.hex ? "3px solid var(--surface)" : "none",
                    boxShadow: activeColor === c.hex ? `0 0 0 2px ${c.hex}, 0 4px 12px rgba(0,0,0,0.15)` : "none",
                    transform: activeColor === c.hex ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease"
                  }}
                />
              ))}
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="fieldLabel" style={{ fontSize: 11, letterSpacing: 0.8 }}>CUSTOM PRIMARY HEX</label>
              <div style={{ display: "flex", gap: 12 }}>
                 <div style={{ width: 44, height: 40, borderRadius: 8, background: activeColor }} />
                 <input 
                   type="text" 
                   className="input" 
                   value={activeColor}
                   onChange={(e) => setActiveColor(e.target.value)}
                   style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }} 
                 />
              </div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label className="fieldLabel" style={{ fontSize: 11, letterSpacing: 0.8 }}>LIVE PREVIEW</label>
              <div style={{ 
                border: "1px solid var(--stroke)", 
                borderRadius: 12, 
                padding: "24px", 
                background: "var(--surface)",
                display: "flex", flexDirection: "column", gap: 16 
              }}>
                 {/* Fake UI elements matching screenshot preview */}
                 <div style={{ width: "60%", height: 6, borderRadius: 3, background: "var(--surface2)", position: "relative" }} />
                 
                 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                   <button className="btn" style={{ background: activeColor, color: "#fff", border: "none", fontSize: 12, padding: "6px 16px", borderRadius: 999 }}>ACTION</button>
                   <div style={{ width: 24, height: 6, borderRadius: 3, background: activeColor }} />
                   <div style={{ width: 16, height: 6, borderRadius: 3, background: activeColor, opacity: 0.3 }} />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Display Mode */}
        <div className="card">
          <div className="cardHeader" style={{ background: "transparent", borderBottom: "none", paddingBottom: 0 }}>
            <div className="row">
              <div className="iconWrap" style={{ width: 32, height: 32 }}><Sun size={16} /></div>
              <div>
                <div className="cardTitle" style={{ color: "var(--fg)", fontWeight: 700, letterSpacing: 0, fontSize: 13.5 }}>Display Mode</div>
                <div className="cardSub" style={{ fontSize: 12, color: "var(--muted)" }}>Interface preference</div>
              </div>
            </div>
          </div>
          <div className="cardBody">
            <div className="row" style={{ gap: 12 }}>
               {/* Mode buttons */}
               {[
                 { id: "light", label: "Light", icon: <Sun size={18} /> },
                 { id: "dark", label: "Dark", icon: <Moon size={18} /> },
                 { id: "system", label: "System", icon: <Monitor size={18} /> },
               ].map(mode => (
                 <button
                   key={mode.id}
                   onClick={() => setActiveMode(mode.id)}
                   style={{
                     flex: 1,
                     display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                     padding: "16px",
                     borderRadius: 12,
                     border: activeMode === mode.id ? `1px solid ${activeColor}` : "1px solid var(--stroke)",
                     background: "var(--surface)",
                     color: activeMode === mode.id ? activeColor : "var(--muted)",
                     cursor: "pointer",
                     transition: "all 0.2s ease",
                     boxShadow: activeMode === mode.id ? `0 0 0 1px ${activeColor}` : "none"
                   }}
                 >
                   {mode.icon}
                   <span style={{ fontSize: 12, fontWeight: 600, color: activeMode === mode.id ? "var(--fg)" : "var(--muted)" }}>{mode.label}</span>
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, maxWidth: 640 }}>
        <button className="btn btnPrimary" style={{ background: "#5d5fef", borderRadius: 8, padding: "12px 24px", fontSize: 13, letterSpacing: 0.5, fontWeight: 700 }}>
          <RefreshCcw size={16} /> SYNC IDENTITY
        </button>
      </div>

    </div>
  )
}

function PlanSubscriptionTab() {
  return (
    <div className="settingsSection">
      {/* Centered Wide Header Area */}
      <div style={{ textAlign: "center", marginBottom: 48, marginTop: 12 }}>
        <h2 style={{ fontSize: 32, fontFamily: "var(--font-display)", fontWeight: 800, margin: 0, letterSpacing: -1 }}>
          Choose the right plan <br/>
          <span style={{ color: "#5d5fef", fontStyle: "italic" }}>for your organization.</span>
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
          Scale your productivity with automated timesheets and payroll.<br/>
          Start your 28-day free trial today.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, paddingBottom: 64 }}>
        
        {/* Trial Plan */}
        <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ position: "absolute", top: 24, right: 24, background: "#ecfdf5", color: "#059669", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4, letterSpacing: 0.5 }}>
            <Check size={12} strokeWidth={3} /> ACTIVE
          </div>
          
          <div style={{ width: 40, height: 40, border: "1px solid var(--stroke2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Zap size={20} color="var(--fg)" />
          </div>

          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>TRIAL</h3>
          <p style={{ margin: "4px 0 24px 0", fontSize: 12, color: "var(--muted)" }}>Ideal for small teams trying CALTIMS.</p>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>₹0</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, lineHeight: 1.2 }}>
              FREE TRIAL<br/>28 DAYS
            </div>
          </div>

          <div style={{ height: 1, background: "var(--stroke)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <Feature included text="TIMESHEET ENTRY" />
            <Feature included text="WEEKLY TIMESHEET SUBMISSION" />
            <Feature included text="PROJECT-BASED LOGGING" />
            <Feature included text="DASHBOARD OVERVIEW" />
            <Feature included text="HOLIDAY CALENDAR" />
            <Feature text="TIMESHEET HISTORY" />
            <Feature text="ADVANCED REPORTS" />
            <Feature text="PAYROLL AUTOMATION" />
            <Feature text="LEAVE MANAGEMENT" />
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 32, justifyContent: "center", padding: 14, background: "var(--surface2)", color: "var(--muted)", border: "none", fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
            YOUR CURRENT PLAN
          </button>
        </div>

        {/* Basic Plan */}
        <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", position: "relative", overflow: "visible" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--fg)", color: "var(--surface)", fontSize: 9, fontWeight: 800, padding: "4px 12px", borderRadius: 12, letterSpacing: 1 }}>
            RECOMMENDED
          </div>
          
          <div style={{ width: 40, height: 40, background: "#eff0fe", color: "#5d5fef", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Shield size={20} />
          </div>

          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>BASIC</h3>
          <p style={{ margin: "4px 0 24px 0", fontSize: 12, color: "var(--muted)" }}>Enhanced features for growing businesses.</p>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>₹29</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, lineHeight: 1.2 }}>
              PER USER<br/>PER MONTH
            </div>
          </div>

          <div style={{ height: 1, background: "var(--stroke)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <Feature included text="EVERYTHING IN TRIAL" />
            <Feature included text="UNLIMITED PROJECTS" />
            <Feature included text="TIMESHEET HISTORY" />
            <Feature included text="WEEKLY REPORTS" />
            <Feature included text="HOLIDAY MANAGEMENT" />
            <Feature included text="ADVANCED DASHBOARD" />
            <Feature text="PAYROLL AUTOMATION" />
            <Feature text="LEAVE MANAGEMENT" />
            <Feature text="ROLE BASED ACCESS" />
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 32, justifyContent: "center", padding: 14, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, border: "1px solid var(--fg)" }}>
            UPGRADE TO BASIC <ArrowRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </div>

        {/* Pro Plan */}
        <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", position: "relative", overflow: "visible", borderColor: "#5d5fef", borderWidth: 2 }}>
          <div style={{ position: "absolute", top: -12, right: 24, background: "#5d5fef", color: "#fff", fontSize: 9, fontWeight: 800, padding: "4px 12px", borderRadius: 12, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={10} fill="currentColor" /> MOST POPULAR
          </div>
          
          <div style={{ width: 40, height: 40, background: "#fef2f2", color: "#ef4444", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Crown size={20} />
          </div>

          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>PRO</h3>
          <p style={{ margin: "4px 0 24px 0", fontSize: 12, color: "var(--muted)" }}>The ultimate workforce management suite.</p>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>₹49</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, lineHeight: 1.2 }}>
              PER USER<br/>PER MONTH
            </div>
          </div>

          <div style={{ height: 1, background: "var(--stroke)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <Feature included text="EVERYTHING IN BASIC" />
            <Feature included text="FULL PAYROLL AUTOMATION" />
            <Feature included text="LEAVE MANAGEMENT" />
            <Feature included text="ADVANCED ANALYTICS" />
            <Feature included text="CUSTOM REPORTS" />
            <Feature included text="AUDIT LOGS" />
            <Feature included text="SINGLE SIGN ON (SSO)" />
            <Feature included text="PRIORITY 24/7 SUPPORT" />
            <Feature included text="DEDICATED MANAGER" />
          </div>

          <button className="btn btnPrimary" style={{ width: "100%", marginTop: 32, justifyContent: "center", padding: 14, background: "#5d5fef", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, border: "none" }}>
            UPGRADE TO PRO <ArrowRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Feature({ included, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: included ? 1 : 0.4 }}>
      {included ? <Check size={14} color="#5d5fef" strokeWidth={4} /> : <Minus size={14} color="var(--muted)" strokeWidth={3} />}
      <span style={{ fontSize: 10, fontWeight: 800, color: included ? "var(--fg)" : "var(--muted)", letterSpacing: 0.5 }}>{text}</span>
    </div>
  )
}

function UsersRolesTab() {
  const [activeRole, setActiveRole] = useState("admin")
  return (
    <div className="settingsSection">
      {/* Header */}
      <div className="settingsSectionHeader" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 24 }}>
        <div>
          <h2 className="settingsSectionTitle">Access Control</h2>
          <p className="settingsSectionSub">Configure roles and system level access</p>
        </div>
        <div>
          <button className="btn btnPrimary" style={{ background: "#5d5fef", borderRadius: 8, padding: "8px 16px", fontSize: 13, letterSpacing: 0.5, fontWeight: 700, border: "none" }}>
            <Plus size={16} /> CREATE CUSTOM ROLE
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, minHeight: 600 }}>
        
        {/* Left inner Sidebar: Roles */}
        <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, paddingLeft: 14, marginBottom: 8 }}>ROLES</div>
          {[
            { id: "admin", label: "Admin", system: true },
            { id: "hr", label: "HR", system: true },
            { id: "finance", label: "Finance", system: true },
            { id: "employee", label: "Employee", system: true }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: 8,
                background: activeRole === role.id ? "#5d5fef" : "transparent",
                color: activeRole === role.id ? "#fff" : "var(--fg)",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Center Panel: Permissions Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          {/* Header of Center Panel */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "var(--font-display)" }}>
              {activeRole === "admin" ? "Admin" : activeRole === "hr" ? "HR" : activeRole === "finance" ? "Finance" : "Employee"}
            </h3>
            <button className="btn" style={{ background: "#eff0fe", color: "#5d5fef", borderColor: "transparent", fontSize: 12, fontWeight: 700 }}>
              <Lock size={14} /> ACTIVE ROLE
            </button>
          </div>

          {/* Properties Info Row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120, border: "1px solid #5d5fef", borderRadius: 8, padding: "8px 12px", background: "#eff0fe" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#5d5fef", textTransform: "uppercase", marginBottom: 2 }}>ROLE NAME</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{activeRole === "admin" ? "Admin" : activeRole === "hr" ? "HR" : activeRole === "finance" ? "Finance" : "Employee"}</div>
            </div>
            <div style={{ flex: 2, minWidth: 200, border: "1px solid var(--stroke)", borderRadius: 8, padding: "8px 12px", background: "var(--surface)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>DESCRIPTION</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Unrestricted system access with global authority.</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, border: "1px solid var(--stroke)", borderRadius: 8, padding: "8px 12px", background: "var(--surface)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>STATUS</div>
              <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600 }}>System Default</div>
            </div>
          </div>

          {/* Permissions Search */}
          <div className="settingsSearch" style={{ marginBottom: 0 }}>
            <Search size={16} className="settingsSearchIcon" />
            <input type="text" placeholder="Search permissions (e.g., Payroll, Expenses)..." className="input settingsSearchInput" style={{ borderRadius: 8, background: "var(--surface)" }} />
          </div>

          {/* Permissions Tree */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", paddingRight: 8, paddingBottom: 64 }}>
             
             <PermissionNode icon={<Banknote size={16} />} title="PAYROLL" expanded={true}>
               <PermissionLeaf title="Dashboard" perms={["View"]} />
               <PermissionLeaf title="Payroll Engine" perms={["View", "Create", "Edit", "Delete"]} />
               <PermissionLeaf title="Execution Ledger" perms={["View"]} />
               <PermissionLeaf title="Payslip Generation" perms={["View", "Create"]} />
               <PermissionLeaf title="Bank Export" perms={["View", "Create"]} />
               <PermissionLeaf title="Payroll Reports" perms={["View"]} />
             </PermissionNode>

             <PermissionNode icon={<Users2 size={16} />} title="EMPLOYEES" expanded={true}>
               <PermissionLeaf title="Employee Data" perms={["View", "Create", "Edit", "Delete"]} />
               <PermissionLeaf title="Management" perms={["View", "Edit"]} />
             </PermissionNode>

             <PermissionNode icon={<Clock size={16} />} title="TIMESHEETS" expanded={true}>
               <PermissionLeaf title="Dashboard" perms={["View"]} />
               <PermissionLeaf title="Entry" perms={["View", "Create"]} />
               <PermissionLeaf title="History" perms={["View"]} />
               <PermissionLeaf title="Management" perms={["View", "Create", "Edit", "Delete"]} />
             </PermissionNode>

             <PermissionNode icon={<CalendarDays size={16} />} title="LEAVE MANAGEMENT" expanded={true}>
               <PermissionLeaf title="Leave Tracker" perms={["View"]} />
               <PermissionLeaf title="Leave Requests" perms={["View", "Create", "Edit", "Delete"]} />
               <PermissionLeaf title="Leave Policies" perms={["View"]} />
             </PermissionNode>

             <PermissionNode icon={<FileText size={16} />} title="MY PAYSLIP" expanded={false}>
               <PermissionLeaf title="Payslip View" perms={["View", "Download"]} />
             </PermissionNode>

             <PermissionNode icon={<Building2 size={16} />} title="PROJECTS" expanded={false}>
               <PermissionLeaf title="Project List" perms={["View", "Create", "Edit", "Delete"]} />
             </PermissionNode>

          </div>
        </div>

        {/* Right Sidebar: Assigned Users */}
        <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>ASSIGNED ADMIN USERS</div>
          
          <div className="settingsSearch" style={{ marginBottom: 0 }}>
            <Search size={14} className="settingsSearchIcon" />
            <input type="text" placeholder="Search assigned users..." className="input settingsSearchInput" style={{ borderRadius: 8, background: "var(--surface)", fontSize: 13, padding: "8px 12px 8px 32px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, padding: "8px 0" }}>
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--good)" }} /> Active (4)
            </div>
            {["Alex Chen", "Sarah Jenkins", "Marcus Thorne", "Elena Rodriguez"].map(u => (
              <div key={u} style={{ padding: "8px 12px", fontSize: 13, color: "var(--fg2)", background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                 <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff0fe", color: "#5d5fef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                   {u[0]}
                 </div>
                 {u}
              </div>
            ))}
            
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, padding: "12px 0 4px 0", color: "var(--muted)" }}>
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warn)" }} /> Unassigned (2)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, padding: "8px 0 4px 0", color: "var(--muted)" }}>
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bad)" }} /> Disabled (0)
            </div>
          </div>

          {activeRole === "admin" && (
            <div style={{ background: "var(--warn-bg)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 8, padding: 16, marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warn-text)", fontWeight: 800, fontSize: 11, letterSpacing: 0.5, marginBottom: 8 }}>
                <Info size={14} strokeWidth={3} /> MASTER ROLE
              </div>
              <div style={{ fontSize: 12, color: "var(--warn-text)", opacity: 0.9 }}>
                This role ignores all restriction rules with global system authority.
              </div>
            </div>
          )}

          <div style={{ border: "1px dashed var(--stroke2)", borderRadius: 8, padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: activeRole === "admin" ? 0 : "auto" }}>
             <Activity size={24} color="var(--subtle)" />
             <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>RECENT ACTIVITY</div>
             <div style={{ fontSize: 12, color: "var(--subtle)" }}>Showing activity for the last 30 days</div>
          </div>

        </div>

      </div>
    </div>
  )
}

function PermissionNode({ icon, title, expanded, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, cursor: "pointer", border: "1px solid var(--stroke)" }}>
        {expanded ? <ChevronDown size={14} color="#5d5fef" /> : <ChevronUp size={14} color="var(--muted)" />}
        <div style={{ color: "#5d5fef", display: "flex", alignItems: "center" }}>{icon}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg)", letterSpacing: 0.5 }}>{title}</div>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 32, paddingTop: 8, display: "flex", flexDirection: "column", gap: 4, borderLeft: "1px solid var(--stroke)", marginLeft: 18, marginTop: 4 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function PermissionLeaf({ title, perms }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderRadius: 6, border: "1px solid transparent", transition: "all 0.1s" }}>
      <div style={{ fontSize: 13, color: "var(--fg2)", fontWeight: 600 }}>{title}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {perms.map(p => (
          <div key={p} style={{ padding: "4px 10px", background: "var(--surface2)", color: "var(--fg2)", border: "1px solid var(--stroke)", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}
