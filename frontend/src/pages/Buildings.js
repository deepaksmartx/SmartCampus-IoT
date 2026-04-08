import { useEffect, useState } from "react";
import { buildingAPI, campusAPI } from "../services/api";
import "../App.css";

function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    campus_id: null,
  });

  // Fetch all buildings and campuses on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [buildingsData, campusesData] = await Promise.all([
        buildingAPI.getAllBuildings(),
        campusAPI.getAllCampuses(),
      ]);
      setBuildings(buildingsData);
      setCampuses(campusesData);
      
      // Set default campus_id to first campus if not already set
      if (campusesData.length > 0 && !formData.campus_id) {
        setFormData(prev => ({ ...prev, campus_id: campusesData[0].id }));
      }
      
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update building
        console.log(`Sending UPDATE request for building ${editingId}:`, formData);
        await buildingAPI.updateBuilding(editingId, {
          name: formData.name,
          campus_id: formData.campus_id,
        });
        console.log("Update successful");
      } else {
        // Create building
        console.log("Sending CREATE request:", formData);
        await buildingAPI.createBuilding(formData);
        console.log("Create successful");
      }
      const defaultCampus = campuses.length > 0 ? campuses[0].id : null;
      setFormData({ name: "", campus_id: defaultCampus });
      setEditingId(null);
      setShowForm(false);
      setError(null);
      await fetchData();
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to save building";
      setError(errorMsg);
    }
  };

  const handleEdit = (building) => {
    console.log("Edit clicked for building:", building);
    setEditingId(building.id);
    setFormData({
      name: building.name,
      campus_id: building.campus_id,
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (buildingId) => {
    console.log("Delete clicked for building ID:", buildingId);
    if (window.confirm("Are you sure you want to delete this building?")) {
      try {
        console.log(`Sending DELETE request for building ${buildingId}`);
        await buildingAPI.deleteBuilding(buildingId);
        console.log("Delete successful");
        setError(null);
        await fetchData();
      } catch (err) {
        console.error("Delete error:", err);
        setError(err.message || "Failed to delete building");
      }
    }
  };

  const handleCancel = () => {
    const defaultCampus = campuses.length > 0 ? campuses[0].id : null;
    setEditingId(null);
    setFormData({ name: "", campus_id: defaultCampus });
    setShowForm(false);
  };

  return (
    <div className="page-wrapper">
      <div className="content-section">
        <div className="section-header">
          <h1>🏢 Buildings Management</h1>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Building"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="form-container">
            <h2>{editingId ? "Edit Building" : "Add New Building"}</h2>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-group">
                <label>Building Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Engineering Building"
                  required
                />
              </div>

              <div className="form-group">
                <label>Campus *</label>
                <select
                  value={formData.campus_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, campus_id: parseInt(e.target.value) })
                  }
                  required
                >
                  <option value="">-- Select a Campus --</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? "Update" : "Create"} Building
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Buildings List */}
        {loading ? (
          <p className="loading">Loading buildings...</p>
        ) : buildings.length === 0 ? (
          <p className="empty-state">No buildings found. Create one to get started!</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Building Name</th>
                  <th>Campus</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => {
                  const campus = campuses.find(c => c.id === building.campus_id);
                  return (
                    <tr key={building.id}>
                      <td>{building.id}</td>
                      <td className="building-name">{building.name}</td>
                      <td>{campus ? campus.name : `Campus #${building.campus_id}`}</td>
                      <td>{new Date(building.created_at).toLocaleDateString()}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(building)}
                          title="Edit building"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(building.id)}
                          title="Delete building"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="info-section">
          <p>
            <strong>Tip:</strong> Buildings are organized under Campuses. Make sure the Campus ID exists before creating a building.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Buildings;
