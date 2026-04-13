import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { bookingAPI, facilityAPI } from "../services/api";
import "../App.css";

function BookingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedFacility = location.state?.facility;

  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(preselectedFacility?.id || "");
  const [facilityDetails, setFacilityDetails] = useState(preselectedFacility || null);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("11:00");
  const [academicPeriod, setAcademicPeriod] = useState("Semester");

  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("weekly");
  const [occurrenceCount, setOccurrenceCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);

  useState([]);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);

  useEffect(() => {
    fetchFacilities();
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadFacilityDetails();
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    try {
      const data = await facilityAPI.getAllFacilities();
      setFacilities(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError(err.response?.data?.detail || "Failed to load facilities. Check backend server and login token.");
    }
  };

  const loadFacilityDetails = async () => {
    try {
      if (!selectedFacility) return;
      const facility = await facilityAPI.getFacilityById(selectedFacility);
      setFacilityDetails(facility);
    } catch (err) {
      console.error("Error loading facility:", err);
    }
  };

  const checkConflict = async () => {
    if (!selectedFacility || !startDate || !endDate || !startTime || !endTime) {
      return;
    }

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      const result = await bookingAPI.checkConflict(
        parseInt(selectedFacility),
        startDateTime,
        endDateTime
      );

      setConflict(result.has_conflict);
      if (result.has_conflict) {
        setError(
          `Conflict detected! This facility is booked during the selected time.`
        );
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Conflict check error:", err);
    }
  };

  const handleTimeChange = () => {
    // Debounce conflict check
    const timer = setTimeout(() => {
      checkConflict();
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // Validate inputs
      if (!selectedFacility) {
        setError("Please select a facility");
        return;
      }
      const isHostelBooking =
        facilityDetails?.type === "Hostel" ||
        facilityDetails?.subtype === "Guest Room";

      if (!isHostelBooking && (!startDate || !startTime || !endDate || !endTime)) {
        setError("Please fill in all time fields");
        return;
      }

      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      if (!isHostelBooking && endDateTime <= startDateTime) {
        setError("End time must be after start time");
        return;
      }

      if (conflict) {
        setError("Cannot book due to scheduling conflict");
        return;
      }

      const bookingData = {
        facility_id: parseInt(selectedFacility),
        notes: notes || undefined,
      };

      if (isHostelBooking) {
        bookingData.academic_period = academicPeriod;
      } else {
        bookingData.start_time = startDateTime.toISOString();
        bookingData.end_time = endDateTime.toISOString();
      }

      if (isRecurring) {
        bookingData.recurring_pattern = recurringPattern;
        bookingData.occurrence_count = parseInt(occurrenceCount);
      }

      const result = await bookingAPI.createBooking(bookingData);
      setNewBookingId(result.id);
      setBookingSubmitted(true);
      setError(null);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      if (typeof errorDetail === "object" && errorDetail.error) {
        setError(errorDetail.error);
      } else {
        setError(errorDetail || "Failed to create booking");
      }
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (bookingSubmitted) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            maxWidth: "500px",
            margin: "100px auto",
            padding: "40px",
            textAlign: "center",
            background: "rgba(30,41,59,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>✓</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "10px" }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
            Your booking has been created successfully.
            {facilityDetails?.requires_approval && (
              <span style={{ display: "block", marginTop: "10px" }}>
                ⏳ Awaiting manager approval...
              </span>
            )}
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "30px",
            }}
          >
            Booking ID: {newBookingId}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/my-bookings")}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(26,86,219,0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/facilities")}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#94a3b8",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "10px" }}>
            📅 Book a Facility
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            Reserve a campus facility for your needs
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(30,41,59,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "30px",
          }}
        >
          {/* Facility Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                marginBottom: "8px",
              }}
            >
              Select Facility
            </label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "14px",
              }}
            >
              <option value="">-- Choose a facility --</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} ({facility.type}{facility.subtype ? ` - ${facility.subtype}` : ""}) - Capacity: {facility.capacity}
                </option>
              ))}
            </select>
            {facilities.length === 0 && (
              <p style={{ marginTop: "8px", fontSize: "12px", color: "#fca5a5" }}>
                No facilities found for this account. Login as Manager/Admin or seed data and restart backend.
              </p>
            )}
          </div>

          {/* Facility Details */}
          {facilityDetails && (
            <div
              style={{
                background: "rgba(26,86,219,0.1)",
                border: "1px solid rgba(26,86,219,0.2)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              <p style={{ margin: "0 0 4px 0" }}>
                <strong>{facilityDetails.name}</strong>
              </p>
              <p style={{ margin: "0", color: "rgba(255,255,255,0.6)" }}>
                Capacity: {facilityDetails.capacity} | Approval:{" "}
                {facilityDetails.requires_approval ? "✓ Required" : "✗ Not required"}
              </p>
              {facilityDetails.description && (
                <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.5)" }}>
                  {facilityDetails.description}
                </p>
              )}
            </div>
          )}

          {facilityDetails?.type === "Hostel" || facilityDetails?.subtype === "Guest Room" ? (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  marginBottom: "8px",
                }}
              >
                Academic Period
              </label>
              <select
                value={academicPeriod}
                onChange={(e) => setAcademicPeriod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "14px",
                }}
              >
                <option value="Semester">Semester</option>
                <option value="Trimester">Trimester</option>
              </select>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      marginBottom: "8px",
                    }}
                  >
                    Start Date
                  </label>
                  <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); handleTimeChange(); }} required />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      marginBottom: "8px",
                    }}
                  >
                    Start Time
                  </label>
                  <input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); handleTimeChange(); }} required />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      marginBottom: "8px",
                    }}
                  >
                    End Date
                  </label>
                  <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); handleTimeChange(); }} required />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      marginBottom: "8px",
                    }}
                  >
                    End Time
                  </label>
                  <input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); handleTimeChange(); }} required />
                </div>
              </div>
            </>
          )}

          {/* Conflict Warning */}
          {conflict && (
            <div
              style={{
                background: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.3)",
                color: "#fed7aa",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              ⚠️ This facility is already booked during the selected time. Please choose a different time.
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                marginBottom: "8px",
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requests or notes..."
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "14px",
                minHeight: "80px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Recurring Booking */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ marginRight: "8px", cursor: "pointer" }}
              />
              Make this a recurring booking
            </label>
          </div>

          {isRecurring && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#94a3b8",
                    marginBottom: "8px",
                  }}
                >
                  Recurrence Pattern
                </label>
                <select
                  value={recurringPattern}
                  onChange={(e) => setRecurringPattern(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "14px",
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#94a3b8",
                    marginBottom: "8px",
                  }}
                >
                  Number of Occurrences
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={occurrenceCount}
                  onChange={(e) => setOccurrenceCount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
            <button
              type="submit"
              disabled={loading || conflict}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: conflict ? "rgba(107,114,128,0.5)" : "rgba(26,86,219,0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: conflict ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;
