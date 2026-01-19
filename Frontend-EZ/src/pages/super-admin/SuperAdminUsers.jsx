import React, { useState, useEffect } from 'react'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [limit] = useState(20)

  const roles = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'admin', label: 'Admin' },
    { id: 'event_admin', label: 'Event Admin' },
    { id: 'staff', label: 'Staff (Scanner)' },
    { id: 'staff_admin', label: 'Staff Admin' },
    { id: 'user', label: 'Regular User' },
  ]

  useEffect(() => {
    fetchUsers()
  }, [page, search, filterRole, filterActive])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(filterRole && { role: filterRole }),
        ...(filterActive !== '' && { active: filterActive }),
      })
      const res = await API.get(`/super-admin/users?${params}`)
      setUsers(res.data.users)
      setTotal(res.data.pagination.total)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableUser = async (userId, currentActive) => {
    if (!confirm(`Are you sure you want to ${currentActive ? 'disable' : 'reactivate'} this user?`)) {
      return
    }

    try {
      const url = currentActive ? `/super-admin/users/${userId}/disable` : `/super-admin/users/${userId}/reactivate`
      const res = await API.post(url)
      const updatedUser = res.data?.user

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                ...updatedUser,
                active: updatedUser?.active ?? !currentActive,
                preferences: updatedUser?.preferences ?? u.preferences,
              }
            : u
        )
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  const handleChangeRole = async () => {
    if (!newRole) {
      setError('Please select a role')
      return
    }

    try {
      await API.put(`/super-admin/users/${selectedUserForRole._id}/role`, {
        role: newRole,
      })
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
      const res = await API.post('/super-admin/users', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      })

      setUsers([res.data.user, ...users])
      setShowCreateModal(false)
      setCreateForm({ name: '', email: '', password: '', role: 'user' })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const openPasswordModal = (user) => {
    setPasswordForm({ userId: user._id, newPassword: '', confirmPassword: '' })
    setShowPasswordModal(true)
    setPasswordError('')
  }

  const handleChangePasswordForUser = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation must match')
      return
    }

    try {
      setPasswordSaving(true)
      const { data } = await API.put(`/super-admin/users/${passwordForm.userId}/password`, {
        newPassword: passwordForm.newPassword,
      })
      const updated = data?.user
      if (updated?._id) {
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)))
      }
      setShowPasswordModal(false)
      setPasswordForm({ userId: '', newPassword: '', confirmPassword: '' })
      setPasswordError('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Permanently delete ${userName}? This cannot be undone.`)) {
      return
    }

    try {
      await API.delete(`/super-admin/users/${userId}`)
      setUsers(users.filter((u) => u._id !== userId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleUpdateUser = async (userId, data) => {
    try {
      await API.put(`/super-admin/users/${userId}`, data)
      setUsers(users.map((u) => (u._id === userId ? { ...u, ...data } : u)))
      setEditingUser(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-purple-100 text-purple-800',
      event_admin: 'bg-blue-100 text-blue-800',
      staff: 'bg-amber-100 text-amber-800',
      staff_admin: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    return roles.find((r) => r.id === role)?.label || role
  }

  const totalActiveOnPage = users.filter((u) => u.active).length

  return (
    <SuperAdminLayout title="User Management" subtitle="Create, edit, delete, and assign roles">

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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Login</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
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
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-semibold text-gray-900 leading-tight text-sm">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                          {user.assignedEvents?.length ? (
                            <p className="text-[11px] text-gray-500 mt-1">Assigned events: {user.assignedEvents.length}</p>
                          ) : null}
                        </td>
                        <td className="px-3 sm:px-5 py-4 align-middle">
                          <span className={`mt-1 inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              user.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm text-gray-600">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-xs sm:text-sm space-x-1 sm:space-x-2 whitespace-nowrap">
                          {user.role !== 'super_admin' && (
                            <>
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
                                onClick={() => openPasswordModal(user)}
                                className="text-amber-600 hover:text-amber-900 font-medium"
                              >
                                Reset Password
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
                            </>
                          )}
                          {user.role === 'super_admin' && (
                            <span className="text-gray-500 italic">System Owner</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 my-8">
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
          </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full my-8">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New User</h3>
                
                <div className="space-y-4 mb-6">
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
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({ name: '', email: '', password: '', role: 'user' })
                      setError('')
                    }}
                    disabled={creatingUser}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={creatingUser}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full border border-amber-200 my-8">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Reset User Password</h3>
                  <p className="text-sm text-gray-600 mt-1">This forces sign-out on all devices for this user.</p>
                </div>
                <span className="text-amber-600 text-xl" aria-hidden>⚠️</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md p-3">
                Changing a password immediately invalidates active sessions. Notify the user that their password was reset by an administrator.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Re-enter password"
                  />
                </div>
                {passwordError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ userId: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePasswordForUser}
                  disabled={passwordSaving}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
