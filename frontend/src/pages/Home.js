import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

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