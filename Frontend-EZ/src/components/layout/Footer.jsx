import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDarkMode } from '../../context/DarkModeContext'

export default function Footer() {
  const { isDarkMode } = useDarkMode()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  
  // Force dark mode on home page
  const forceDark = isHomePage ? true : isDarkMode

  return (
    <footer className={`py-16 transition-colors duration-300 ${
      forceDark
        ? 'bg-black border-t border-white/10'
        : 'bg-gradient-to-b from-slate-50 to-slate-100 border-t border-indigo-200'
    }`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className={`text-xl font-bold ${forceDark ? 'text-white' : 'text-gray-900'}`}>K&M Events</h3>
            <p className={`text-sm ${forceDark ? 'text-gray-400' : 'text-gray-600'}`}>Your gateway to unforgettable live experiences. Book tickets to the best events near you.</p>
            <div className="flex gap-4 pt-2">
              <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition ${forceDark ? 'bg-black border border-white/10 text-red-500 hover:bg-red-600/20 hover:border-red-500/40' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition ${forceDark ? 'bg-black border border-white/10 text-red-500 hover:bg-red-600/20 hover:border-red-500/40' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition ${forceDark ? 'bg-black border border-white/10 text-red-500 hover:bg-red-600/20 hover:border-red-500/40' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition ${forceDark ? 'bg-black border border-white/10 text-red-500 hover:bg-red-600/20 hover:border-red-500/40' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2A10 10 0 102 12a10 10 0 0010-10zm3.7 10.5h-2.54v8.03h-2.63v-8.03H9.25v-2.42h1.33V7.6c0-1.11.26-2.84 2.84-2.84h2.21v2.37h-1.6c-.27 0-.45.13-.45.72v1.54h2.1l-.31 2.41z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className={`font-semibold text-lg ${forceDark ? 'text-white' : 'text-gray-900'}`}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/events" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Browse Events</Link></li>
              <li><Link to="/about" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>About Us</Link></li>
              <li><Link to="/contact" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Contact Us</Link></li>
              <li><Link to="/my-bookings" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>My Bookings</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className={`font-semibold text-lg ${forceDark ? 'text-white' : 'text-gray-900'}`}>Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Help Center</Link></li>
              <li><Link to="/privacy" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Privacy Policy</Link></li>
              <li><Link to="/terms" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Terms of Service</Link></li>
              <li><Link to="/cookies" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>Cookie Policy</Link></li>
              <li><Link to="/faq" className={`text-sm transition ${forceDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-indigo-600'}`}>FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className={`font-semibold text-lg ${forceDark ? 'text-white' : 'text-gray-900'}`}>Contact</h4>
            <ul className="space-y-3">
              <li className={`text-sm ${forceDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">Email:</span><br/>
                <a href="mailto:support@kmevents.com" className={`transition ${forceDark ? 'hover:text-red-500' : 'hover:text-indigo-600'}`}>support@kmevents.com</a>
              </li>
              <li className={`text-sm ${forceDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">Phone:</span><br/>
                <a href="tel:+919568698796" className={`transition ${forceDark ? 'hover:text-red-500' : 'hover:text-indigo-600'}`}>+91 95686-98796</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className={`${forceDark ? 'border-white/10' : 'border-gray-300'} border-t my-8`}></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className={`text-sm ${forceDark ? 'text-gray-500' : 'text-gray-600'}`}>
            © 2025 K&M Events. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className={`text-sm transition ${forceDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-900'}`}>Privacy</Link>
            <Link to="/terms" className={`text-sm transition ${forceDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-900'}`}>Terms</Link>
            <Link to="/cookies" className={`text-sm transition ${forceDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-900'}`}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
