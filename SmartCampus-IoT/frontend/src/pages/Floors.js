import React, { useState, useEffect } from "react";
import { floorAPI, buildingAPI } from "../services/api";
import "../styles/Floors.css";

const Floors = () => {
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuildingId, setFilterBuildingId] = useState("");

  const [formData, setFormData] = useState({
    floor_no: "",
    building_id: "",
  });

  // Fetch floors on component mount
  useEffect(() => {
    fetchFloors();
    fetchBuildings();
  }, []);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await floorAPI.getAllFloors();
      setFloors(data);
    } catch (err) {
      setError(err.message || "Failed to load floors");
      console.error("Error fetching floors:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const data = await buildingAPI.getAllBuildings();
      setBuildings(data);
    } catch (err) {
      console.error("Error fetching buildings:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "floor_no" ? parseInt(value) || "" : value,
    });
  };

  const resetForm = () => {
    setFormData({
      floor_no: "",
      building_id: "",
    });
    setEditingFloor(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.floor_no || formData.floor_no === "") {
      setError("Floor number is required");
      return;
    }
    if (!formData.building_id) {
      setError("Building is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingFloor) {
        // Update floor
        await floorAPI.updateFloor(editingFloor.id, formData);
        alert("Floor updated successfully!");
      } else {
        // Create new floor
        await floorAPI.createFloor(formData);
        alert("Floor created successfully!");
      }

      resetForm();
      fetchFloors();
    } catch (err) {
      setError(err.message || "Error saving floor");
      console.error("Error saving floor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (floor) => {
    setEditingFloor(floor);
    setFormData({
      floor_no: floor.floor_no,
      building_id: floor.building_id,
    });
    setShowForm(true);
  };

  const handleDelete = async (floorId) => {
    if (window.confirm("Are you sure you want to delete this floor?")) {
      try {
        setLoading(true);
        setError(null);
        await floorAPI.deleteFloor(floorId);
        alert("Floor deleted successfully!");
        fetchFloors();
      } catch (err) {
        setError(err.message || "Error deleting floor");
        console.error("Error deleting floor:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Get building name by ID
  const getBuildingName = (buildingId) => {
    if (!buildings || buildings.length === 0) {
      return "Loading...";
    }
    
    // Ensure we compare the same types
    const buildingIdNum = parseInt(buildingId);
    const building = buildings.find((b) => {
      const bIdNum = parseInt(b.id);
      return bIdNum === buildingIdNum;
    });
    
    if (!building) {
      console.warn(`Building with ID ${buildingId} not found. Available buildings:`, buildings);
      return `Building #${buildingId}`;
    }
    
    // Building response has 'name' field (not 'building_name')
    return building.name || `Building #${buildingId}`;
  };

  // Filter floors
  const filteredFloors = floors.filter((floor) => {
    const matchesSearch =
      floor.floor_no.toString().includes(searchTerm) ||
      getBuildingName(floor.building_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesBuilding =
      !filterBuildingId || floor.building_id === parseInt(filterBuildingId);

    return matchesSearch && matchesBuilding;
  });

  return (
    <div className="floors-container">
      <div className="floors-header">
        <h1>Floors Management</h1>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cancel" : "+ Add Floor"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="form-section">
          <h2>{editingFloor ? "Edit Floor" : "Create New Floor"}</h2>
          <form onSubmit={handleSubmit} className="floor-form">
            <div className="form-group">
              <label htmlFor="floor_no">Floor Number:</label>
              <input
                type="number"
                id="floor_no"
                name="floor_no"
                value={formData.floor_no}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="building_id">Building:</label>
              <select
                id="building_id"
                name="building_id"
                value={formData.building_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a building</option>
                {buildings.length > 0 ? (
                  buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading buildings...</option>
                )}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success" disabled={loading}>
                {loading ? "Saving..." : editingFloor ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by floor number or building..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterBuildingId}
          onChange={(e) => setFilterBuildingId(e.target.value)}
          className="filter-select"
        >
          <option value="">All Buildings</option>
          {buildings.length > 0 ? (
            buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))
          ) : (
            <option disabled>Loading buildings...</option>
          )}
        </select>
      </div>

      {/* Floors Table */}
      {loading && !showForm ? (
        <div className="loading">Loading floors...</div>
      ) : filteredFloors.length === 0 ? (
        <div className="no-data">
          {floors.length === 0
            ? "No floors found. Create one to get started!"
            : "No floors match your filters."}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="floors-table">
            <thead>
              <tr>
                <th>Floor Number</th>
                <th>Building</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFloors.map((floor) => (
                <tr key={floor.id}>
                  <td>{floor.floor_no}</td>
                  <td>{getBuildingName(floor.building_id)}</td>
                  <td className="actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(floor)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(floor.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="floors-footer">
        <p>
          Total Floors: <strong>{filteredFloors.length}</strong>
        </p>
      </div>
    </div>
  );
};

export default Floors;
