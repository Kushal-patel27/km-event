import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

export default function SuperAdminLayout({ title = 'Super Admin', subtitle = 'System Owner', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = [
    { to: '/super-admin', label: 'Overview', icon: '📊' },
    { to: '/super-admin/users', label: 'Users & Roles', icon: '👥' },
    { to: '/super-admin/staff', label: 'Staff (Scanner)', icon: '🎫' },
    { to: '/super-admin/events', label: 'Events', icon: '📅' },
    { to: '/super-admin/event-requests', label: 'Event Requests', icon: '✉️', matchPrefix: '/super-admin/event-requests' },
    { to: '/super-admin/bookings', label: 'Bookings', icon: '🎫' },
    { to: '/super-admin/scanner-analytics', label: 'QR Analytics', icon: '📊' },
    { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: '💳' },
    { to: '/super-admin/config', label: 'System Config', icon: '⚙️' },
    { to: '/super-admin/logs', label: 'Logs', icon: '🗒️' },
    { to: '/super-admin/export', label: 'Export', icon: '📦' },
  ]

  async function handleLogout() {
    await logout()
    navigate('/super-admin/login')
  }

  const isActive = (item) => {
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix)
    }
    return location.pathname === item.to
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
              <button
                className="md:hidden p-1.5 sm:p-2 rounded-lg transition hover:bg-slate-100 flex-shrink-0"
                aria-label="Toggle sidebar"
                onClick={() => setOpen(!open)}
              >
                {open ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Logo dark={false} size="4xl" key="super-admin-logo" />
              </Link>
              <div className="hidden md:block border-l border-slate-200 h-6" />
              <div className="min-w-0 flex-1 md:flex-none">
                <p className="text-[11px] sm:text-sm font-semibold text-slate-700 truncate">Super Admin</p>
                <p className="text-[9px] sm:text-xs text-slate-500 hidden sm:block">Platform Control</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <NavigationButtons
                homeTo="/super-admin"
                homeLabel="Overview"
                showLabels={false}
                size="sm"
              />
              <div className="hidden sm:flex flex-col items-end text-right">
                <p className="text-xs sm:text-sm font-semibold">{user?.name || 'System Owner'}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex-shrink-0"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white border border-slate-200 rounded-xl p-2 sm:p-3 shadow-sm"
              >
                <nav className="flex flex-col gap-1">
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`px-2.5 sm:px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium ${
                        isActive(item)
                          ? 'bg-purple-600 text-white shadow'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden md:block bg-white border border-slate-200 rounded-xl p-2 sm:p-3 h-fit shadow-sm self-start md:sticky md:top-20 max-h-[calc(100vh-6rem)] overflow-auto">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-2.5 sm:px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium ${
                    isActive(item)
                      ? 'bg-purple-600 text-white shadow'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="space-y-6 pb-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
