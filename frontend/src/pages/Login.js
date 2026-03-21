import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // FastAPI OAuth2PasswordRequestForm requires form-encoded data, NOT JSON
      const formData = new URLSearchParams();
      formData.append("username", email);   // FastAPI expects "username" field
      formData.append("password", password);

      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Store token
        localStorage.setItem("access_token", data.access_token);
        
        // Fetch user profile
        const profileResponse = await fetch("http://127.0.0.1:8000/users/profile", {
          method: "GET",
          headers: { "Authorization": `Bearer ${data.access_token}` },
        });
        
        const userProfile = await profileResponse.json();
        
        if (profileResponse.ok) {
          localStorage.setItem("user", JSON.stringify(userProfile));
          localStorage.setItem("role", userProfile.role);

          // Redirect based on role
          if (userProfile.role === "Admin") {
            navigate("/admin-dashboard");
          } else if (userProfile.role === "Facility Manager") {
            navigate("/manager-dashboard");
          } else {
            navigate("/student-dashboard");
          }
        } else {
          setError("Could not fetch user profile. Please try again.");
        }
      } else {
        setError(data.detail || "Invalid credentials. Please try again.");
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

            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to your campus account</p>

            {error && <div className="toast toast-error">{error}</div>}

            <form onSubmit={handleLogin}>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <hr className="divider" />

            <p className="auth-footer">
              Don't have an account?{" "}
              <a onClick={() => navigate("/signup")}>Create one</a>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}

export default Login;