import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

export default function EventAdminLayout({ title = 'Event Admin', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    { to: '/event-admin', label: '📊 Dashboard', exact: true },
    { to: '/event-admin/events', label: '🎫 My Events' },
    { to: '/event-admin/bookings', label: '📋 Bookings' },
    { to: '/event-admin/revenue', label: '📈 Revenue' },
    { to: '/event-admin/payout', label: '🏦 Payout' },
  ]

  async function handleLogout(){
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link to="/" className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Logo dark={false} key="event-admin-logo" />
              </Link>
              <div className="hidden md:block border-l border-gray-200 h-6" />
              <h1 className="text-base md:text-lg font-semibold truncate">Event Admin</h1>
            </div>
            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
              <NavigationButtons
                homeTo="/event-admin"
                homeLabel="Dashboard"
                showLabels={false}
                size="sm"
              />
              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="text-sm font-medium">{user?.name || 'Event Admin'}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="px-2 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white flex-shrink-0">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 bg-white border border-gray-200 rounded-xl p-2">
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map(item => {
              const isActive = item.exact 
                ? location.pathname === item.to 
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-xl p-3 h-fit hidden md:block self-start md:sticky md:top-20 max-h-[calc(100vh-6rem)] overflow-auto">
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

          <main>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            </div>
            <div className="space-y-6 pb-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
