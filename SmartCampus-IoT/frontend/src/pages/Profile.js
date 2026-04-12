import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [editMode, setEditMode]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  const [name, setName]                 = useState("");
  const [phone, setPhone]               = useState("");
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  /* ✅ Fetch latest profile from backend */
  useEffect(() => {
    // ✅ Step 1 — load from localStorage FIRST so page shows instantly
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setName(parsed.name);
        setPhone(parsed.phone_number || "");
        setPhotoPreview(parsed.profile_photo || null);
      } catch {}
    }

    // ✅ Step 2 — then fetch latest from backend
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return; // no token, just use localStorage data
        }

        const response = await fetch("http://127.0.0.1:8000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
          setName(data.name);
          setPhone(data.phone_number || "");
          setPhotoPreview(data.profile_photo || null);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch {
        // backend unreachable — silently use localStorage data
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  /* ✅ Convert file to base64 */
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload  = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  /* ✅ Save edited profile */
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let photoData = user.profile_photo;
      if (photoFile) {
        photoData = await convertToBase64(photoFile);
      }

      // ✅ Fixed — tries both keys
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone_number : phone,
          profile_photo: photoData,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setPhotoPreview(data.profile_photo);
        localStorage.setItem("user", JSON.stringify(data));
        setSuccess("Profile updated successfully!");
        setEditMode(false);
        setPhotoFile(null);
      } else {
        setError(data.detail || "Failed to update profile.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  /* ✅ Cancel edit */
  const handleCancel = () => {
    setName(user.name);
    setPhone(user.phone_number || "");
    setPhotoPreview(user.profile_photo || null);
    setPhotoFile(null);
    setEditMode(false);
    setError("");
    setSuccess("");
  };

  /* ✅ Role badge styles */
  const roleBadge = {
    Admin:             { color: "#f87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   icon: "🛡️" },
    "Facility Manager":{ color: "#34d399", bg: "rgba(14,159,110,0.12)",  border: "rgba(14,159,110,0.25)",  icon: "🏛️" },
    Student:           { color: "#60a5fa", bg: "rgba(26,86,219,0.12)",   border: "rgba(26,86,219,0.25)",   icon: "🎓" },
    Staff:             { color: "#a78bfa", bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.25)",  icon: "👔" },
  };

  /* ✅ Back to correct dashboard based on role */
  const goBack = () => {
    const role = user?.role;
    if (role === "Admin")              navigate("/admin-dashboard");
    else if (role === "Facility Manager") navigate("/manager-dashboard");
    else                               navigate("/student-dashboard");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const badge = roleBadge[user?.role] || roleBadge["Student"];

  /* ── Loading state ── */
  if (loading || !user) {
    return (
      <>
        <div className="bg-mesh" />
        <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "var(--text-dim)", fontSize: 16 }}>Loading profile…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-mesh" />
      <div className="page-wrapper">

        {/* ── Navbar ── */}
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="navbar-icon">🏫</div>
            SmartCampus
          </div>
          <button
            onClick={goBack}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 18px",
              color: "var(--text-primary)", cursor: "pointer",
              fontSize: 14, fontWeight: 500,
            }}
          >
            ← Back to Dashboard
          </button>
        </nav>

        {/* ── Main Content ── */}
        <main className="dashboard-main" style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* Hero */}
          <div className="dashboard-hero" style={{ marginBottom: 32 }}>
            <div className="welcome-tag" style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}>
              {badge.icon} My Profile
            </div>
            <h1 className="dashboard-title">Account Details</h1>
            <p className="dashboard-subtitle">View and manage your personal information.</p>
          </div>

          {/* Alerts */}
          {error   && <div className="toast toast-error"   style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div className="toast toast-success" style={{ marginBottom: 16 }}>{success}</div>}

          {/* ── Profile Card ── */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, overflow: "hidden",
          }}>

            {/* ── Top — Avatar + Name + Role ── */}
            <div style={{
              padding: "36px 32px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", gap: 24,
              flexWrap: "wrap",
            }}>
              {/* Avatar with edit button */}
              <div style={{ position: "relative" }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={user.name}
                    style={{
                      width: 90, height: 90, borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid rgba(255,255,255,0.15)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: "linear-gradient(135deg, #1a56db, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, fontWeight: 700, color: "#fff",
                    border: "3px solid rgba(255,255,255,0.15)",
                  }}>
                    {initials}
                  </div>
                )}

                {/* Edit photo icon — only in edit mode */}
                {editMode && (
                  <label style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#1a56db",
                    border: "2px solid #0f172a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 13,
                  }}>
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Name + Role badge */}
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  {user.name}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 14px", borderRadius: 999,
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  fontSize: 13, fontWeight: 600, color: badge.color,
                }}>
                  {badge.icon} {user.role}
                </div>
              </div>

              {/* Edit Profile button */}
              {!editMode && (
                <button
                  onClick={() => { setEditMode(true); setSuccess(""); }}
                  style={{
                    marginLeft: "auto",
                    background: "rgba(26,86,219,0.15)",
                    border: "1px solid rgba(26,86,219,0.3)",
                    borderRadius: 8, padding: "8px 20px",
                    color: "#60a5fa", cursor: "pointer",
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {/* ── Details ── */}
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Full Name */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Full Name
                </div>
                {editMode ? (
                  <input
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                ) : (
                  <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500 }}>{user.name}</div>
                )}
              </div>

              {/* Email — read only */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Email Address
                </div>
                <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                  {user.email}
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 999,
                    background: "rgba(14,159,110,0.12)",
                    color: "#34d399", fontWeight: 600,
                  }}>
                    verified
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Phone Number
                </div>
                {editMode ? (
                  <input
                    className="field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                  />
                ) : (
                  <div style={{ fontSize: 15, color: user.phone_number ? "var(--text-primary)" : "var(--text-dim)", fontWeight: 500 }}>
                    {user.phone_number || "Not provided"}
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Member Since
                </div>
                <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500 }}>
                  {new Date(user.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
              </div>

              {/* Save / Cancel buttons */}
              {editMode && (
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #1a56db, #7c3aed)",
                      border: "none", borderRadius: 10,
                      padding: "12px 0", color: "#fff",
                      fontSize: 15, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving…" : "💾 Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "12px 0",
                      color: "var(--text-dim)",
                      fontSize: 15, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Profile;