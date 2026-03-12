import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

export default function EventAdminLayout({ title = 'Event Admin', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = [
    { to: '/event-admin', label: '📊 Dashboard', exact: true },
    { to: '/event-admin/events', label: '🎫 My Events' },
    { to: '/event-admin/bookings', label: '📋 Bookings' },
    { to: '/event-admin/booking-search', label: '🔍 Search' },
    { to: '/event-admin/coupons', label: '🎟️ Coupons' },
    { to: '/event-admin/revenue', label: '📈 Revenue' },
    { to: '/event-admin/payout', label: '🏦 Payout' },
  ]

  async function handleLogout(){
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="responsive-role-shell role-shell-event-admin min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
              <button
                className="md:hidden p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
                aria-label="Toggle navigation"
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
                <span className="md:hidden"><Logo dark={false} size="lg" key="event-admin-logo-sm" /></span>
                <span className="hidden md:block"><Logo dark={false} size="4xl" key="event-admin-logo" /></span>
              </Link>
              <div className="hidden md:block border-l border-gray-200 h-6" />
              <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate">Event Admin</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <div className="flex">
                <NavigationButtons
                  homeTo="/event-admin"
                  homeLabel="Dashboard"
                  showLabels={false}
                  size="sm"
                />
              </div>
              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="text-xs sm:text-sm font-medium">{user?.name || 'Event Admin'}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white flex-shrink-0">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">
        <AnimatePresence>
          {open && (
            <>
              <motion.button
                type="button"
                aria-label="Close navigation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-30 bg-gray-900/40 md:hidden"
                onClick={() => setOpen(false)}
              />
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-40 md:hidden overflow-y-auto bg-white border-t border-gray-200 shadow-xl p-4"
              >
                <nav className="flex flex-col gap-1">
                  {nav.map(item => {
                    const isActive = item.exact
                      ? location.pathname === item.to
                      : location.pathname.startsWith(item.to)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3 h-fit hidden md:block self-start md:sticky md:top-20 max-h-[calc(100vh-6rem)] overflow-auto">
            {/* Navigation */}
            <div className="p-0">
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">{nav.map(item => {
                  const isActive = item.exact 
                    ? location.pathname === item.to 
                    : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

          </aside>

          <main className="role-shell-main min-w-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h1>
            </div>
            <div className="role-shell-content space-y-6 pb-6 min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
