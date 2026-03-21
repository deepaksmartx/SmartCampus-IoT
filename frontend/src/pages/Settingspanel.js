import React, { useState, useEffect, useRef } from "react";

const PANEL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

.sp-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0); backdrop-filter: blur(0px);
  pointer-events: none;
  transition: background 0.3s ease, backdrop-filter 0.3s ease;
}
.sp-backdrop--visible {
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  pointer-events: all;
}
.sp-panel {
  position: fixed; top: 0; right: 0; height: 100vh;
  width: 680px; max-width: 95vw; z-index: 300;
  background: #0f172a;
  border-left: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  box-shadow: -8px 0 48px rgba(0,0,0,0.5);
}
.sp-panel--open { transform: translateX(0); }
.sp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 60px; flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  background: rgba(30,41,59,0.6);
}
.sp-header-left { display: flex; align-items: center; gap: 10px; }
.sp-header-icon { font-size: 18px; }
.sp-header-title {
  font-family: 'Syne', sans-serif; font-size: 17px;
  font-weight: 700; color: #f8fafc;
}
.sp-close {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; color: #94a3b8; font-size: 13px;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 0.15s ease;
}
.sp-close:hover {
  background: rgba(239,68,68,0.15);
  border-color: rgba(239,68,68,0.3); color: #f87171;
}
.sp-body { display: flex; flex: 1; overflow: hidden; }
.sp-nav {
  width: 200px; flex-shrink: 0; padding: 16px 10px;
  border-right: 1px solid rgba(255,255,255,0.06);
  background: rgba(15,23,42,0.8);
  display: flex; flex-direction: column; gap: 2px; overflow-y: auto;
}
.sp-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 9px;
  background: none; border: none; color: #94a3b8;
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  font-weight: 500; cursor: pointer; transition: all 0.15s ease;
  text-align: left; width: 100%;
}
.sp-nav-item:hover { background: rgba(255,255,255,0.05); color: #f8fafc; }
.sp-nav-item--active {
  background: rgba(26,86,219,0.18); color: #60a5fa;
  border: 1px solid rgba(26,86,219,0.25);
}
.sp-nav-item--active:hover { background: rgba(26,86,219,0.22); }
.sp-nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
.sp-nav-label { line-height: 1.3; }
.sp-content {
  flex: 1; overflow-y: auto; padding: 28px 28px 40px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.sp-content::-webkit-scrollbar { width: 5px; }
.sp-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.sp-tab { animation: spFadeUp 0.25s ease both; }
@keyframes spFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sp-tab-title {
  font-family: 'Syne', sans-serif; font-size: 19px;
  font-weight: 700; color: #f8fafc; margin-bottom: 4px;
}
.sp-tab-desc { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
.sp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.sp-label {
  font-size: 12px; font-weight: 600; color: #94a3b8;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.sp-input {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.09);
  border-radius: 9px; padding: 10px 14px; color: #f8fafc;
  font-size: 14px; font-family: 'DM Sans', sans-serif;
  outline: none; width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.sp-input::placeholder { color: #475569; }
.sp-input:focus {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(26,86,219,0.18);
  background: rgba(26,86,219,0.06);
}
.sp-textarea { min-height: 90px; resize: vertical; }
.sp-hint { font-size: 11px; color: #64748b; margin-top: 2px; }
.sp-btn-save {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 24px; background: #1a56db; color: #fff;
  border: none; border-radius: 9px; font-size: 14px; font-weight: 600;
  font-family: 'DM Sans', sans-serif; cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  margin-top: 4px;
}
.sp-btn-save:hover {
  background: #1d4ed8; transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(26,86,219,0.4);
}
.sp-toast { padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
.sp-toast--success {
  background: rgba(14,159,110,0.12);
  border: 1px solid rgba(14,159,110,0.25); color: #6ee7b7;
}
.sp-toast--error {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25); color: #fca5a5;
}
.sp-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.sp-avatar-wrap {
  position: relative; width: 68px; height: 68px;
  border-radius: 50%; cursor: pointer; flex-shrink: 0;
  overflow: hidden; border: 2px solid rgba(255,255,255,0.1);
}
.sp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.sp-avatar-initials {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #1a56db, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-size: 22px;
  font-weight: 700; color: #fff;
}
.sp-avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; opacity: 0; transition: opacity 0.15s; border-radius: 50%;
}
.sp-avatar-wrap:hover .sp-avatar-overlay { opacity: 1; }
.sp-avatar-name  { font-size: 15px; font-weight: 600; color: #f8fafc; }
.sp-avatar-email { font-size: 12px; color: #64748b; margin-top: 2px; }
.sp-avatar-hint  { font-size: 11px; color: #60a5fa; margin-top: 4px; }
.sp-strength-bar { display: flex; align-items: center; gap: 4px; margin-top: 6px; }
.sp-strength-seg { height: 4px; flex: 1; border-radius: 4px; transition: background 0.3s; }
.sp-toggle-list { display: flex; flex-direction: column; gap: 4px; }
.sp-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.sp-toggle-row:last-child { border-bottom: none; }
.sp-toggle-info { flex: 1; }
.sp-toggle-label { font-size: 14px; font-weight: 500; color: #f8fafc; }
.sp-toggle-desc  { font-size: 12px; color: #64748b; margin-top: 2px; }
.sp-toggle {
  width: 44px; height: 24px; border-radius: 999px;
  background: rgba(255,255,255,0.1);
  border: 1.5px solid rgba(255,255,255,0.12);
  cursor: pointer; position: relative;
  transition: background 0.2s, border-color 0.2s; flex-shrink: 0;
}
.sp-toggle--on { background: #1a56db; border-color: #1a56db; }
.sp-toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.sp-toggle--on .sp-toggle-thumb { transform: translateX(20px); }
.sp-theme-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 8px; }
.sp-theme-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 18px 12px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 12px; cursor: pointer; transition: all 0.15s ease;
  position: relative; font-family: 'DM Sans', sans-serif;
}
.sp-theme-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.07); }
.sp-theme-card--active { border-color: #1a56db; background: rgba(26,86,219,0.12); }
.sp-theme-icon { font-size: 24px; }
.sp-theme-name { font-size: 13px; font-weight: 600; color: #f8fafc; }
.sp-theme-desc { font-size: 11px; color: #64748b; text-align: center; line-height: 1.4; }
.sp-theme-check {
  position: absolute; top: 8px; right: 8px;
  width: 18px; height: 18px; background: #1a56db; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #fff; font-weight: 700;
}
.sp-user-list { display: flex; flex-direction: column; gap: 8px; }
.sp-user-row {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
}
.sp-user-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  font-family: 'Syne', sans-serif; flex-shrink: 0;
}
.sp-user-info { flex: 1; }
.sp-user-name  { font-size: 13px; font-weight: 500; color: #f8fafc; }
.sp-user-email { font-size: 11px; color: #64748b; }
.sp-role-select {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px; padding: 6px 10px; color: #f8fafc;
  font-size: 12px; font-family: 'DM Sans', sans-serif;
  outline: none; cursor: pointer; color-scheme: dark;
}
.sp-role-select option { background: #1e293b; color: #f8fafc; }
.sp-section-divider {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #475569;
  margin: 20px 0 10px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sp-ann-list { display: flex; flex-direction: column; gap: 6px; }
.sp-ann-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 9px;
}
.sp-ann-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.sp-ann-title { font-size: 13px; font-weight: 500; color: #f8fafc; }
.sp-ann-meta  { font-size: 11px; color: #64748b; margin-top: 2px; }
.sp-log-list { display: flex; flex-direction: column; gap: 6px; }
.sp-log-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 9px;
}
.sp-log-icon {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.sp-log-action { font-size: 13px; font-weight: 500; color: #f8fafc; }
.sp-log-meta   { font-size: 11px; color: #64748b; margin-top: 2px; }
.sp-facility-form { margin-bottom: 4px; }
.sp-facility-list { display: flex; flex-direction: column; gap: 6px; }
.sp-facility-item {
  display: flex; align-items: center; gap: 10px; padding: 11px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 9px;
}
.sp-facility-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.sp-facility-info { flex: 1; }
.sp-facility-name { font-size: 13px; font-weight: 500; color: #f8fafc; }
.sp-facility-meta { font-size: 11px; color: #64748b; margin-top: 1px; }
.sp-facility-actions { display: flex; align-items: center; gap: 6px; }
.sp-status-btn {
  padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
  font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1px solid;
  transition: all 0.15s;
}
.sp-status-btn--active {
  background: rgba(14,159,110,0.12); border-color: rgba(14,159,110,0.3); color: #34d399;
}
.sp-status-btn--active:hover { background: rgba(14,159,110,0.2); }
.sp-status-btn--inactive {
  background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25); color: #f87171;
}
.sp-status-btn--inactive:hover { background: rgba(239,68,68,0.18); }
.sp-remove-btn {
  background: none; border: none; cursor: pointer; font-size: 14px;
  padding: 4px; border-radius: 6px; transition: background 0.15s; opacity: 0.5;
}
.sp-remove-btn:hover { background: rgba(239,68,68,0.15); opacity: 1; }
@media (max-width: 640px) {
  .sp-panel { width: 100vw; }
  .sp-nav { width: 52px; padding: 12px 6px; }
  .sp-nav-label { display: none; }
  .sp-nav-item { justify-content: center; padding: 10px 0; }
  .sp-content { padding: 20px 16px 32px; }
  .sp-theme-grid { grid-template-columns: 1fr 1fr; }
}
`;

if (typeof document !== "undefined" && !document.getElementById("sp-styles")) {
  const tag = document.createElement("style");
  tag.id = "sp-styles";
  tag.textContent = PANEL_CSS;
  document.head.appendChild(tag);
}

const TABS_COMMON = [
  { key: "profile",       label: "Edit Profile",            icon: "👤" },
  { key: "password",      label: "Change Password",          icon: "🔒" },
  { key: "notifications", label: "Notification Preferences", icon: "🔔" },
  { key: "theme",         label: "Theme",                    icon: "🎨" },
];

const TABS_ADMIN = [
  { key: "roles",         label: "Manage User Roles",        icon: "🛡️" },
  { key: "announcements", label: "Campus Announcements",     icon: "📢" },
  { key: "logs",          label: "System Logs",              icon: "📋" },
  { key: "facilities",    label: "Add / Remove Facilities",  icon: "🏛️" },
];

/* ✅ FIXED - accepts both "open" and "isOpen" props */
function SettingsPanel({
  open,
  isOpen,
  onClose,
  role,
  onProfileUpdate,
  onThemeChange,
  currentTheme = "dark",
}) {
  /* ✅ FIXED - reads role from localStorage if not passed as prop */
  const storedUser   = JSON.parse(localStorage.getItem("user") || "{}");
  const resolvedRole = role || storedUser.role || "Student";
  const profileName  = storedUser.name  || "Campus User";
  const profileEmail = storedUser.email || "user@campus.edu";

  /* ✅ FIXED - works with both "open" and "isOpen" prop names */
  const isVisible = open || isOpen || false;

  const [activeTab, setActiveTab] = useState("profile");
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isVisible]);

  /* ✅ FIXED - Admin gets extra tabs, others get common tabs only */
  const tabs = (resolvedRole === "Admin")
    ? [...TABS_COMMON, ...TABS_ADMIN]
    : TABS_COMMON;

  return (
    <>
      <div
        className={`sp-backdrop ${isVisible ? "sp-backdrop--visible" : ""}`}
        onClick={onClose}
      />
      <div className={`sp-panel ${isVisible ? "sp-panel--open" : ""}`} ref={panelRef}>

        <div className="sp-header">
          <div className="sp-header-left">
            <span className="sp-header-icon">⚙️</span>
            <span className="sp-header-title">Settings</span>
          </div>
          <button className="sp-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sp-body">
          <nav className="sp-nav">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`sp-nav-item ${activeTab === t.key ? "sp-nav-item--active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="sp-nav-icon">{t.icon}</span>
                <span className="sp-nav-label">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="sp-content">
            {activeTab === "profile"       && <ProfileTab profileName={profileName} profileEmail={profileEmail} onProfileUpdate={onProfileUpdate} />}
            {activeTab === "password"      && <PasswordTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "theme"         && <ThemeTab currentTheme={currentTheme} onThemeChange={onThemeChange} />}
            {activeTab === "roles"         && <RolesTab />}
            {activeTab === "announcements" && <AnnouncementsTab />}
            {activeTab === "logs"          && <LogsTab />}
            {activeTab === "facilities"    && <FacilitiesTab />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════
   TAB: Edit Profile
══════════════════════════════════════ */
function ProfileTab({ profileName, profileEmail, onProfileUpdate }) {
  const [name, setName]       = useState(profileName);
  const [phno, setPhno]       = useState(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.phone_number || "";
  });
  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.profile_photo || null;
  });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload  = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  /* ✅ FIXED - actually saves to backend */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      let photoData = preview;
      if (photo) photoData = await convertToBase64(photo);

      /* ✅ FIXED - correct token key */
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone_number: phno, profile_photo: photoData }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data)); // ✅ update localStorage
        if (onProfileUpdate) onProfileUpdate({ name, phno, photoPreview: photoData });
        setMsg({ type: "success", text: "✓ Profile updated successfully!" });
      } else {
        setMsg({ type: "error", text: data.detail || "Failed to update." });
      }
    } catch {
      setMsg({ type: "error", text: "Server unreachable. Try again later." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Edit Profile</h3>
      <p className="sp-tab-desc">Update your display name, phone number, and profile photo.</p>

      {msg && <div className={`sp-toast sp-toast--${msg.type}`}>{msg.text}</div>}

      <div className="sp-avatar-row">
        <label className="sp-avatar-wrap" title="Click to change photo">
          {preview
            ? <img src={preview} alt="avatar" className="sp-avatar-img" />
            : <div className="sp-avatar-initials">{initials}</div>
          }
          <div className="sp-avatar-overlay">📷</div>
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)); }
            }}
          />
        </label>
        <div>
          <div className="sp-avatar-name">{name || "—"}</div>
          <div className="sp-avatar-email">{profileEmail}</div>
          {photo && <div className="sp-avatar-hint">{photo.name}</div>}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="sp-field">
          <label className="sp-label">Full Name</label>
          <input className="sp-input" type="text" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
        </div>
        <div className="sp-field">
          <label className="sp-label">Email</label>
          <input className="sp-input" type="email" value={profileEmail} disabled
            style={{ opacity: 0.5, cursor: "not-allowed" }} />
          <span className="sp-hint">Email cannot be changed here.</span>
        </div>
        <div className="sp-field">
          <label className="sp-label">Phone Number</label>
          <input className="sp-input" type="tel" value={phno}
            onChange={(e) => setPhno(e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <button className="sp-btn-save" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Change Password
══════════════════════════════════════ */
function PasswordTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg]         = useState(null);

  const strength = next.length === 0 ? 0
    : next.length < 6 ? 1
    : next.length < 10 ? 2
    : /[A-Z]/.test(next) && /[0-9]/.test(next) && /[^A-Za-z0-9]/.test(next) ? 4
    : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#0e9f6e", "#1a56db"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { setMsg({ type: "error", text: "Passwords do not match." }); return; }
    if (next.length < 8)  { setMsg({ type: "error", text: "Password must be at least 8 characters." }); return; }

    try {
      /* ✅ FIXED - correct token key */
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Password changed successfully!" });
        setCurrent(""); setNext(""); setConfirm("");
      } else {
        setMsg({ type: "error", text: data.detail || "Failed to change password." });
      }
    } catch {
      setMsg({ type: "error", text: "Server unreachable. Try again later." });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Change Password</h3>
      <p className="sp-tab-desc">Choose a strong password to keep your account secure.</p>

      {msg && <div className={`sp-toast sp-toast--${msg.type}`}>{msg.text}</div>}

      <form onSubmit={handleSubmit}>
        <div className="sp-field">
          <label className="sp-label">Current Password</label>
          <input className="sp-input" type="password" value={current}
            onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="sp-field">
          <label className="sp-label">New Password</label>
          <input className="sp-input" type="password" value={next}
            onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" required />
          {next.length > 0 && (
            <div className="sp-strength-bar">
              {[1,2,3,4].map(i => (
                <div key={i} className="sp-strength-seg"
                  style={{ background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }} />
              ))}
              <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
            </div>
          )}
        </div>
        <div className="sp-field">
          <label className="sp-label">Confirm New Password</label>
          <input className="sp-input" type="password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" required />
          {confirm && next !== confirm && (
            <span className="sp-hint" style={{ color: "#f87171" }}>Passwords don't match</span>
          )}
        </div>
        <button className="sp-btn-save" type="submit">Update Password</button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Notification Preferences
══════════════════════════════════════ */
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    booking_confirm:    true,
    booking_reminder:   true,
    maintenance_update: true,
    announcements:      false,
    email_digest:       false,
  });
  const [saved, setSaved] = useState(false);
  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: "booking_confirm",    label: "Booking Confirmations",  desc: "When a room or facility booking is confirmed." },
    { key: "booking_reminder",   label: "Booking Reminders",      desc: "Reminders 1 hour before a booked slot." },
    { key: "maintenance_update", label: "Maintenance Updates",    desc: "Status changes on your maintenance tickets." },
    { key: "announcements",      label: "Campus Announcements",   desc: "Notices and alerts from campus management." },
    { key: "email_digest",       label: "Weekly Email Digest",    desc: "A summary of activity sent every Monday." },
  ];

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Notification Preferences</h3>
      <p className="sp-tab-desc">Control which notifications you receive from SmartCampus.</p>
      <div className="sp-toggle-list">
        {items.map(item => (
          <div key={item.key} className="sp-toggle-row">
            <div className="sp-toggle-info">
              <div className="sp-toggle-label">{item.label}</div>
              <div className="sp-toggle-desc">{item.desc}</div>
            </div>
            <button
              className={`sp-toggle ${prefs[item.key] ? "sp-toggle--on" : ""}`}
              onClick={() => toggle(item.key)} type="button"
            >
              <span className="sp-toggle-thumb" />
            </button>
          </div>
        ))}
      </div>
      <button className="sp-btn-save" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} style={{ marginTop: 20 }}>
        {saved ? "✓ Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Theme
══════════════════════════════════════ */
function ThemeTab({ currentTheme, onThemeChange }) {
  const [selected, setSelected] = useState(
    localStorage.getItem("sc_theme") || "dark"
  );

  const pick = (t) => {
    setSelected(t);
    if (onThemeChange) onThemeChange(t);
    localStorage.setItem("sc_theme", t);

    // ✅ Apply theme instantly to the whole page
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  const themes = [
    { key: "dark",   label: "Dark",   icon: "🌙", desc: "Easy on the eyes at night." },
    { key: "light",  label: "Light",  icon: "☀️", desc: "Clean and bright."          },
    { key: "system", label: "System", icon: "💻", desc: "Follows your OS preference." },
  ];

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Theme</h3>
      <p className="sp-tab-desc">Choose how SmartCampus looks for you.</p>
      <div className="sp-theme-grid">
        {themes.map(t => (
          <button key={t.key}
            className={`sp-theme-card ${selected === t.key ? "sp-theme-card--active" : ""}`}
            onClick={() => pick(t.key)} type="button"
          >
            <span className="sp-theme-icon">{t.icon}</span>
            <span className="sp-theme-name">{t.label}</span>
            <span className="sp-theme-desc">{t.desc}</span>
            {selected === t.key && <span className="sp-theme-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Manage User Roles (Admin only)
══════════════════════════════════════ */
function RolesTab() {
  const [users, setUsers] = useState([
    { id: 1, name: "Aisha Kumar",  email: "aisha@campus.edu",  role: "student" },
    { id: 2, name: "Ravi Menon",   email: "ravi@campus.edu",   role: "staff" },
    { id: 3, name: "Priya Sharma", email: "priya@campus.edu",  role: "facility_manager" },
    { id: 4, name: "Arjun Das",    email: "arjun@campus.edu",  role: "student" },
  ]);
  const [saved, setSaved] = useState(false);
  const changeRole = (id, newRole) => setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x));
  const roleBadge  = { student: "#1a56db", staff: "#0e9f6e", facility_manager: "#ff6b35", admin: "#ef4444" };

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Manage User Roles</h3>
      <p className="sp-tab-desc">Assign or change roles for campus users.</p>
      <div className="sp-user-list">
        {users.map(u => (
          <div key={u.id} className="sp-user-row">
            <div className="sp-user-avatar" style={{ background: roleBadge[u.role] || "#1a56db" }}>
              {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <div className="sp-user-info">
              <div className="sp-user-name">{u.name}</div>
              <div className="sp-user-email">{u.email}</div>
            </div>
            <select className="sp-role-select" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="facility_manager">Facility Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
      <button className="sp-btn-save" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} style={{ marginTop: 16 }}>
        {saved ? "✓ Roles Updated!" : "Save Role Changes"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Campus Announcements
══════════════════════════════════════ */
function AnnouncementsTab() {
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [audience, setAudience] = useState("all");
  const [posts, setPosts]       = useState([
    { id: 1, title: "Library closed on Friday", audience: "all",     date: "Mar 13" },
    { id: 2, title: "New lab equipment arrived", audience: "student", date: "Mar 10" },
  ]);
  const [sent, setSent] = useState(false);

  const handlePost = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosts(p => [{ id: Date.now(), title, audience, date: "Today" }, ...p]);
    setTitle(""); setBody(""); setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  const audienceColor = { all: "#1a56db", student: "#0e9f6e", staff: "#ff6b35", admin: "#ef4444" };

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Campus Announcements</h3>
      <p className="sp-tab-desc">Post notices visible to selected user groups.</p>
      {sent && <div className="sp-toast sp-toast--success">✓ Announcement posted!</div>}
      <form onSubmit={handlePost}>
        <div className="sp-field">
          <label className="sp-label">Title</label>
          <input className="sp-input" type="text" value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" required />
        </div>
        <div className="sp-field">
          <label className="sp-label">Message</label>
          <textarea className="sp-input sp-textarea" value={body}
            onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement…" required />
        </div>
        <div className="sp-field">
          <label className="sp-label">Audience</label>
          <select className="sp-input" value={audience} onChange={(e) => setAudience(e.target.value)}
            style={{ backgroundColor: "#1e293b", colorScheme: "dark" }}>
            <option value="all"     style={{ background: "#1e293b" }}>Everyone</option>
            <option value="student" style={{ background: "#1e293b" }}>Students only</option>
            <option value="staff"   style={{ background: "#1e293b" }}>Staff only</option>
            <option value="admin"   style={{ background: "#1e293b" }}>Admins only</option>
          </select>
        </div>
        <button className="sp-btn-save" type="submit">Post Announcement</button>
      </form>
      <div className="sp-section-divider">Recent Announcements</div>
      <div className="sp-ann-list">
        {posts.map(p => (
          <div key={p.id} className="sp-ann-item">
            <div className="sp-ann-dot" style={{ background: audienceColor[p.audience] }} />
            <div>
              <div className="sp-ann-title">{p.title}</div>
              <div className="sp-ann-meta">
                <span style={{ color: audienceColor[p.audience], fontWeight: 600, fontSize: 11, textTransform: "capitalize" }}>
                  {p.audience === "all" ? "Everyone" : p.audience}
                </span>
                &nbsp;·&nbsp;{p.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: System Logs (Admin only)
══════════════════════════════════════ */
function LogsTab() {
  const logs = [
    { id: 1, action: "User login",               user: "aisha@campus.edu",  time: "Today 09:14",  type: "info"    },
    { id: 2, action: "Booking approved",          user: "priya@campus.edu",  time: "Today 09:02",  type: "success" },
    { id: 3, action: "Password changed",          user: "ravi@campus.edu",   time: "Today 08:45",  type: "warning" },
    { id: 4, action: "Role updated → Admin",      user: "arjun@campus.edu",  time: "Yesterday",    type: "warning" },
    { id: 5, action: "Facility deleted",          user: "admin@campus.edu",  time: "Mar 13 14:20", type: "error"   },
    { id: 6, action: "Maintenance ticket closed", user: "priya@campus.edu",  time: "Mar 13 11:05", type: "success" },
    { id: 7, action: "New user registered",       user: "neha@campus.edu",   time: "Mar 12 16:30", type: "info"    },
  ];
  const typeStyle = {
    info:    { color: "#60a5fa", bg: "rgba(26,86,219,0.12)",  icon: "ℹ️"  },
    success: { color: "#34d399", bg: "rgba(14,159,110,0.12)", icon: "✅" },
    warning: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: "⚠️" },
    error:   { color: "#f87171", bg: "rgba(239,68,68,0.12)",  icon: "🚨" },
  };
  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">System Logs</h3>
      <p className="sp-tab-desc">Audit trail of key actions performed across the campus system.</p>
      <div className="sp-log-list">
        {logs.map(l => {
          const s = typeStyle[l.type];
          return (
            <div key={l.id} className="sp-log-item">
              <div className="sp-log-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="sp-log-body">
                <div className="sp-log-action">{l.action}</div>
                <div className="sp-log-meta">
                  <span style={{ color: s.color }}>{l.user}</span>
                  &nbsp;·&nbsp;{l.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: Add / Remove Facilities (Admin)
══════════════════════════════════════ */
function FacilitiesTab() {
  const [facilities, setFacilities] = useState([
    { id: 1, name: "Seminar Hall A",   type: "Hall",       capacity: 120, status: "active"   },
    { id: 2, name: "Computer Lab 3",   type: "Lab",        capacity: 40,  status: "active"   },
    { id: 3, name: "Basketball Court", type: "Sports",     capacity: 30,  status: "inactive" },
    { id: 4, name: "Auditorium Main",  type: "Auditorium", capacity: 500, status: "active"   },
  ]);
  const [form, setForm]   = useState({ name: "", type: "Hall", capacity: "" });
  const [added, setAdded] = useState(false);
  const typeColor = { Hall: "#1a56db", Lab: "#0e9f6e", Sports: "#ff6b35", Auditorium: "#7c3aed", Room: "#0e9f6e" };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.capacity) return;
    setFacilities(f => [...f, { id: Date.now(), ...form, capacity: Number(form.capacity), status: "active" }]);
    setForm({ name: "", type: "Hall", capacity: "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const toggleStatus = (id) => setFacilities(f => f.map(x => x.id === id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x));
  const remove       = (id) => setFacilities(f => f.filter(x => x.id !== id));

  return (
    <div className="sp-tab">
      <h3 className="sp-tab-title">Add / Remove Facilities</h3>
      <p className="sp-tab-desc">Manage campus facilities available for booking.</p>
      {added && <div className="sp-toast sp-toast--success">✓ Facility added!</div>}
      <form onSubmit={handleAdd} className="sp-facility-form">
        <div className="sp-field">
          <label className="sp-label">Facility Name</label>
          <input className="sp-input" type="text" value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Seminar Hall B" required />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="sp-field">
            <label className="sp-label">Type</label>
            <select className="sp-input" value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ backgroundColor: "#1e293b", colorScheme: "dark" }}>
              {["Hall","Lab","Room","Sports","Auditorium"].map(t => (
                <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>
              ))}
            </select>
          </div>
          <div className="sp-field">
            <label className="sp-label">Capacity</label>
            <input className="sp-input" type="number" min="1" value={form.capacity}
              onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
              placeholder="e.g. 60" required />
          </div>
        </div>
        <button className="sp-btn-save" type="submit">+ Add Facility</button>
      </form>
      <div className="sp-section-divider">Existing Facilities</div>
      <div className="sp-facility-list">
        {facilities.map(f => (
          <div key={f.id} className="sp-facility-item">
            <div className="sp-facility-dot" style={{ background: typeColor[f.type] || "#1a56db" }} />
            <div className="sp-facility-info">
              <div className="sp-facility-name">{f.name}</div>
              <div className="sp-facility-meta">{f.type} · {f.capacity} seats</div>
            </div>
            <div className="sp-facility-actions">
              <button
                className={`sp-status-btn ${f.status === "active" ? "sp-status-btn--active" : "sp-status-btn--inactive"}`}
                onClick={() => toggleStatus(f.id)}
              >
                {f.status === "active" ? "Active" : "Inactive"}
              </button>
              <button className="sp-remove-btn" onClick={() => remove(f.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPanel;