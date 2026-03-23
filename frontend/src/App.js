import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Profile from "./pages/Profile";
import Buildings from "./pages/Buildings";
import Floors from "./pages/Floors";
import "./App.css";

// ✅ Apply saved theme when app loads
const applyTheme = () => {
  const saved = localStorage.getItem("sc_theme") || "dark";
  if (saved === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", saved);
  }
};
applyTheme();


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/floors" element={<Floors />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;