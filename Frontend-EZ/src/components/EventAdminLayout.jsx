import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function EventAdminLayout({ title = 'Event Admin', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    { to: '/event-admin', label: '📊 Dashboard', exact: true },
    { to: '/event-admin/events', label: '🎫 My Events' },
    { to: '/event-admin/bookings', label: '📋 Bookings' },
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
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <Logo dark={false} key="event-admin-logo" />
              </Link>
              <div className="border-l border-gray-200 h-6" />
              <h1 className="text-lg font-semibold">Event Admin</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-sm font-medium">{user?.name || 'Event Admin'}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 mt-6">
          <aside className="bg-white border border-gray-200 rounded-xl p-3 h-fit">
            <nav className="flex flex-col gap-1">
              {nav.map(item => {
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
          </aside>

          <main>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <div className="space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
