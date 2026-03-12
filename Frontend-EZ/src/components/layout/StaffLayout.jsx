import React from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

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
    { path: '/staff/scanner', label: 'Scanner', icon: '📟' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="responsive-role-shell role-shell-staff min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="sm:hidden"><Logo dark={false} key="staff-logo-sm" size="sm" /></span>
            <span className="hidden sm:block"><Logo dark={false} key="staff-logo" size="lg" /></span>
            <h1 className="text-sm sm:text-base font-semibold dark:text-white truncate">Staff Scanner</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            {scannerNav.map((item) => (
              item.disabled ? (
                <div
                  key={item.path}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  title="Requires Redis - Currently disabled"
                >
                  {item.label}
                </div>
              ) : (
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
              )
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex">
              <NavigationButtons
                homeTo="/staff/scanner"
                homeLabel="Scanner"
                showLabels={false}
                size="sm"
              />
            </div>
            <div className="text-xs sm:text-sm hidden sm:block">
              <div className="font-medium dark:text-white">{user?.name}</div>
              <div className="text-gray-500">Staff</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded transition flex-shrink-0"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t dark:border-gray-700 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {scannerNav.map((item) => (
              item.disabled ? (
                <div
                  key={item.path}
                  className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-400 cursor-not-allowed"
                  title="Requires Redis - Currently disabled"
                >
                  {item.icon} {item.label}
                </div>
              ) : (
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
              )
            ))}
          </div>
        </div>
      </header>

      <main className="role-shell-main p-4 sm:p-6 max-w-7xl mx-auto pb-8 min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white mb-4">{title}</h2>
        <div className="role-shell-content min-w-0">{children}</div>
      </main>
    </div>
  )
}
