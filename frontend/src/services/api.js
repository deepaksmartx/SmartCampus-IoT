// src/api/api.js

import axios from "axios";

const BASE_URL = "http://localhost:8000";

// ── Axios Instance ─────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor (auto attach token) ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor (handle token expiry) ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // redirect to login
    }
    return Promise.reject(error);
  }
);


// ── Auth APIs ──────────────────────────────────────────────────
export const authAPI = {

  register: async (userData) => {
    // userData: { name, email, password, role, phone_number, profile_photo }
    const response = await api.post("/users/register", userData);
    return response.data;
  },

  login: async (email, password) => {
    // FastAPI OAuth2 expects form data for /login
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI uses "username" field
    formData.append("password", password);

    const response = await api.post("/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // Save token to localStorage
    localStorage.setItem("access_token", response.data.access_token);

    // Fetch user profile and save it
    try {
      const profileResponse = await api.get("/users/profile");
      localStorage.setItem("user", JSON.stringify(profileResponse.data));
      return {
        access_token: response.data.access_token,
        user: profileResponse.data,
      };
    } catch (error) {
      // If profile fetch fails, still return token but without user data
      return {
        access_token: response.data.access_token,
        user: null,
      };
    }
  },

  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    // profileData: { name, phone_number, profile_photo }
    // NOTE: Backend endpoint for profile update may not exist yet
    // This is a placeholder for future implementation
    try {
      const response = await api.put("/users/profile", profileData);
      return response.data;
    } catch (error) {
      throw new Error("Profile update not yet implemented on backend");
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },
};


// ── Auth Helper Utils ──────────────────────────────────────────
export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = () => {
  return localStorage.getItem("access_token");
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("access_token");
};

export const getUserRole = () => {
  const user = getStoredUser();
  return user?.role || null;
};


export default api;