import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function AdminLayout({ title = 'Admin', children }){
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const role = user?.role || 'user'
  const nav = [
    { to: '/admin', label: 'Dashboard', icon: '📊', roles: ['super_admin','event_admin','staff_admin','admin'] },
    { to: '/admin/team', label: 'Team Management', icon: '👥', roles: ['super_admin','admin'] },
    { to: '/admin/events', label: 'Events', icon: '📅', roles: ['super_admin','event_admin','admin'] },
    { to: '/admin/bookings', label: 'Bookings', icon: '🎫', roles: ['super_admin','event_admin','staff_admin','admin'] },
    { to: '/admin/contacts', label: 'Contacts', icon: '📬', roles: ['super_admin','admin'] },
  ].filter(item => !item.roles || item.roles.includes(role))

  function handleLogout(){
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
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
                <Logo dark={false} key="admin-logo" />
              </Link>
              <div className="hidden md:block border-l border-gray-200 h-6"></div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User Section */}
              <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </div>

              {/* Mobile User Menu */}
              <div className="sm:hidden">
                <button 
                  onClick={handleLogout} 
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[256px_1fr] gap-6 mt-6">
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white border border-gray-200 rounded-xl p-3"
              >
                <nav className="flex flex-col gap-1">
                  {nav.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                      onClick={() => setOpen(false)}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden md:block bg-white border border-gray-200 rounded-xl p-3 h-fit">
            <nav className="flex flex-col gap-1">
              {nav.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="sm:hidden flex items-center gap-2">
                <div className="text-sm">{user?.name || 'Admin'}</div>
                <button onClick={handleLogout} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100">Logout</button>
              </div>
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
