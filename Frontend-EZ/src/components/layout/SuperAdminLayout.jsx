import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'

export default function SuperAdminLayout({ title = 'Super Admin', subtitle = 'System Owner', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = [
    { to: '/super-admin', label: 'Overview', icon: '📊' },
    { to: '/super-admin/users', label: 'Users & Roles', icon: '👥' },
    { to: '/super-admin/staff', label: 'Staff (Scanner)', icon: '🎫📱' },
    { to: '/super-admin/events', label: 'Events', icon: '📅' },
    { to: '/super-admin/event-requests', label: 'Event Requests', icon: '✉️', matchPrefix: '/super-admin/event-requests' },
    { to: '/super-admin/bookings', label: 'Bookings', icon: '🎫' },
    { to: '/super-admin/scanner-analytics', label: '⚡ QR Analytics', icon: '📊🎫' },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg transition hover:bg-slate-100"
                aria-label="Toggle sidebar"
                onClick={() => setOpen(!open)}
              >
                {open ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <Link to="/" className="hidden md:flex items-center gap-2">
                <Logo dark={false} key="super-admin-logo" />
              </Link>
              <div className="hidden md:block border-l border-slate-200 h-6" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Super Admin</p>
                <p className="text-xs text-slate-500">Platform Control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold">{user?.name || 'System Owner'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 mt-6">
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
              >
                <nav className="flex flex-col gap-1">
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
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

          <aside className="hidden md:block bg-white border border-slate-200 rounded-xl p-3 h-fit shadow-sm">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="space-y-6 pb-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
