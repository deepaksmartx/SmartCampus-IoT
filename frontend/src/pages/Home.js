import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
    const token = localStorage.getItem("access_token");
    if (token) {
      // If a token exists, we assume they are logged in for the UI
      // You can also call your /profile backend here to get the actual name
      setIsLoggedIn(true);
      // Optional: fetch user info from your FastAPI /profile endpoint
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token"); // Clear your JWT
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to SmartCampus</h1>
        <p>Intelligent Campus Management System</p>
        
        <div className="button-group">
          {isLoggedIn ? (
            <>
              <p className="welcome-msg">Logged in as Student</p>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
