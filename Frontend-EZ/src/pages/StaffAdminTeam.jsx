import React, { useEffect, useState } from 'react'
import StaffAdminLayout from '../components/StaffAdminLayout'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function StaffAdminTeam() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    eventIds: []
  })

  useEffect(() => {
    fetchStaff()
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      // Only events the staff admin can access
      const res = await API.get('/staff-admin/dashboard')
      setEvents(res.data?.events || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    }
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const res = await API.get('/staff-admin/staff')
      setStaff(res.data.staff || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const isSelf = editingStaff && user && editingStaff._id === user._id
      const safeEventIds = isSelf
        ? (editingStaff?.assignedEvents?.map(e => e._id || e) || [])
        : formData.eventIds

      const payload = { ...formData, eventIds: safeEventIds }
      if (editingStaff && !payload.password) delete payload.password

      if (editingStaff) {
        await API.put(`/staff-admin/staff/${editingStaff._id}`, payload)
      } else {
        await API.post('/staff-admin/staff', payload)
      }

      setShowModal(false)
      setEditingStaff(null)
      setFormData({ name: '', email: '', password: '', role: 'staff', eventIds: [] })
      fetchStaff()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff member')
    }
  }

  const handleEdit = (member) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      eventIds: member.assignedEvents?.map(e => e._id || e) || []
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return
    try {
      await API.delete(`/staff-admin/staff/${id}`)
      fetchStaff()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete staff member')
    }
  }

  const handleAddNew = () => {
    setEditingStaff(null)
    setFormData({ name: '', email: '', password: '', role: 'staff', eventIds: [] })
    setShowModal(true)
  }

  const isSelfEditing = editingStaff && user && editingStaff._id === user._id

  if (loading) {
    return (
      <StaffAdminLayout title="Team Members">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </StaffAdminLayout>
    )
  }

  return (
    <StaffAdminLayout title="Team Members">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Staff Members</h2>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            + Add Staff Member
          </button>
        </div>

        {staff.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No staff members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Assigned Events</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const memberId = member._id || member.id
                  const userId = user?._id || user?.id
                  const isSelfRow = (memberId && userId && String(memberId) === String(userId))
                    || (user?.email && member.email && user.email.toLowerCase() === member.email.toLowerCase())
                  return (
                  <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 space-y-1">
                      {(member.assignedEvents || []).length === 0 && <span className="text-gray-400">None</span>}
                      {(member.assignedEvents || []).map(evId => {
                        const ev = events.find(e => e._id === (evId._id || evId))
                        return (
                          <div key={evId._id || evId} className="flex items-center gap-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{ev?.title || 'Event'}</span>
                          </div>
                        )
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelfRow ? (
                        <span className="text-xs text-gray-500 mr-2">(This is you)</span>
                      ) : (
                        <button
                          onClick={() => handleEdit(member)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSelfEditing && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                  You cannot change your own assigned events.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStaff && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required={!editingStaff}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="staff">Staff (Scanner)</option>
                  <option value="staff_admin">Staff Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Events
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {events.length === 0 && (
                    <p className="text-sm text-gray-500">No events available</p>
                  )}
                  {events.map(ev => {
                    const checked = formData.eventIds.includes(ev._id)
                    return (
                      <label key={ev._id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isSelfEditing}
                          onChange={(e) => {
                            if (isSelfEditing) return
                            const next = e.target.checked
                              ? [...formData.eventIds, ev._id]
                              : formData.eventIds.filter(id => id !== ev._id)
                            setFormData({ ...formData, eventIds: next })
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span>{ev.title}</span>
                        <span className="text-xs text-gray-500">{new Date(ev.date).toLocaleDateString()}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {editingStaff ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingStaff(null)
                    setFormData({ name: '', email: '', password: '', role: 'staff', eventIds: [] })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffAdminLayout>
  )
}
