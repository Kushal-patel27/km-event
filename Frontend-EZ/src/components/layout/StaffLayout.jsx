import React from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'

export default function StaffLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/staff/login')
  }

  // Navigation items for staff
  const scannerNav = [
    { path: '/staff/hp-scanner', label: '📱 Scanner', icon: '🎫' },
    { path: '/staff/scanner', label: 'Legacy Scanner', icon: '📟' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo dark={false} key="staff-logo" size="lg" />
            <h1 className="text-sm sm:text-base font-semibold dark:text-white">Staff Scanner</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            {scannerNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm hidden sm:block">
              <div className="font-medium dark:text-white">{user?.name}</div>
              <div className="text-gray-500">Staff</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t dark:border-gray-700 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {scannerNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto pb-8">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white mb-4">{title}</h2>
        {children}
      </main>
    </div>
  )
}
