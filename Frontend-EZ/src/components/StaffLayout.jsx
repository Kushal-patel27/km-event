import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function StaffLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/staff/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo dark={false} key="staff-logo" size="lg" />
            <h1 className="text-sm font-semibold">Staff Scanner</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs">
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500">Staff</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </main>
    </div>
  )
}
