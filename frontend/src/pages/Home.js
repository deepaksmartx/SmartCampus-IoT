import { useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const navigate = useNavigate();

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
          </div>

        </div>
      </div>
    </>
  );
}

export default Home;