import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

export default function AdminLayout({ title = 'Admin', children }){
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const role = user?.role || 'user'
  const navSections = [
    {
      title: 'Main',
      items: [
        { to: '/admin', label: 'Dashboard', icon: '📊', roles: ['super_admin','event_admin','staff_admin','admin'] },
        { to: '/admin/team', label: 'Team Management', icon: '👥', roles: ['super_admin','admin'] },
        { to: '/admin/events', label: 'Events', icon: '📅', roles: ['super_admin','event_admin','admin'] },
        { to: '/admin/bookings', label: 'Bookings', icon: '🎫', roles: ['super_admin','event_admin','staff_admin','admin'] },
        { to: '/admin/booking-search', label: 'Booking Search', icon: '🔍', roles: ['super_admin','event_admin','staff_admin','admin'] },
        { to: '/admin/contacts', label: 'Contacts', icon: '📬', roles: ['super_admin','admin'] },
      ]
    },
    {
      title: 'Site Management',
      items: [
        { to: '/admin/organizers-content', label: 'Organizers Page', icon: '📝', roles: ['super_admin','admin'] },
        { to: '/admin/faq', label: 'FAQ', icon: '❓', roles: ['super_admin','admin'] },
        { to: '/admin/help', label: 'Help Center', icon: '📚', roles: ['super_admin','admin'] },
      ]
    },
    {
      title: 'Revenue Management',
      items: [
        { to: '/admin/subscriptions', label: 'Subscription Hub', icon: '🎯', roles: ['super_admin','admin'] },
        { to: '/admin/subscription-plans', label: 'Subscription Plans', icon: '💳', roles: ['super_admin','admin'] },
        { to: '/admin/organizer-subscriptions', label: 'Organizer Subscriptions', icon: '👨‍💼', roles: ['super_admin','admin'] },
        { to: '/admin/commission-analytics', label: 'Commission Analytics', icon: '📈', roles: ['super_admin','admin'] },
        { to: '/admin/event-admin-payouts', label: 'Event Admin Payouts', icon: '🏦', roles: ['super_admin','admin'] },
        { to: '/admin/coupons', label: 'Discount Coupons', icon: '🎟️', roles: ['super_admin','admin'] },
      ]
    }
  ]
  
  const filteredNavSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(section => section.items.length > 0)

  function handleLogout(){
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left Section */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
              <button
                className="md:hidden p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
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
              <Link to="/" className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Logo dark={false} size="4xl" key="admin-logo" />
              </Link>
              <div className="hidden md:block border-l border-gray-200 h-6"></div>
              <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate">Admin Panel</h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <NavigationButtons
                homeTo="/admin"
                homeLabel="Dashboard"
                showLabels={false}
                size="sm"
              />
              {/* User Section */}
              <div className="hidden sm:flex items-center gap-3 md:gap-4">
                <div className="flex flex-col items-end text-right">
                  <p className="text-xs sm:text-sm font-medium">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 flex-shrink-0"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[256px_1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white border border-gray-200 rounded-xl p-2 sm:p-3"
              >
                <nav className="flex flex-col gap-3 sm:gap-4">
                  {filteredNavSections.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <div className="flex flex-col gap-1 mt-1">
                        {section.items.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`px-2.5 sm:px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                            onClick={() => setOpen(false)}
                          >
                            <span>{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden md:block bg-white border border-gray-200 rounded-xl p-2 sm:p-3 h-fit self-start md:sticky md:top-20 max-h-[calc(100vh-6rem)] overflow-auto">
            <nav className="flex flex-col gap-4">
              {filteredNavSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="flex flex-col gap-1 mt-1">
                    {section.items.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${location.pathname === item.to ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h1>
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
