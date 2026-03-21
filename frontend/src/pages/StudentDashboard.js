import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SettingsPanel from "./Settingspanel";
import "../App.css";

const MODULES = [
  {
    key: "rooms",
    title: "Rooms",
    desc: "Browse and reserve classrooms, labs, and meeting spaces across all campus buildings.",
    icon: "🏢",
    color: "blue",
    iconBg: "rgba(26,86,219,0.15)",
    arrowColor: "#60a5fa",
  },
  {
    key: "facility",
    title: "Book Facility",
    desc: "Reserve auditoriums, sports courts, seminar halls, and outdoor venues with ease.",
    icon: "📅",
    color: "green",
    iconBg: "rgba(14,159,110,0.15)",
    arrowColor: "#34d399",
  },
  {
    key: "maintenance",
    title: "Maintenance Tickets",
    desc: "Submit, track, and resolve maintenance requests for any campus infrastructure issue.",
    icon: "🔧",
    color: "orange",
    iconBg: "rgba(255,107,53,0.15)",
    arrowColor: "#fb923c",
  },
  {
    key: "schedule",
    title: "My Schedule",
    desc: "View your personal timetable, upcoming bookings, and campus event calendar.",
    icon: "🗓️",
    color: "purple",
    iconBg: "rgba(124,58,237,0.15)",
    arrowColor: "#a78bfa",
  },
];

const STATS = [
  { label: "Active Rooms",   value: "48",  icon: "🏢", bg: "rgba(26,86,219,0.15)"  },
  { label: "Bookings Today", value: "12",  icon: "📅", bg: "rgba(14,159,110,0.15)" },
  { label: "Open Tickets",   value: "5",   icon: "🔧", bg: "rgba(255,107,53,0.15)" },
  { label: "Campus Users",   value: "320", icon: "👤", bg: "rgba(124,58,237,0.15)" },
];

function StudentDashboard() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false); // ✅ Settings state
  const [profileName, setProfileName]     = useState("Campus User");
  const [profileEmail, setProfileEmail]   = useState("user@campus.edu");
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
        style={{ width: size, height: size, fontSize, flexShrink: 0, ...style }}
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
                  ⚙️ &nbsp;Settings
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
            <div className="welcome-tag">✦ Student Dashboard</div>
            <h1 className="dashboard-title">
              Good day, {profileName.split(" ")[0]} 👋
            </h1>
            <p className="dashboard-subtitle">
              Access campus services and manage your activities from here.
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

          <p className="modules-title">Campus Services</p>
          <div className="modules-grid">
            {MODULES.map((m) => (
              <div
                key={m.key}
                className={`module-card ${m.color}`}
                onClick={() => alert(`${m.title} module coming soon!`)}
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

export default StudentDashboard;