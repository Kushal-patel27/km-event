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

  const isAdminRoute = (() => {
    const path = location.pathname || ''
    const adminPrefixes = ['/admin', '/super-admin', '/event-admin', '/staff-admin', '/staff']
    return adminPrefixes.some(prefix => path.startsWith(prefix))
  })()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAdminRoute) {
        setIsDarkMode(false)
        document.documentElement.classList.remove('dark')
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
  }, [forceDark, location.pathname, isAdminRoute])

  const toggleDarkMode = () => {
    if (forceDark || isAdminRoute) return
    
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
