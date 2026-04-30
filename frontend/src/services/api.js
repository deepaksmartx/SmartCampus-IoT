// src/api/api.js

import axios from "axios";

const BASE_URL = "https://smartcampus-iot.onrender.com";

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


// ── Building APIs ──────────────────────────────────────────────
export const buildingAPI = {
  
  createBuilding: async (buildingData) => {
    // buildingData: { name, campus_id }
    const response = await api.post("/buildings/", buildingData);
    return response.data;
  },

  getAllBuildings: async () => {
    const response = await api.get("/buildings/");
    return response.data;
  },

  getBuildingById: async (buildingId) => {
    const response = await api.get(`/buildings/${buildingId}`);
    return response.data;
  },

  getBuildingsByCampus: async (campusId) => {
    const response = await api.get(`/buildings/campus/${campusId}`);
    return response.data;
  },

  updateBuilding: async (buildingId, buildingData) => {
    // buildingData: { name?, campus_id? }
    const response = await api.put(`/buildings/${buildingId}`, buildingData);
    return response.data;
  },

  deleteBuilding: async (buildingId) => {
    const response = await api.delete(`/buildings/${buildingId}`);
    return response.data;
  },
};

export const campusAPI = {
  getAllCampuses: async () => {
    const response = await api.get("/campus/");
    return response.data;
  },

  getCampusById: async (campusId) => {
    const response = await api.get(`/campus/${campusId}`);
    return response.data;
  },

  createCampus: async (campusData) => {
    // campusData: { name }
    const response = await api.post("/campus/", campusData);
    return response.data;
  },

  updateCampus: async (campusId, campusData) => {
    const response = await api.put(`/campus/${campusId}`, campusData);
    return response.data;
  },

  deleteCampus: async (campusId) => {
    const response = await api.delete(`/campus/${campusId}`);
    return response.data;
  },
};

export const floorAPI = {
  createFloor: async (floorData) => {
    // floorData: { floor_no, building_id }
    const response = await api.post("/floors/", floorData);
    return response.data;
  },

  getAllFloors: async () => {
    const response = await api.get("/floors/");
    return response.data;
  },

  getFloorById: async (floorId) => {
    const response = await api.get(`/floors/${floorId}`);
    return response.data;
  },

  getFloorsByBuilding: async (buildingId) => {
    const response = await api.get(`/floors/building/${buildingId}`);
    return response.data;
  },

  updateFloor: async (floorId, floorData) => {
    // floorData: { floor_no?, building_id? }
    const response = await api.put(`/floors/${floorId}`, floorData);
    return response.data;
  },

  deleteFloor: async (floorId) => {
    const response = await api.delete(`/floors/${floorId}`);
    return response.data;
  },
};


// ── Facility APIs ──────────────────────────────────────
export const facilityAPI = {

  createFacility: async (facilityData) => {
    // facilityData: { name, type, building_id, floor_id?, capacity, requires_approval, description? }
    const response = await api.post("/api/facilities/", facilityData);
    return response.data;
  },

  getAllFacilities: async (filters = {}) => {
    // filters: { facility_type?, building_id?, floor_id?, min_capacity? }
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/facilities/?${params}`);
    return response.data;
  },

  getFacilityById: async (facilityId) => {
    const response = await api.get(`/api/facilities/${facilityId}`);
    return response.data;
  },

  updateFacility: async (facilityId, facilityData) => {
    // facilityData: { name?, type?, building_id?, floor_id?, capacity?, requires_approval?, description? }
    const response = await api.put(`/api/facilities/${facilityId}`, facilityData);
    return response.data;
  },

  deleteFacility: async (facilityId) => {
    const response = await api.delete(`/api/facilities/${facilityId}`);
    return response.data;
  },

  getFacilityTypes: async () => {
    const response = await api.get("/api/facilities/config/facility-types");
    return response.data;
  },

  getFacilityInventory: async (facilityId) => {
    const response = await api.get(`/api/facilities/${facilityId}/inventory`);
    return response.data;
  },

  createInventoryItem: async (payload) => {
    const response = await api.post("/api/facilities/inventory", payload);
    return response.data;
  },
};


// ── Booking APIs ───────────────────────────────────────
export const bookingAPI = {

  createBooking: async (bookingData) => {
    // bookingData: { facility_id, start_time, end_time, notes?, recurring_pattern?, occurrence_count? }
    const response = await api.post("/api/bookings/", bookingData);
    return response.data;
  },

  getUserBookings: async (filters = {}) => {
    // filters: { status_filter?, facility_id? }
    const params = new URLSearchParams();
    if (filters.status_filter) params.append("status_filter", filters.status_filter);
    if (filters.facility_id) params.append("facility_id", filters.facility_id);
    const response = await api.get(`/api/bookings/?${params}`);
    return response.data;
  },

  getAdminBookings: async (filters = {}) => {
    // filters: { status_filter?, facility_id?, user_id? }
    const params = new URLSearchParams();
    if (filters.status_filter) params.append("status_filter", filters.status_filter);
    if (filters.facility_id) params.append("facility_id", filters.facility_id);
    if (filters.user_id) params.append("user_id", filters.user_id);
    const response = await api.get(`/api/bookings/admin/all?${params}`);
    return response.data;
  },

  getBookingById: async (bookingId) => {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  updateBooking: async (bookingId, bookingData) => {
    // bookingData: { start_time?, end_time?, notes? }
    const response = await api.put(`/api/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  cancelBooking: async (bookingId) => {
    const response = await api.delete(`/api/bookings/${bookingId}`);
    return response.data;
  },

  checkFacilityAvailability: async (facilityId, date) => {
    // date format: "YYYY-MM-DD"
    const response = await api.get(`/api/bookings/facility/${facilityId}/availability?date=${date}`);
    return response.data;
  },

  checkConflict: async (facilityId, startTime, endTime) => {
    // Check conflict without creating booking
    const params = new URLSearchParams();
    params.append("facility_id", facilityId);
    params.append("start_time", startTime.toISOString());
    params.append("end_time", endTime.toISOString());
    const response = await api.post(`/api/bookings/check-conflict?${params}`);
    return response.data;
  },
};


// ── Approval APIs ──────────────────────────────────────
export const approvalAPI = {

  getPendingApprovals: async (filters = {}) => {
    // filters: { facility_id? }
    const params = new URLSearchParams();
    if (filters.facility_id) params.append("facility_id", filters.facility_id);
    const response = await api.get(`/api/admin/pending-approvals?${params}`);
    return response.data;
  },

  getPendingApprovalsCount: async () => {
    const response = await api.get("/api/admin/pending-approvals/count");
    return response.data;
  },

  approveBooking: async (bookingId, data = {}) => {
    // data: { reason? }
    const response = await api.post(`/api/admin/bookings/${bookingId}/approve`, data);
    return response.data;
  },

  rejectBooking: async (bookingId, data = {}) => {
    // data: { reason? }
    const response = await api.post(`/api/admin/bookings/${bookingId}/reject`, data);
    return response.data;
  },

  getBookingApproval: async (bookingId) => {
    const response = await api.get(`/api/admin/bookings/${bookingId}/approval`);
    return response.data;
  },

  getApprovalsByStatus: async (status, filters = {}) => {
    // status: pending, approved, rejected
    const params = new URLSearchParams();
    params.append("status", status);
    if (filters.facility_id) params.append("facility_id", filters.facility_id);
    const response = await api.get(`/api/admin/approvals/by-status?${params}`);
    return response.data;
  },
};


export default api;