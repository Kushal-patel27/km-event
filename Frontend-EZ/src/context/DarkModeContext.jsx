import React, { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const DarkModeContext = createContext()

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}

export function DarkModeProvider({ children, forceDark = false }) {
  const [isDarkMode, setIsDarkMode] = useState(forceDark ? true : false)
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/event-admin')
  const isHomeRoute = location.pathname === '/'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always disable dark mode for admin/staff/event-admin routes
      if (isAdminRoute) {
        document.documentElement.classList.remove('dark')
        setIsDarkMode(false)
        return
      }

      const stored = localStorage.getItem('theme')
      const enableDark = stored === 'dark' ? true : false
      setIsDarkMode(enableDark)
      if (enableDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isAdminRoute, forceDark, isHomeRoute])

  const toggleDarkMode = () => {
    // Don't allow toggle if forceDark is true or on admin routes
    if (forceDark || isAdminRoute || isHomeRoute) return
    
    const newMode = !isDarkMode
    setIsDarkMode(newMode)

    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode ? 'dark' : 'light')
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}
