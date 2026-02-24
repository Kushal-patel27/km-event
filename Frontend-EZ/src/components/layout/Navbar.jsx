import React, { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import Logo from '../common/Logo'
import API from '../../services/api'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState(0)

  // Sync search query with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlSearch = params.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
    } else {
      setSearchQuery('')
    }
  }, [location.search])

  // Fetch waitlist count
  useEffect(() => {
    if (!user) {
      setWaitlistCount(0)
      return
    }
    const fetchWaitlistCount = async () => {
      try {
        const res = await API.get('/waitlist/my-waitlist', { params: { status: 'waiting' } })
        setWaitlistCount(res.data.waitlist?.length || 0)
      } catch (err) {
        console.error('Failed to fetch waitlist count:', err)
      }
    }
    fetchWaitlistCount()
  }, [user, location.pathname])

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
    }
  }

  const isHomePage = location.pathname === '/'

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        isHomePage
          ? 'bg-black/95 shadow-lg border-b border-white/10'
          : 'bg-white/90 dark:bg-black/90 backdrop-blur border-b border-gray-200/70 dark:border-gray-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4">
          {/* Left Section - Logo and Back Button */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-0">
            {/* Back Button - Mobile only, before logo */}
            {!isHomePage && (
              <button
                onClick={() => navigate(-1)}
                className={`md:hidden p-2 rounded-lg transition flex-shrink-0 ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="h-full flex items-center hover:opacity-90 transition-opacity">
                <Logo dark={isDarkMode} key={`navbar-logo-${isDarkMode}`} size="4xl" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-2 flex-nowrap whitespace-nowrap flex-1 md:ml-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <Link to="/" className={`shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition ${
                location.pathname === '/'
                  ? 'text-red-500'
                  : (isHomePage || isDarkMode)
                  ? 'text-gray-300 hover:text-red-500'
                  : 'text-gray-700 hover:text-red-600'
              }`}>
                Home
              </Link>
              <Link to="/events" className={`shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition ${
                location.pathname === '/events'
                  ? 'text-red-500'
                  : (isHomePage || isDarkMode)
                  ? 'text-gray-300 hover:text-red-500'
                  : 'text-gray-700 hover:text-red-600'
              }`}>
                Events
              </Link>
              {user && (
                <Link to="/my-bookings" className={`shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition whitespace-nowrap ${
                  location.pathname === '/my-bookings'
                    ? 'text-red-500'
                    : (isHomePage || isDarkMode)
                    ? 'text-gray-300 hover:text-red-500'
                    : 'text-gray-700 hover:text-red-600'
                }`}>
                  My Bookings
                </Link>
              )}
              {user && waitlistCount > 0 && (
                <Link to="/waitlist" className={`shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition whitespace-nowrap ${
                  location.pathname === '/waitlist'
                    ? 'text-red-500'
                    : (isHomePage || isDarkMode)
                    ? 'text-gray-300 hover:text-red-500'
                    : 'text-gray-700 hover:text-red-600'
                }`}>
                  Waitlist {waitlistCount > 0 && `(${waitlistCount})`}
                </Link>
              )}
              {/* Hide My Event Requests entry for normal users */}
              {user && user.role === 'event_admin' && (
                <Link to="/my-event-requests" className={`shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition whitespace-nowrap ${
                  location.pathname === '/my-event-requests'
                    ? 'text-red-500'
                    : (isHomePage || isDarkMode)
                    ? 'text-gray-300 hover:text-red-500'
                    : 'text-gray-700 hover:text-red-600'
                }`}>
                  Event Request
                </Link>
              )}
            </nav>
          </div>

          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full group">
              <div className="relative">
                {/* Search input container */}
                <div className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-lg border transition-all duration-300 ${
                  isHomePage
                    ? 'bg-white/5 border-white/20 group-hover:border-red-500/50 group-focus-within:border-red-500'
                    : 'bg-white/70 dark:bg-black/70 border-gray-200/50 dark:border-gray-900/60 group-hover:border-red-500/70 group-focus-within:border-red-600'
                }`}>
                  {/* Search Icon */}
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isHomePage ? 'text-red-500 group-focus-within:text-red-400' : 'text-red-600 dark:text-red-500 group-focus-within:text-red-700 dark:group-focus-within:text-red-400'
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
                    className={`flex-1 min-w-0 bg-transparent outline-none text-sm font-medium transition-colors ${
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
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSearchQuery('')
                        if (location.pathname === '/events') {
                          navigate('/events', { replace: true })
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        isHomePage
                          ? 'hover:bg-white/10 text-gray-400 hover:text-red-300'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500'
                      }`}
                      aria-label="Clear search"
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
          <div className="hidden md:flex items-center gap-2 md:gap-3 flex-shrink-0">
            {!isHomePage && location.pathname !== '/' && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
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
                <span className={`hidden lg:inline-flex text-sm font-semibold whitespace-nowrap max-w-[140px] truncate ${(isHomePage || isDarkMode) ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hi, {user.name}
                </span>
                {user.isAdmin && adminHome && (
                  <Link
                    to={adminHome}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition border ${
                      isAdminArea
                        ? 'text-red-500 border-red-500/30'
                        : (isHomePage || isDarkMode)
                        ? 'text-gray-300 border-gray-600 hover:text-red-400'
                        : 'text-gray-700 border-gray-300 hover:text-red-600'
                    } ${(isHomePage || isDarkMode) ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                  >
                    Admin
                  </Link>
                )}
                {/* Staff Scanner Link */}
                {user.role === 'staff' && (
                  <Link
                    to="/staff/hp-scanner"
                    className={`p-2 rounded-lg transition flex items-center gap-1 ${
                      location.pathname === '/staff/hp-scanner'
                        ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : (isHomePage || isDarkMode)
                        ? 'text-gray-300 hover:text-blue-400'
                        : 'text-gray-700 hover:text-blue-600'
                    } ${(isHomePage || isDarkMode) ? 'hover:bg-gray-800' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                    title="QR Scanner"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    📱
                  </Link>
                )}
                <Link
                  to="/settings"
                  className={`p-2 rounded-lg transition ${
                    location.pathname === '/settings'
                      ? 'text-red-500'
                      : (isHomePage || isDarkMode)
                      ? 'text-gray-300 hover:text-red-400'
                      : 'text-gray-700 hover:text-red-600'
                  } ${(isHomePage || isDarkMode) ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
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
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition ${
                    (isHomePage || isDarkMode)
                      ? 'text-gray-200 border border-gray-600 hover:bg-gray-800'
                      : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black'}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-base font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions - Right corner (Search, User, Menu) */}
          <div className="md:hidden flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Search Icon Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`p-2 rounded-lg transition flex-shrink-0 ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Mobile Menu Button - Always on the right */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition flex-shrink-0 ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
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

        {/* Mobile Search Overlay - Expands when search icon clicked */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} className="group">
              <div className="relative">
                {/* Search input container */}
                <div className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-lg border transition-all duration-300 ${
                  isHomePage
                    ? 'bg-white/5 border-white/20 group-hover:border-red-500/50 group-focus-within:border-red-500'
                    : 'bg-white/70 dark:bg-black/70 border-gray-200/50 dark:border-gray-900/60 group-hover:border-red-500/70 group-focus-within:border-red-600'
                }`}>
                  {/* Search Icon */}
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isHomePage ? 'text-red-500 group-focus-within:text-red-400' : 'text-red-600 dark:text-red-500 group-focus-within:text-red-700 dark:group-focus-within:text-red-400'
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
                    autoFocus
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
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSearchQuery('')
                        if (location.pathname === '/events') {
                          navigate('/events', { replace: true })
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                        isHomePage
                          ? 'hover:bg-white/10 text-gray-400 hover:text-red-300'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500'
                      }`}
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(false)}
                    className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                      isHomePage
                        ? 'hover:bg-white/10 text-gray-400 hover:text-red-300'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500'
                    }`}
                    aria-label="Close search"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 border-t mt-2 max-h-[calc(100vh-80px)] overflow-y-auto ${isHomePage ? 'border-gray-600 bg-[#0B0F19]' : 'border-gray-200 dark:border-gray-900 bg-white/95 dark:bg-black/95 backdrop-blur'}`}>
            <div className="px-4 sm:px-6 lg:px-8">

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-1 mt-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
              >
                Home
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/events' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
              >
                Events
              </Link>
              {user && (
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/my-bookings' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                >
                  My Bookings
                </Link>
              )}
              {user && waitlistCount > 0 && (
                <Link
                  to="/waitlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/waitlist' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                >
                  Waitlist {waitlistCount > 0 && `(${waitlistCount})`}
                </Link>
              )}
              {user && user.role === 'event_admin' && (
                <Link
                  to="/my-event-requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/my-event-requests' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                >
                  Event Request
                </Link>
              )}
              {user && user.isAdmin && adminHome && (
                <Link
                  to={adminHome}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isAdminArea ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                >
                  Admin
                </Link>
              )}
              {user && (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${location.pathname === '/settings' ? isHomePage ? 'bg-red-900/30 text-red-500 font-semibold' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-semibold' : isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                >
                  Settings
                </Link>
              )}
            </nav>

            {/* Mobile Settings Section */}
            <div className={`mt-3 pt-3 border-t space-y-1 ${isHomePage ? 'border-gray-600' : 'border-gray-200 dark:border-gray-900'}`}>
              {!isHomePage && (
                <button
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
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

              {!user && (
                <div className="flex flex-col gap-2 py-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 text-center text-sm font-semibold rounded-lg transition border ${
                      isHomePage
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700'
                        : 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 text-center text-sm font-semibold rounded-lg transition border ${
                      isHomePage
                        ? 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {user && (
                <>
                  {/* Show user greeting in menu */}
                  <div className={`px-4 py-2 text-sm font-medium ${isHomePage ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                    Hi, {user.name}
                  </div>
                  {/* Show logout in menu */}
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 text-left text-sm font-medium rounded-lg transition ${isHomePage ? 'text-gray-200 hover:bg-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black'}`}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
