import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Logo from './Logo'

export default function AdminLayout({ title = 'Admin', children }){
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = [
    { to: '/admin/events', label: 'Events' },
    { to: '/admin/bookings', label: 'Bookings' },
  ]

  function handleLogout(){
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
            <Link to="/" className="hidden md:block">
              <Logo dark={isDarkMode} />
            </Link>
            <div className="font-bold text-lg">Admin Panel</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-sm">{user?.name || 'Admin'}</div>
              <button onClick={handleLogout} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 mt-6">
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-3"
              >
                <nav className="flex flex-col gap-1">
                  {nav.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-lg ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-3 h-fit">
            <nav className="flex flex-col gap-1">
              {nav.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
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
                <button onClick={handleLogout} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
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
