import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Logo from './Logo'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const adminHome = useMemo(() => {
    if(!user?.isAdmin) return null
    if(user.role === 'super_admin') return '/super-admin'
    if(user.role === 'event_admin') return '/event-admin'
    if(user.role === 'staff_admin') return '/staff-admin'
    return '/admin'
  }, [user])

  const isAdminArea = useMemo(() => {
    const adminPrefixes = ['/admin', '/event-admin', '/staff', '/super-admin']
    return adminPrefixes.some(prefix => location.pathname.startsWith(prefix))
  }, [location.pathname])

  async function handleLogout(){
    await logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  function handleSearch(e){
    e.preventDefault()
    if(searchQuery.trim()){
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const isHomePage = location.pathname === '/'

  return (
    <header className={`sticky top-0 z-50 ${isHomePage ? 'bg-[#0B0F19] shadow-lg' : 'bg-white dark:bg-gray-900 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="h-full flex items-center hover:opacity-90 transition-opacity">
              <Logo dark={isDarkMode} key={`navbar-logo-${isDarkMode}`} size="4xl" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`font-medium transition ${location.pathname === '/' ? isHomePage ? 'text-red-500' : 'text-red-600 dark:text-red-500' : isHomePage ? 'text-gray-200 hover:text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'}`}>
              Home
            </Link>
            <Link to="/events" className={`font-medium transition ${location.pathname === '/events' ? isHomePage ? 'text-red-500' : 'text-red-600 dark:text-red-500' : isHomePage ? 'text-gray-200 hover:text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'}`}>
              Events
            </Link>
            {user && (
              <Link to="/my-bookings" className={`font-medium transition ${location.pathname === '/my-bookings' ? isHomePage ? 'text-red-500' : 'text-red-600 dark:text-red-500' : isHomePage ? 'text-gray-200 hover:text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'}`}>
                My Bookings
              </Link>
            )}
            {user && user.isAdmin && adminHome && (
              <Link
                to={adminHome}
                className={`font-medium transition ${isAdminArea ? isHomePage ? 'text-red-500' : 'text-red-600 dark:text-red-500' : isHomePage ? 'text-gray-200 hover:text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'}`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full group">
              <div className="relative">
                {/* Search input container */}
                <div className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-lg border transition-all duration-300 ${
                  isHomePage
                    ? 'bg-white/5 border-white/20 group-hover:border-red-400/50 group-focus-within:border-red-400'
                    : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50 group-hover:border-red-400/70 group-focus-within:border-red-500'
                }`}>
                  {/* Search Icon */}
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      isHomePage ? 'text-red-400 group-focus-within:text-red-300' : 'text-red-500 dark:text-red-400 group-focus-within:text-red-600 dark:group-focus-within:text-red-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {/* Input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events, cities..."
                    className={`flex-1 bg-transparent outline-none text-sm font-medium transition-colors ${
                      isHomePage
                        ? 'text-white placeholder-gray-400'
                        : 'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                    }`}
                    aria-label="Search events"
                  />

                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`p-1.5 rounded-lg transition-all ${
                        isHomePage
                          ? 'hover:bg-white/10 text-gray-400 hover:text-red-300'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {!isHomePage && location.pathname !== '/' && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            )}
            {user ? (
              <>
                <span className={`text-sm ${isHomePage ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'} font-medium`}>
                  Hi, {user.name}
                </span>
                <Link
                  to="/settings"
                  className={`p-2 rounded-lg transition ${location.pathname === '/settings' ? isHomePage ? 'text-red-500' : 'text-red-600 dark:text-red-500' : isHomePage ? 'text-gray-200 hover:text-red-500' : 'text-gray-700 dark:text-gray-300'} ${isHomePage ? 'hover:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  aria-label="Settings"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35.777-.188 1.35-.761 1.538-1.538.89-1.543 3.31-.877 2.42-2.42A1.724 1.724 0 007.752 5.383c.426-1.756 2.924-1.756 3.35 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${isHomePage ? 'text-gray-200 border border-gray-600 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <>
                <Link
                  to="/login"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 border-t mt-2 ${isHomePage ? 'border-gray-600 bg-[#0B0F19]' : 'border-gray-200 dark:border-gray-700'}`}>
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4 mb-4 group">
              <div className="relative">
                {/* Search input container */}
                <div className={`relative flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-lg border transition-all duration-300 ${
                  isHomePage
                    ? 'bg-white/5 border-white/20 group-hover:border-red-400/50 group-focus-within:border-red-400'
                    : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50 group-hover:border-red-400/70 group-focus-within:border-red-500'
                }`}>
                  {/* Search Icon */}
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isHomePage ? 'text-red-400 group-focus-within:text-red-300' : 'text-red-500 dark:text-red-400 group-focus-within:text-red-600 dark:group-focus-within:text-red-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {/* Input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className={`flex-1 bg-transparent outline-none text-sm font-medium transition-colors ${
                      isHomePage
                        ? 'text-white placeholder-gray-400'
                        : 'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                    }`}
                    aria-label="Search events"
                  />

                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                        isHomePage
                          ? 'hover:bg-white/10 text-gray-400 hover:text-red-300'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition ${location.pathname === '/' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Home
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition ${location.pathname === '/events' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Events
              </Link>
              {user && (
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg transition ${location.pathname === '/my-bookings' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  My Bookings
                </Link>
              )}
              {user && (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg transition ${location.pathname === '/settings' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  Settings
                </Link>
              )}
              {user && user.isAdmin && adminHome && (
                <Link
                  to={adminHome}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg transition ${isAdminArea ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Mobile Settings Section */}
            <div className={`mt-4 pt-4 border-t space-y-2 ${isHomePage ? 'border-gray-600' : 'border-gray-200 dark:border-gray-700'}`}>
              {!isHomePage && (
                <button
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span>Dark Mode</span>
                  {isDarkMode ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              )}

              {user && (
                <>
                  <div className={`px-4 py-2 text-sm font-medium ${isHomePage ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                    Hi, {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 text-left rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
