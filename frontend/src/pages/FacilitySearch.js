import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { facilityAPI } from "../services/api";
import "../App.css";

function FacilitySearch() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [facilityType, setFacilityType] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Building list for filter dropdown
  const [buildings, setBuildings] = useState([]);

  const facilityTypes = [
    "Classroom",
    "Lab",
    "Auditorium",
    "Meeting Room",
    "Sports Court",
    "Library",
    "Cafe",
    "Hostel",
    "Other",
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await facilityAPI.getAllFacilities();
      setFacilities(data);

      // Extract unique buildings from facilities
      const uniqueBuildings = [
        ...new Set(data.map((f) => JSON.stringify({ id: f.building_id }))),
      ].map((b) => JSON.parse(b));
      setBuildings(uniqueBuildings);

      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load facilities");
      console.error("Error fetching facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const filters = {};
      if (facilityType) filters.facility_type = facilityType;
      if (buildingId) filters.building_id = parseInt(buildingId);
      if (minCapacity) filters.min_capacity = parseInt(minCapacity);

      const data = await facilityAPI.getAllFacilities(filters);
      setFacilities(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Filter failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFacilityType("");
    setBuildingId("");
    setMinCapacity("");
    setSearchTerm("");
    fetchFacilities();
  };

  // Filter by search term
  const filteredFacilities = facilities.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBook = (facility) => {
    navigate(`/booking/new`, { state: { facility } });
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            🏢 Browse Facilities
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            Search and book campus facilities
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            background: "rgba(30,41,59,0.8)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Search facilities by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <form onSubmit={handleFilter} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>
                  Facility Type
                </label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                >
                  <option value="">All Types</option>
                  {facilityTypes.map((type) => (
                    <option key={type} value={type.toUpperCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>
                  Minimum Capacity
                </label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
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
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: "#94a3b8",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </form>
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

        {/* Facilities Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading facilities...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              No facilities found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                style={{
                  background: "rgba(30,41,59,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    {facility.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {facility.type}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Capacity:
                    </span>{" "}
                    {facility.capacity}
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Approval:
                    </span>{" "}
                    {facility.requires_approval ? "✓ Required" : "✗ Not required"}
                  </div>
                </div>

                {facility.description && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "16px",
                      lineHeight: "1.4",
                    }}
                  >
                    {facility.description}
                  </p>
                )}

                <button
                  onClick={() => handleBook(facility)}
                  style={{
                    marginTop: "auto",
                    padding: "10px 16px",
                    background: "rgba(26,86,219,0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.background = "rgba(26,86,219,1)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background = "rgba(26,86,219,0.9)")
                  }
                >
                  Book Now →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FacilitySearch;
