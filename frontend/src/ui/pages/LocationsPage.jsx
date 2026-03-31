import React, { useState, useEffect, useCallback, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, MousePointer, Monitor, Image as ImageIcon, CheckCircle, Navigation, Activity, Camera, LocateFixed } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import { apiRequest, unwrapResults } from "../../api/client.js"

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createAvatarIcon = (color, name, isActive) => {
  const initial = name.charAt(0).toUpperCase();
  const activeDot = isActive ? `<div style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background-color: #10B981; border-radius: 50%; border: 2px solid white;"></div>` : '';

  return L.divIcon({
    className: 'custom-avatar-marker',
    html: `<div style="
      background-color: ${color};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      position: relative;
    ">
      ${initial}
      ${activeDot}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid ${color};
      "></div>
    </div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38]
  })
}

const COLORS = ["#4B6BFB", "#E05194", "#9B51E0", "#2F80ED", "#F2994A", "#10B981"];
const getColor = (str) => COLORS[str.length % COLORS.length];

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export function LocationsPage() {
  const [activeTab, setActiveTab] = useState("locations");
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [employeesData, setEmployeesData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  const defaultCenter = [21.289, -157.838];

  const dateStr = currentDate.toLocaleDateString("en-CA");

  useEffect(() => {
    const handleGeo = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
          (err) => console.log("Geolocation error:", err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };
    handleGeo();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, empRes] = await Promise.allSettled([
        apiRequest(`/time/logs/?date_from=${dateStr}&date_to=${dateStr}`),
        apiRequest("/employees/"),
      ]);
      if (empRes.status === "fulfilled") setEmployeesData(unwrapResults(empRes.value) || []);
      if (logsRes.status === "fulfilled") setLogsData(unwrapResults(logsRes.value) || []);
    } catch (e) {
      console.error("Failed to load tracking data", e);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => { load() }, [load]);

  const addDays = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const dateLabel = isToday(currentDate) ? "Today" : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ─── Process Unified Maps List ───
  const employeesList = useMemo(() => {
    const arr = [{
      id: 0,
      name: "All Users",
      lastSeen: "--",
      active: false,
      lat: null,
      lng: null,
      color: "#7C8592",
      history: []
    }];

    employeesData.forEach(emp => {
      const userLogs = logsData.filter(l => l.employee === emp.id);
      const activeLog = userLogs.find(l => !l.clock_out);
      const lastLog = activeLog || userLogs[userLogs.length - 1];

      let lat = activeLog?.clock_in_lat || lastLog?.clock_out_lat || lastLog?.clock_in_lat || null;
      let lng = activeLog?.clock_in_lon || lastLog?.clock_out_lon || lastLog?.clock_in_lon || null;

      if (lat) lat = parseFloat(lat);
      if (lng) lng = parseFloat(lng);

      const name = [emp.user?.first_name, emp.user?.last_name].filter(Boolean).join(" ") || emp.user?.username || `Emp #${emp.id}`;

      const history = [];
      userLogs.forEach(l => {
        if (l.clock_in && l.clock_in_lat) history.push({ time: new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lat: parseFloat(l.clock_in_lat), lng: parseFloat(l.clock_in_lon), type: 'Clock In' });
        if (l.clock_out && l.clock_out_lat) history.push({ time: new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lat: parseFloat(l.clock_out_lat), lng: parseFloat(l.clock_out_lon), type: 'Clock Out' });
      });

      arr.push({
        id: emp.id,
        name,
        active: !!activeLog,
        lastSeen: activeLog ? new Date(activeLog.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
          (lastLog && lastLog.clock_out ? new Date(lastLog.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"),
        lat,
        lng,
        color: getColor(name),
        history
      });
    });

    return arr;
  }, [employeesData, logsData]);

  const selectedUser = employeesList.find(e => e.id === selectedUserId) || employeesList[0];

  // ─── Process Activities ───
  const filteredActivities = useMemo(() => {
    let acts = [];
    logsData.forEach(l => {
      // apply filter 
      if (selectedUserId !== 0 && l.employee !== selectedUserId) return;

      const empName = [l.employee_name, l.employee_username].filter(Boolean)[0] || `Emp #${l.employee}`;

      if (l.clock_in) {
        acts.push({
          id: `${l.id}-in`,
          user: empName,
          action: l.clock_in_address ? `Clocked in at ${l.clock_in_address}` : "Clocked in",
          time: new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(l.clock_in).getTime(),
          type: 'start'
        });
      }
      if (l.clock_out) {
        acts.push({
          id: `${l.id}-out`,
          user: empName,
          action: l.clock_out_address ? `Clocked out at ${l.clock_out_address}` : "Clocked out",
          time: new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(l.clock_out).getTime(),
          type: 'stop'
        });
      }
    });
    return acts.sort((a, b) => b.timestamp - a.timestamp); // newest first
  }, [logsData, selectedUserId]);

  // ─── Process Screenshots/Photos ───
  const filteredScreenshots = useMemo(() => {
    let snaps = [];
    logsData.forEach(l => {
      if (selectedUserId !== 0 && l.employee !== selectedUserId) return;

      const empName = [l.employee_name, l.employee_username].filter(Boolean)[0] || `Emp #${l.employee}`;
      if (l.clock_in_photo) {
        snaps.push({
          id: `${l.id}-in-photo`,
          user: empName,
          time: new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(l.clock_in).getTime(),
          url: l.clock_in_photo,
          action: "Clock In"
        });
      }
      if (l.clock_out_photo) {
        snaps.push({
          id: `${l.id}-out-photo`,
          user: empName,
          time: new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(l.clock_out).getTime(),
          url: l.clock_out_photo,
          action: "Clock Out"
        });
      }
    });
    return snaps.sort((a, b) => b.timestamp - a.timestamp);
  }, [logsData, selectedUserId]);

  // Derive dynamic map center based on existing locations so that map is not stuck in defaultCenter
  const mapCenter = useMemo(() => {
    if (selectedUser.id !== 0 && selectedUser.lat) {
      return [selectedUser.lat, selectedUser.lng];
    }
    const withLoc = employeesList.filter(e => e.id !== 0 && e.lat);
    if (withLoc.length > 0) return [withLoc[0].lat, withLoc[0].lng];
    return currentLocation || defaultCenter; // Fallback
  }, [selectedUser, employeesList, currentLocation]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)", width: "100%", backgroundColor: "var(--bg)", border: "1px solid var(--stroke)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
      {/* Top Header */}
      <div style={{ position: "relative", zIndex: 1000, padding: "12px 24px", display: "flex", gap: "12px", borderBottom: "1px solid var(--stroke)", alignItems: "center", backgroundColor: "var(--surface)" }}>
        <button
          className={activeTab === 'activity' ? "btn" : "btn btnGhost"}
          style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: activeTab === 'activity' ? "var(--surface2)" : "transparent", color: activeTab === 'activity' ? "var(--fg)" : "var(--fg2)", fontWeight: activeTab === 'activity' ? 600 : 500 }}
          onClick={() => setActiveTab('activity')}
        >Activity Log</button>
        <button
          className={activeTab === 'locations' ? "btn" : "btn btnGhost"}
          style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: activeTab === 'locations' ? "var(--surface2)" : "transparent", color: activeTab === 'locations' ? "var(--fg)" : "var(--fg2)", fontWeight: activeTab === 'locations' ? 600 : 500 }}
          onClick={() => setActiveTab('locations')}
        >Locations</button>
        <button
          className={activeTab === 'screenshots' ? "btn" : "btn btnGhost"}
          style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: activeTab === 'screenshots' ? "var(--surface2)" : "transparent", color: activeTab === 'screenshots' ? "var(--fg)" : "var(--fg2)", fontWeight: activeTab === 'screenshots' ? 600 : 500 }}
          onClick={() => setActiveTab('screenshots')}
        >Photos & Selfies</button>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Dynamic Main Area */}
        <div style={{ flex: 1, position: "relative", backgroundColor: activeTab === 'locations' ? "transparent" : "var(--surface)", display: "flex", flexDirection: "column" }}>

          {loading && activeTab !== 'locations' && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
              Loading QuickTIMS engine...
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === 'locations' && (
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ width: "100%", height: "100%", zIndex: 0 }}
              zoomControl={true}
            >
              <MapUpdater center={mapCenter} />
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution='&copy; <a href="https://maps.google.com/">Google Maps</a>'
              />
              {currentLocation && (
                <Marker position={currentLocation} icon={L.divIcon({ className: "curr-loc", html: "<div style='width:16px;height:16px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4);'></div>" })}>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {(selectedUser.id === 0 ? employeesList : [selectedUser]).map(emp => {
                if (!emp.lat) return null;
                return (
                  <Marker
                    key={emp.id}
                    position={[emp.lat, emp.lng]}
                    icon={createAvatarIcon(emp.color, emp.name, emp.active)}
                    eventHandlers={{ click: () => setSelectedUserId(emp.id) }}
                  >
                    <Popup>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>{emp.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Last seen: {emp.lastSeen}</div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Path for Selected User if multiple checkpoints */}
              {selectedUser && selectedUser.id !== 0 && selectedUser.history && selectedUser.history.length > 1 && (
                <>
                  <Polyline
                    positions={selectedUser.history.map(h => [h.lat, h.lng])}
                    color="#00A2FF"
                    weight={3}
                    opacity={0.9}
                  />
                  {selectedUser.history.map((h, i) => (
                    <Marker
                      key={`hist-${i}`}
                      position={[h.lat, h.lng]}
                      icon={L.divIcon({
                        className: 'path-dot',
                        html: `<div style="width: 12px; height: 12px; background: white; border: 3px solid #00A2FF; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                      })}
                    >
                      <Popup>
                        <div style={{ fontSize: "12px", fontWeight: "600", padding: "2px 4px" }}>{h.type} at {h.time}</div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </MapContainer>
          )}

          {/* ACTIVITY TAB */}
          {!loading && activeTab === 'activity' && (
            <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", justifyContent: "center" }}>
              <div style={{ maxWidth: "800px", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid var(--stroke)" }}>
                  <h3 style={{ margin: 0 }}>Activity Log</h3>
                  <span className="pill pillGood">{dateLabel}</span>
                </div>

                {filteredActivities.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "64px", color: "var(--muted)" }}>No QuickTIMS activity found for {selectedUser.name} on {dateLabel}.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
                    {filteredActivities.map((act, idx) => (
                      <div key={act.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start", position: "relative" }}>
                        {idx !== filteredActivities.length - 1 && (
                          <div style={{ position: "absolute", left: "19px", top: "36px", bottom: "-24px", width: "2px", backgroundColor: "var(--stroke)" }} />
                        )}
                        <div style={{ padding: "10px", borderRadius: "50%", backgroundColor: "var(--surface2)", border: "1px solid var(--stroke)", zIndex: 1, position: "relative" }}>
                          {act.type === 'start' && <Clock size={16} color="var(--good-text)" />}
                          {act.type === 'stop' && <CheckCircle size={16} color="var(--primary)" />}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px" }}>
                          <div style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--fg)" }}>
                            {act.user} <span style={{ fontWeight: 400, color: "var(--fg2)" }}>{act.action}</span>
                          </div>
                          <div style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: 500 }}>{act.time}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: "13px", fontWeight: 500 }}>End of activity timeline.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREENSHOTS / PHOTOS TAB */}
          {!loading && activeTab === 'screenshots' && (
            <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                <h3 style={{ margin: 0 }}>Authentication Selfies</h3>
                <span className="pill">{selectedUser.name} • {dateLabel}</span>
              </div>

              {filteredScreenshots.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px", color: "var(--muted)" }}>No login selfies or verification photos found for {selectedUser.name} on {dateLabel}.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                  {filteredScreenshots.map(sc => (
                    <div key={sc.id} style={{ border: "1px solid var(--stroke)", borderRadius: "var(--radius)", overflow: "hidden", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-sm)", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer" }} className="screenshot-card">
                      <div style={{ height: "240px", backgroundColor: "var(--bg2)", backgroundImage: `url(${sc.url})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ position: "absolute", bottom: "12px", right: "12px", backgroundColor: "rgba(14, 17, 22, 0.7)", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backdropFilter: "blur(4px)" }}>{sc.time}</div>
                      </div>
                      <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--fg)", display: "flex", alignItems: "center", gap: "6px" }}><Camera size={14} /> {sc.user} — {sc.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar List */}
        <div style={{
          width: "320px",
          borderLeft: "1px solid var(--stroke)",
          backgroundColor: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          zIndex: 10
        }}>
          {/* Calendar Picker */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--stroke)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--surface2)", padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--stroke)", flex: 1, marginRight: "12px", cursor: "pointer" }}>
              <Calendar size={18} color="var(--fg2)" style={{ marginRight: 10 }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)" }}>{dateLabel}</span>
            </div>
            <div style={{ display: "flex", gap: "2px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--stroke)", overflow: "hidden" }}>
              <button onClick={() => addDays(-1)} style={{ background: "transparent", border: "none", padding: "8px 10px", cursor: "pointer", display: "flex", borderRight: "1px solid var(--stroke)", color: "var(--fg2)" }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => addDays(1)} style={{ background: "transparent", border: "none", padding: "8px 10px", cursor: "pointer", display: "flex", color: "var(--fg2)" }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "var(--muted)", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "1px solid var(--stroke)", backgroundColor: "var(--surface2)" }}>
            <span>EMPLOYEES</span>
            <span>LAST SEEN</span>
          </div>

          {/* Employee List */}
          <div style={{ overflowY: "auto", flex: 1, position: "relative" }}>
            {loading && employeesData.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>Syncing...</div>
            ) : employeesList.map(emp => (
              <React.Fragment key={emp.id}>
                <div
                  onClick={() => setSelectedUserId(emp.id)}
                  className="sidebarUserItem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--stroke)",
                    cursor: "pointer",
                    backgroundColor: selectedUser?.id === emp.id ? "var(--primary-light)" : "transparent",
                    transition: "background-color 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {emp.id === 0 ? (
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "var(--bg2)", color: "var(--fg2)", border: "1px solid var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Activity size={18} />
                      </div>
                    ) : (
                      <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        backgroundColor: emp.color,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "15px",
                        position: "relative"
                      }}>
                        {emp.name.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontWeight: selectedUser?.id === emp.id ? 700 : 600, color: "var(--fg)", fontSize: "14px" }}>{emp.name}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {emp.active && emp.id !== 0 && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }}></div>}
                    <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 500 }}>{emp.lastSeen}</span>
                  </div>
                </div>

                {/* Sub-history (selected user only) on map location tab mostly, but keeping it visible is fine */}
                {activeTab === 'locations' && selectedUser?.id === emp.id && emp.history && emp.history.length > 0 && (
                  <div style={{ backgroundColor: "var(--surface2)", borderBottom: "1px solid var(--stroke)" }}>
                    {emp.history.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 12px 74px", borderBottom: i < emp.history.length - 1 ? "1px solid var(--stroke)" : "none" }}>
                        <span style={{ color: "var(--fg2)", fontSize: "13px", fontWeight: 500 }}>{h.type} at {h.time}</span>
                        {h.type === 'Clock In' ? <Clock size={15} color="var(--good-text)" /> : <CheckCircle size={15} color="var(--primary)" />}
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
      <style>{`
        .screenshot-card:hover { break-inside: avoid; transform: translateY(-2px); box-shadow: var(--shadow-md) !important; }
        .sidebarUserItem:hover { background-color: var(--bg2) !important; }
      `}</style>
    </div>
  )
}
