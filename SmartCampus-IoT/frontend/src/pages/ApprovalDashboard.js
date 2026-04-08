import React, { useState, useEffect } from "react";
import { approvalAPI, facilityAPI } from "../services/api";
import "../App.css";

function ApprovalDashboard() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [facilities, setFacilities] = useState({});

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalAPI.getPendingApprovals();
      setPendingBookings(data);

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
      setError(err.message || "Failed to load pending approvals");
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      setIsSubmitting(true);
      await approvalAPI.approveBooking(bookingId, {
        reason: "Approved by facility manager",
      });
      setSuccessMessage("Booking approved successfully!");
      setError(null);
      fetchPendingApprovals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to approve booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (bookingId) => {
    if (!selectedBooking || !rejectReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setIsSubmitting(true);
      await approvalAPI.rejectBooking(bookingId, {
        reason: rejectReason,
      });
      setSuccessMessage("Booking rejected successfully!");
      setError(null);
      setSelectedBooking(null);
      setRejectReason("");
      fetchPendingApprovals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to reject booking");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "10px" }}>
            ✅ Booking Approvals
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            Review and approve facility booking requests
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "rgba(251,146,60,0.15)",
              border: "1px solid rgba(251,146,60,0.3)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#fed7aa",
                marginBottom: "4px",
              }}
            >
              {pendingBookings.length}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
              Pending Approvals
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#86efac",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
            }}
          >
            ✓ {successMessage}
          </div>
        )}

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
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading pending approvals...
            </p>
          </div>
        ) : pendingBookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "rgba(30,41,59,0.6)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>✓</div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              No pending approvals at the moment!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pendingBookings.map((booking) => {
              const facility = facilities[booking.facility_id];
              return (
                <div
                  key={booking.id}
                  style={{
                    background: "rgba(30,41,59,0.6)",
                    border: "1px solid rgba(251,146,60,0.3)",
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
                      <div style={{ marginBottom: "12px" }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {facility?.name || `Facility #${booking.facility_id}`}
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.5)",
                            margin: "0",
                          }}
                        >
                          Requested by User #{booking.user_id}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "16px",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.6)",
                          marginBottom: "12px",
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
                              CAPACITY NEEDED:
                            </span>{" "}
                            {facility.capacity}
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <p
                          style={{
                            padding: "8px 12px",
                            background: "rgba(15,23,42,0.6)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.7)",
                            margin: "0",
                          }}
                        >
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={isSubmitting}
                        style={{
                          padding: "8px 16px",
                          background: "rgba(34,197,94,0.8",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedBooking(booking)}
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
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reject Modal */}
        {selectedBooking && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: "999",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setSelectedBooking(null)}
          >
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "400px",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>
                Reject Booking
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "16px",
                }}
              >
                Please provide a reason for rejecting this booking:
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  minHeight: "100px",
                  fontFamily: "inherit",
                  marginBottom: "20px",
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleReject(selectedBooking.id)}
                  disabled={isSubmitting || !rejectReason.trim()}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: "rgba(239,68,68,0.8)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: isSubmitting || !rejectReason.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Rejecting..." : "Reject Booking"}
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalDashboard;
