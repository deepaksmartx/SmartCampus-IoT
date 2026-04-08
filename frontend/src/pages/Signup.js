import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [profile_photo, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Send JSON — matches RegisterRequest schema in schemas.py
      const response = await fetch("http://127.0.0.1:8000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone_number,                          // matches schema field name
          profile_photo: null,                   // URL upload handled separately
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.detail || "Signup failed. Email may already be in use.");
      }
    } catch {
      setError("Could not connect to the server. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="page-wrapper">
        <div className="auth-container">
          <div className="auth-card">

            <div className="brand-mark">
              <div className="brand-icon">🏫</div>
              <span className="brand-name">SmartCampus</span>
            </div>

            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">Join your campus management platform</p>

            {error && <div className="toast toast-error">{error}</div>}

            <form onSubmit={handleSignup}>
              <div className="field-group">
                <label className="field-label">Full name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Email address</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <input
                  className="field-input"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Role</label>
                <select
                  className="field-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  style={{
                    cursor: "pointer",
                    backgroundColor: "#1e293b",
                    color: role ? "var(--text-primary)" : "var(--text-dim)",
                    colorScheme: "dark",
                  }}
                >
                  <option value="" disabled style={{ background: "#1e293b", color: "#64748b" }}>
                    Select your role
                  </option>
                  <option value="Student"          style={{ background: "#1e293b", color: "#f8fafc" }}>Student</option>
                  <option value="Admin"            style={{ background: "#1e293b", color: "#f8fafc" }}>Admin</option>
                  <option value="Facility Manager" style={{ background: "#1e293b", color: "#f8fafc" }}>Facility Manager</option>
                  <option value="Staff"            style={{ background: "#1e293b", color: "#f8fafc" }}>Staff</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Phone number</label>
                <input
                  className="field-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone_number}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Profile photo <span style={{color:"var(--text-dim)", fontSize:12}}>(optional — can add later)</span></label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: photoPreview ? "transparent" : "rgba(26,86,219,0.12)",
                      border: "2px dashed rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                      transition: "border-color 0.2s",
                    }}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 22 }}>📷</span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
                      {profile_photo ? profile_photo.name : "Choose a photo"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                      JPG, PNG or WEBP — max 5 MB
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfilePhoto(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>

            <hr className="divider" />

            <p className="auth-footer">
              Already have an account?{" "}
              <a onClick={() => navigate("/login")}>Sign in</a>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;