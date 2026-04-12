import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="page-wrapper">
        <div className="home-page">

          <div className="home-badge">
            🏫 Smart Campus Platform
          </div>

          <h1 className="home-title">
            Campus Management<br />
            <span>Made Effortless</span>
          </h1>

          <p className="home-desc">
            Book facilities, manage rooms, raise maintenance tickets — everything
            your campus needs, in one modern platform.
          </p>

          <div className="home-actions">
            {isLoggedIn ? (
              <button
                className="home-btn-primary"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  className="home-btn-primary"
                  onClick={() => navigate("/login")}
                >
                  Sign In →
                </button>
                <button
                  className="home-btn-outline"
                  onClick={() => navigate("/signup")}
                >
                  Create Account
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default Home;