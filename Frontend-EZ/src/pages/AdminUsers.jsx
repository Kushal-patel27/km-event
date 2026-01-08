import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'event_admin', label: 'Event Admin' },
  { value: 'staff_admin', label: 'Staff Admin' },
]

export default function AdminUsers() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff_admin', assignedEvents: [] })
  const [editingId, setEditingId] = useState(null)
  const [admins, setAdmins] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Load admins and events
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [adminsRes, eventsRes] = await Promise.all([
          API.get('/auth/admin/users'),
          API.get('/events')
        ])
        setAdmins(adminsRes.data?.admins || [])
        setEvents(eventsRes.data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reset form
  const resetForm = () => {
    setForm({ name: '', email: '', password: '', role: 'staff_admin', assignedEvents: [] })
    setEditingId(null)
  }

  // Edit admin
  const editAdmin = (admin) => {
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
      assignedEvents: admin.assignedEvents?.map(e => typeof e === 'string' ? e : e._id) || []
    })
    setEditingId(admin._id)
  }

  // Save admin (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      if (editingId) {
        // Update
        const updateData = {
          name: form.name,
          email: form.email,
          role: form.role,
          assignedEvents: form.assignedEvents
        }
        if (form.password) updateData.password = form.password
        
        await API.put(`/auth/admin/users/${editingId}`, updateData)
        setMessage('Admin updated successfully')
      } else {
        // Create
        if (!form.password) {
          setError('Password is required for new admins')
          setSaving(false)
          return
        }
        await API.post('/auth/admin/users', form)
        setMessage('Admin created successfully')
      }

      resetForm()
      const res = await API.get('/auth/admin/users')
      setAdmins(res.data?.admins || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save admin')
    } finally {
      setSaving(false)
    }
  }

  // Delete admin
  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return

    try {
      await API.delete(`/auth/admin/users/${adminId}`)
      setMessage('Admin deleted successfully')
      const res = await API.get('/auth/admin/users')
      setAdmins(res.data?.admins || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin')
    }
  }

  const isSuper = user?.role === 'super_admin'
  const canAssignEvents = form.role === 'event_admin' || form.role === 'staff_admin'

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create, edit, and manage admin accounts</p>
        </div>

        {!isSuper && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Only super admins can manage admin accounts.
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-200">{error}</div>
        )}
        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-200">{message}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Admin' : 'Create New Admin'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕ Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isSuper || saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isSuper || saving || editingId} // Email can't change
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editingId ? 'Password (leave empty to keep current)' : 'Password'} {!editingId && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isSuper || saving}
                  placeholder={editingId ? 'Leave empty to keep current password' : 'Set strong password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isSuper || saving}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Assignment */}
          {canAssignEvents && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign Events to {form.role === 'event_admin' ? 'Event Admin' : 'Staff Admin'}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                {events.length > 0 ? (
                  events.map(event => (
                    <label key={event._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={form.assignedEvents.includes(event._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, assignedEvents: [...form.assignedEvents, event._id] })
                          } else {
                            setForm({ ...form, assignedEvents: form.assignedEvents.filter(id => id !== event._id) })
                          }
                        }}
                        disabled={!isSuper || saving}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{event.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({event.location})</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No events available</p>
                )}
              </div>
              {form.assignedEvents.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {form.assignedEvents.length} event(s) assigned
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!isSuper || saving}
            className="w-full px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:bg-gray-400 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving…' : editingId ? 'Update Admin' : 'Create Admin'}
          </button>
        </form>

        {/* Admins List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Existing Admins</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading…</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No admins yet. Create one to get started.</div>
          ) : (
            <div className="space-y-3">
              {admins.map(admin => (
                <div key={admin._id} className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{admin.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</div>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === 'super_admin' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                        admin.role === 'event_admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {admin.role}
                      </span>
                      {admin.assignedEvents && admin.assignedEvents.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          📍 {admin.assignedEvents.length} event(s)
                        </div>
                      )}
                    </div>
                    {admin.assignedEvents && admin.assignedEvents.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Events: {admin.assignedEvents.map(e => typeof e === 'string' ? e : e.name).join(', ')}
                      </div>
                    )}
                    {admin.lastLoginAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Last login: {new Date(admin.lastLoginAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => editAdmin(admin)}
                      disabled={!isSuper}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAdmin(admin._id)}
                      disabled={!isSuper}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
