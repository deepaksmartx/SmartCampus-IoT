import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SettingsPanel from "./Settingspanel";
import "../App.css";

const MODULES = [
  {
    key: "users",
    title: "Manage Users",
    desc: "Add, edit, deactivate, or assign roles to students, faculty, and staff accounts.",
    icon: "👥",
    color: "blue",
    iconBg: "rgba(26,86,219,0.15)",
    arrowColor: "#60a5fa",
  },
  {
    key: "buildings",
    title: "Buildings",
    desc: "Manage campus buildings, wings, rooms, and facility resources.",
    icon: "🏢",
    color: "green",
    iconBg: "rgba(14,159,110,0.15)",
    arrowColor: "#34d399",
  },
  {
    key: "floors",
    title: "Floors",
    desc: "Manage building floors and their assignments.",
    icon: "🚪",
    color: "purple",
    iconBg: "rgba(124,58,237,0.15)",
    arrowColor: "#a78bfa",
  },
  {
    key: "bookings",
    title: "All Bookings",
    desc: "View, approve, or cancel any facility booking made across the campus.",
    icon: "📋",
    color: "orange",
    iconBg: "rgba(255,107,53,0.15)",
    arrowColor: "#fb923c",
  },
  {
    key: "maintenance",
    title: "Maintenance",
    desc: "Monitor and assign all open maintenance tickets raised by campus users.",
    icon: "🔧",
    color: "purple",
    iconBg: "rgba(124,58,237,0.15)",
    arrowColor: "#a78bfa",
  },
  {
    key: "reports",
    title: "Reports & Analytics",
    desc: "Generate usage reports, occupancy stats, and system audit logs.",
    icon: "📊",
    color: "blue",
    iconBg: "rgba(26,86,219,0.15)",
    arrowColor: "#60a5fa",
  },
  {
    key: "settings",
    title: "System Settings",
    desc: "Configure campus-wide settings, access policies, and notification rules.",
    icon: "⚙️",
    color: "green",
    iconBg: "rgba(14,159,110,0.15)",
    arrowColor: "#34d399",
  },
];

const STATS = [
  { label: "Total Users",      value: "1,240", icon: "👥", bg: "rgba(26,86,219,0.15)"  },
  { label: "Active Bookings",  value: "87",    icon: "📋", bg: "rgba(14,159,110,0.15)" },
  { label: "Open Tickets",     value: "23",    icon: "🔧", bg: "rgba(255,107,53,0.15)" },
  { label: "Total Facilities", value: "64",    icon: "🏛️", bg: "rgba(124,58,237,0.15)" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false); // ✅ Settings state
  const [profileName, setProfileName]     = useState("Admin User");
  const [profileEmail, setProfileEmail]   = useState("admin@campus.edu");
  const [profilePhoto, setProfilePhoto]   = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.name)          setProfileName(user.name);
        if (user.email)         setProfileEmail(user.email);
        if (user.profile_photo) setProfilePhoto(user.profile_photo);
      } catch {}
    }
  }, []);

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const Avatar = ({ size = 36, fontSize = 15, style = {} }) =>
    profilePhoto ? (
      <img
        src={profilePhoto}
        alt={profileName}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.15)",
          flexShrink: 0,
          ...style,
        }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    ) : (
      <div
        className="avatar-circle"
        style={{
          width: size, height: size, fontSize,
          background: "linear-gradient(135deg, #ef4444, #7c3aed)",
          flexShrink: 0,
          ...style,
        }}
      >
        {initials}
      </div>
    );

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleModuleClick = (moduleKey) => {
    switch (moduleKey) {
      case "buildings":
        navigate("/buildings");
        break;
      case "floors":
        navigate("/floors");
        break;
      default:
        alert(`${moduleKey} module coming soon!`);
        break;
    }
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="page-wrapper">

        <nav className="navbar">
          <div className="navbar-brand">
            <div className="navbar-icon">🏫</div>
            SmartCampus
          </div>

          <div className="navbar-actions" ref={dropdownRef}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 999,
              fontSize: 12, fontWeight: 600, color: "#f87171",
              letterSpacing: "0.05em",
            }}>
              🛡️ Admin
            </div>

            <button
              className="avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Profile menu"
            >
              <Avatar size={36} fontSize={15} />
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profileName.split(" ")[0]}
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: 12, marginLeft: 2 }}>
                {dropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <Avatar size={56} fontSize={20} style={{ marginBottom: 8 }} />
                  <div className="profile-name">{profileName}</div>
                  <div className="profile-email">{profileEmail}</div>
                  <div style={{
                    marginTop: 6, display: "inline-block",
                    padding: "2px 10px", borderRadius: 999,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    fontSize: 11, color: "#f87171", fontWeight: 600,
                  }}>
                    Administrator
                  </div>
                </div>

                <button
                  className="dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                >
                  👤 &nbsp;View Profile
                </button>

                {/* ✅ Opens SettingsPanel */}
                <button
                  className="dropdown-item"
                  onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                >
                  ⚙️ &nbsp;System Settings
                </button>

                <hr className="divider" style={{ margin: "6px 0" }} />

                <button className="dropdown-item danger" onClick={logout}>
                  🚪 &nbsp;Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        <main className="dashboard-main">
          <div className="dashboard-hero">
            <div className="welcome-tag" style={{ color: "#f87171", background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" }}>
              🛡️ Administrator Panel
            </div>
            <h1 className="dashboard-title">
              Welcome back, {profileName.split(" ")[0]} 👋
            </h1>
            <p className="dashboard-subtitle">
              Manage users, facilities, and the entire campus system from here.
            </p>
          </div>

          <div className="stats-grid">
            {STATS.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="modules-title">Admin Controls</p>
          <div className="modules-grid">
            {MODULES.map((m) => (
              <div
                key={m.key}
                className={`module-card ${m.color}`}
                onClick={() => handleModuleClick(m.key)}
              >
                <div className="module-icon-wrap" style={{ background: m.iconBg }}>{m.icon}</div>
                <div className="module-card-title">{m.title}</div>
                <div className="module-card-desc">{m.desc}</div>
                <div className="module-card-arrow" style={{ color: m.arrowColor }}>Open module →</div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ✅ SettingsPanel renders here */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default AdminDashboard;