import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'

export default function AdminTeam() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [allEvents, setAllEvents] = useState([])
  const [selectedEventIds, setSelectedEventIds] = useState([])
  const [createSelectedEventIds, setCreateSelectedEventIds] = useState([])

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff_admin',
  })

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  // Admins can manage event admins, staff admins, and staff
  const roles = [
    { id: 'event_admin', label: 'Event Admin' },
    { id: 'staff_admin', label: 'Staff Admin' },
    { id: 'staff', label: 'Staff (Scanner)' },
  ]

  useEffect(() => {
    fetchUsers()
  }, [page, search, filterRole, filterActive])

  useEffect(() => {
    if (showDetailsModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetailsModal])

  useEffect(() => {
    if (showCreateModal) {
      fetchAllEvents()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setCreateSelectedEventIds([])
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCreateModal])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', limit)
      if (search) params.append('search', search)
      if (filterRole) params.append('role', filterRole)
      if (filterActive !== '') params.append('active', filterActive)

      console.log('Fetching users from:', `/admin/team?${params.toString()}`)
      const res = await API.get(`/admin/team?${params.toString()}`)
      console.log('Response:', res.data)
      
      setUsers(res.data.users || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('Error fetching users:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch users'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableUser = async (userId, isActive) => {
    try {
      await API.put(`/admin/team/${userId}`, { active: !isActive })
      setUsers(users.map((u) => (u._id === userId ? { ...u, active: !isActive } : u)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status')
    }
  }

  const handleChangeRole = async () => {
    if (!newRole) return

    try {
      await API.put(`/admin/team/${selectedUserForRole._id}`, { role: newRole })
      setUsers(users.map((u) => (u._id === selectedUserForRole._id ? { ...u, role: newRole } : u)))
      setShowRoleModal(false)
      setNewRole('')
      setSelectedUserForRole(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setError('Name, email, and password are required')
      return
    }

    setCreatingUser(true)
    try {
      const res = await API.post('/admin/team', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        assignedEvents: createSelectedEventIds,
      })

      setUsers([res.data.user, ...users])
      setShowCreateModal(false)
      setCreateForm({ name: '', email: '', password: '', role: 'staff_admin' })
      setCreateSelectedEventIds([])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Permanently delete ${userName}? This cannot be undone.`)) {
      return
    }

    try {
      await API.delete(`/admin/team/${userId}`)
      setUsers(users.filter((u) => u._id !== userId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleViewDetails = async (user) => {
    setSelectedUserForDetails({ ...user })
    setSelectedEventIds(user.assignedEvents?.map(e => typeof e === 'object' ? e._id : e) || [])
    await fetchAllEvents()
    setShowDetailsModal(true)
  }

  const fetchAllEvents = async () => {
    try {
      const res = await API.get('/admin/events')
      setAllEvents(res.data.events || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }

  const toggleEventSelection = (eventId) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const toggleCreateEventSelection = (eventId) => {
    setCreateSelectedEventIds(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const handleUpdateDetail = (field, value) => {
    setSelectedUserForDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveDetails = async () => {
    try {
      await API.put(`/admin/team/${selectedUserForDetails._id}`, {
        name: selectedUserForDetails.name,
        email: selectedUserForDetails.email,
        role: selectedUserForDetails.role,
        active: selectedUserForDetails.active,
        assignedEvents: selectedEventIds,
      })
      
      await fetchUsers()
      setShowDetailsModal(false)
      setSelectedUserForDetails(null)
      setSelectedEventIds([])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      event_admin: 'bg-blue-100 text-blue-800',
      staff_admin: 'bg-green-100 text-green-800',
      staff: 'bg-sky-100 text-sky-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    return roles.find((r) => r.id === role)?.label || role
  }

  const totalActiveOnPage = users.filter((u) => u.active).length

  return (
    <AdminLayout title="Team Management" subtitle="Manage team members and their roles">

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{
          label: 'Users on this page',
          value: users.length,
          hint: `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, total)} of ${total}`,
        }, {
          label: 'Active on this page',
          value: totalActiveOnPage,
          hint: `${users.length - totalActiveOnPage} disabled`,
        }, {
          label: 'Filters',
          value: [filterRole || 'All roles', filterActive === '' ? 'All status' : filterActive === 'true' ? 'Active' : 'Disabled'].join(' · '),
          hint: search ? `Search: "${search}"` : 'No search applied',
        }].map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Disabled Only</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSearch('')
              setFilterRole('')
              setFilterActive('')
              setPage(1)
            }}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition border border-gray-200"
          >
            Clear Filters
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium whitespace-nowrap"
          >
            + Create User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Login</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 leading-tight">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                          {user.assignedEvents?.length ? (
                            <div className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                              <p className="font-semibold text-gray-700">Assigned events ({user.assignedEvents.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {user.assignedEvents.slice(0, 2).map((event) => (
                                  <span
                                    key={event._id || event}
                                    className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100"
                                  >
                                    {typeof event === 'object' ? event.title : event}
                                  </span>
                                ))}
                                {user.assignedEvents.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                                    +{user.assignedEvents.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForRole(user)
                              setNewRole(user.role)
                              setShowRoleModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => handleDisableUser(user._id, user.active)}
                            className={`font-medium ${
                              user.active
                                ? 'text-orange-600 hover:text-orange-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.active ? 'Disable' : 'Reactivate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} users
              </p>
              <div className="space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
        </>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUserForRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Change User Role</h3>
              <p className="text-gray-600 mb-4">
                User: <strong>{selectedUserForRole.name}</strong>
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRoleModal(false)
                    setNewRole('')
                    setSelectedUserForRole(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeRole}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Create New Team Member</h3>
                <p className="text-sm text-gray-500 mt-1">Add credentials, choose a role, and assign events before inviting.</p>
              </div>

              <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Name</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Full name"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Password"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Role</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="px-4 py-2.5 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-300 bg-white"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Assign Events</label>
                      <span className="text-xs text-gray-500">{createSelectedEventIds.length} selected</span>
                    </div>

                    {allEvents.length > 0 && (
                      <select
                        onChange={(e) => {
                          const val = e.target.value
                          if (val) toggleCreateEventSelection(val)
                          e.target.value = ''
                        }}
                        defaultValue=""
                        className="w-full px-4 py-2.5 border-2 border-green-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-300 text-sm shadow-sm"
                      >
                        <option value="" disabled>Add event…</option>
                        {allEvents
                          .filter((e) => !createSelectedEventIds.includes(e._id))
                          .map((event) => (
                            <option key={event._id} value={event._id}>
                              {event.title} — {new Date(event.date).toLocaleDateString()}
                            </option>
                          ))}
                      </select>
                    )}

                  </div>
                </div>

              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({ name: '', email: '', password: '', role: 'staff_admin' })
                    setCreateSelectedEventIds([])
                    setError('')
                  }}
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 shadow"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUserForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">User Details</h3>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Name</label>
                    <input
                      type="text"
                      value={selectedUserForDetails.name}
                      onChange={(e) => handleUpdateDetail('name', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={selectedUserForDetails.email}
                      onChange={(e) => handleUpdateDetail('email', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Role</label>
                    <select
                      value={selectedUserForDetails.role}
                      onChange={(e) => handleUpdateDetail('role', e.target.value)}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id} className="py-2">
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <select
                      value={selectedUserForDetails.active ? 'true' : 'false'}
                      onChange={(e) => handleUpdateDetail('active', e.target.value === 'true')}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      <option value="true" className="py-2">✓ Active</option>
                      <option value="false" className="py-2">✗ Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created At</p>
                      <p className="font-medium">
                        {selectedUserForDetails.createdAt 
                          ? new Date(selectedUserForDetails.createdAt).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Login</p>
                      <p className="font-medium">
                        {selectedUserForDetails.lastLoginAt 
                          ? new Date(selectedUserForDetails.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Assign Events ({selectedEventIds.length} selected)</h4>
                    <span className="text-xs text-gray-500">Use dropdown to add</span>
                  </div>

                  {allEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No events available</p>
                  ) : (
                    <select
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) toggleEventSelection(val)
                        e.target.value = ''
                      }}
                      defaultValue=""
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 text-sm shadow-sm"
                    >
                      <option value="" disabled>Add event…</option>
                      {allEvents
                        .filter((e) => !selectedEventIds.includes(e._id))
                        .map((event) => (
                          <option key={event._id} value={event._id}>
                            {event.title} — {new Date(event.date).toLocaleDateString()}
                          </option>
                        ))}
                    </select>
                  )}

                  {selectedEventIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedEventIds.map((id) => {
                        const ev = allEvents.find((e) => e._id === id)
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 text-xs"
                          >
                            <span>{ev ? ev.title : id}</span>
                            <button
                              type="button"
                              onClick={() => toggleEventSelection(id)}
                              className="text-purple-500 hover:text-purple-800 font-semibold"
                              aria-label="Remove event"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedUserForDetails(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
