import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Logo from './Logo'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout(){
    logout()
    navigate('/')
  }

  return (
    <header className="py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {location.pathname !== '/events' && (
            <input aria-label="Search events" className="px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search events, cities..." />
          )}
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">Home</Link>
            <Link to="/events" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">Events</Link>
            <Link to="/my-bookings" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">My Bookings</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700 dark:text-gray-300">Hi, {user.name}</div>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Login</Link>
              <Link to="/signup" className="btn-primary">Sign up</Link>
            </div>
          )}

          {user && user.isAdmin && (
            <Link to="/admin" className="ml-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Admin</Link>
          )}
        </div>
      </div>
    </header>
  )
}
