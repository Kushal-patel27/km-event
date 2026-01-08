import { useState, useEffect } from "react";
import API from "../services/api";
import SuperAdminLayout from "../components/SuperAdminLayout";

export default function SuperAdminStaff() {
  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ eventId: "", gate: "" });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff", // staff or staff_admin
    eventIds: [],
    gates: [],
  });

  // Fetch staff and events
  useEffect(() => {
    fetchStaff();
    fetchEvents();
  }, [page, search, filter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
      });
      if (filter.eventId) params.append("eventId", filter.eventId);
      if (filter.gate) params.append("gate", filter.gate);

      const response = await API.get(`/super-admin/staff?${params}`);
      setStaff(response.data.staff || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await API.get("/events?limit=999");
      setEvents(response.data.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEventSelect = (eventId) => {
    setFormData((prev) => ({
      ...prev,
      eventIds: prev.eventIds.includes(eventId)
        ? prev.eventIds.filter((id) => id !== eventId)
        : [...prev.eventIds, eventId],
    }));
  };

  const handleGateChange = (e) => {
    const gates = e.target.value.split(",").map((g) => g.trim());
    setFormData((prev) => ({
      ...prev,
      gates: gates.filter((g) => g),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!formData.name || !formData.email) {
        setError("Name and email are required");
        setLoading(false);
        return;
      }

      if (editingId) {
        // Update
        await API.put(`/super-admin/staff/${editingId}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          eventIds: formData.eventIds,
          gates: formData.gates,
        });
        setSuccess("Staff member updated successfully");
      } else {
        // Create
        await API.post("/super-admin/staff", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          eventIds: formData.eventIds,
          gates: formData.gates,
        });
        setSuccess("Staff member created successfully");
      }

      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save staff");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingId(staffMember._id);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role || "staff",
      eventIds: staffMember.assignedEvents || [],
      gates: staffMember.assignedGates || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm("Are you sure you want to deactivate this staff member?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await API.delete(`/super-admin/staff/${staffId}`);
      setSuccess("Staff member deactivated successfully");
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete staff");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "staff",
      eventIds: [],
      gates: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <SuperAdminLayout title="Staff Management" subtitle="Global Scanner Staff Control">
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />

          <select
            value={filter.eventId}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, eventId: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by gate..."
            value={filter.gate}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, gate: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            {showForm ? "Cancel" : "Add Staff"}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 p-6 bg-slate-800 border border-slate-700 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? "Edit Staff Member" : "Create Staff Member"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Staff Type
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="staff">Staff (Scanner Only) 🎫📱 - Entry execution only</option>
                  <option value="staff_admin">Staff Admin (Gate/Team Manager) 🎯 - Manage staff & approve entries</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {formData.role === "staff" 
                    ? "Scanner staff can only scan tickets and check status"
                    : "Staff Admin can create scanner staff, assign gates, and approve manual entries"}
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Assign to Events
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {events.map((event) => (
                    <label key={event._id} className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={formData.eventIds.includes(event._id)}
                        onChange={() => handleEventSelect(event._id)}
                        className="mr-2 w-4 h-4"
                      />
                      <span className="text-sm truncate">{event.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Only show gates for staff (scanner) role */}
              {formData.role === "staff" && (
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    Gates/Zones (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Gate A, Gate B, Gate C"
                    value={formData.gates.join(", ")}
                    onChange={handleGateChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Assign specific entry gates for scanner staff
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="px-6 py-3 text-left text-white font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Type</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Events</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Gates</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && staff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                      Loading staff...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member._id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-white font-medium">{member.name}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{member.email}</td>
                      <td className="px-6 py-4 text-white">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            member.role === "staff_admin"
                              ? "bg-purple-600/30 text-purple-200"
                              : "bg-blue-600/30 text-blue-200"
                          }`}
                        >
                          {member.role === "staff_admin" ? "🎯 Staff Admin" : "🎫📱 Scanner"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {member.assignedEvents?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assignedEvents.map((event) => (
                              <span
                                key={event._id || event}
                                className="px-2 py-1 bg-blue-600/30 text-blue-200 text-xs rounded"
                              >
                                {event.title || event}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">No events</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {member.assignedGates?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assignedGates.map((gate, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded">
                                {gate}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">No gates</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            member.active
                              ? "bg-green-600/30 text-green-200"
                              : "bg-red-600/30 text-red-200"
                          }`}
                        >
                          {member.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member._id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </SuperAdminLayout>
  );
}
