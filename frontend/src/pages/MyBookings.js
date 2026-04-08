import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bookingAPI, facilityAPI } from "../services/api";
import "../App.css";

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilities, setFacilities] = useState({});

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const filters =
        statusFilter !== "all" ? { status_filter: statusFilter } : {};
      const data = await bookingAPI.getUserBookings(filters);
      setBookings(data);

      // Fetch facility details for all bookings
      const facilityIds = new Set(data.map((b) => b.facility_id));
      const facilitiesData = {};
      for (const facilityId of facilityIds) {
        try {
          const facility = await facilityAPI.getFacilityById(facilityId);
          facilitiesData[facilityId] = facility;
        } catch (err) {
          console.error(`Error fetching facility ${facilityId}:`, err);
        }
      }
      setFacilities(facilitiesData);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone."
      )
    ) {
      try {
        await bookingAPI.cancelBooking(bookingId);
        fetchBookings();
      } catch (err) {
        setError(err.message || "Failed to cancel booking");
      }
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "rgba(34,197,94,0.15)";
      case "Pending":
        return "rgba(251,146,60,0.15)";
      case "Cancelled":
        return "rgba(107,114,128,0.15)";
      case "Rejected":
        return "rgba(239,68,68,0.15)";
      default:
        return "rgba(255,255,255,0.05)";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "#86efac";
      case "Pending":
        return "#fed7aa";
      case "Cancelled":
        return "#d1d5db";
      case "Rejected":
        return "#fca5a5";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "10px" }}>
            📋 My Bookings
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            Track all your facility bookings and reservations
          </p>
        </div>

        {/* Status Filter */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "8px 16px",
                background:
                  statusFilter === status
                    ? "rgba(26,86,219,0.9)"
                    : "rgba(255,255,255,0.05)",
                border:
                  statusFilter === status
                    ? "1px solid rgba(26,86,219,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color:
                  statusFilter === status ? "#fff" : "rgba(255,255,255,0.7)",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
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

        {/* Bookings List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "rgba(30,41,59,0.6)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              No bookings found
            </p>
            <button
              onClick={() => navigate("/facilities")}
              style={{
                padding: "8px 16px",
                background: "rgba(26,86,219,0.9)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Browse Facilities
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {bookings.map((booking) => {
              const facility = facilities[booking.facility_id];
              return (
                <div
                  key={booking.id}
                  style={{
                    background: "rgba(30,41,59,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "start",
                      padding: "20px",
                      gap: "20px",
                    }}
                  >
                    {/* Booking Info */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0",
                          }}
                        >
                          {facility?.name || `Facility #${booking.facility_id}`}
                        </h3>
                        <span
                          style={{
                            background: getStatusColor(booking.status),
                            color: getStatusTextColor(booking.status),
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "16px",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>
                            START:
                          </span>{" "}
                          {formatDateTime(booking.start_time)}
                        </div>
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>
                            END:
                          </span>{" "}
                          {formatDateTime(booking.end_time)}
                        </div>
                        {facility && (
                          <div>
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>
                              CAPACITY:
                            </span>{" "}
                            {facility.capacity}
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <p
                          style={{
                            marginTop: "12px",
                            padding: "8px 12px",
                            background: "rgba(15,23,42,0.6)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.7)",
                            margin: "12px 0 0 0",
                          }}
                        >
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}

                      {booking.status === "Pending" && (
                        <p
                          style={{
                            marginTop: "12px",
                            fontSize: "12px",
                            color: "#fed7aa",
                          }}
                        >
                          ⏳ Awaiting manager approval
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {booking.status === "Confirmed" && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/booking/edit/${booking.id}`, {
                                state: { booking },
                              })
                            }
                            style={{
                              padding: "8px 16px",
                              background: "rgba(26,86,219,0.8)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            style={{
                              padding: "8px 16px",
                              background: "rgba(239,68,68,0.8)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        {bookings.length > 0 && (
          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <button
              onClick={() => navigate("/facilities")}
              style={{
                padding: "10px 20px",
                background: "rgba(26,86,219,0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Book More Facilities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
