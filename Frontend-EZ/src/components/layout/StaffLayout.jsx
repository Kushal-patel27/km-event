import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'

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
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo dark={false} key="staff-logo" size="lg" />
            <h1 className="text-sm sm:text-base font-semibold">Staff Scanner</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm">
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500 hidden sm:block">Staff</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto pb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>
        {children}
      </main>
    </div>
  )
}
