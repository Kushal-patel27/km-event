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
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/event-admin')

  const [themePreference, setThemePreference] = useState(() => {
    if (forceDark) return 'dark'
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
    return 'system'
  })

  const getSystemPrefersDark = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (forceDark) return true
    if (themePreference === 'dark') return true
    if (themePreference === 'light') return false
    return getSystemPrefersDark()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (forceDark) return
    localStorage.setItem('theme', themePreference)
  }, [themePreference, forceDark])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (themePreference === 'system') {
        setIsDarkMode(media.matches)
      }
    }

    handleChange()
    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
    } else {
      media.addListener(handleChange)
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange)
      } else {
        media.removeListener(handleChange)
      }
    }
  }, [themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (themePreference === 'dark') setIsDarkMode(true)
    if (themePreference === 'light') setIsDarkMode(false)
    if (themePreference === 'system') setIsDarkMode(getSystemPrefersDark())
  }, [themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Keep admin/staff/event-admin areas in light mode regardless of preference
    if (isAdminRoute) {
      document.documentElement.classList.remove('dark')
      return
    }

    if (forceDark || isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isAdminRoute, isDarkMode, forceDark])

  const toggleDarkMode = () => {
    if (forceDark || isAdminRoute) return
    setThemePreference(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const applyThemePreference = (theme) => {
    if (forceDark || isAdminRoute) return
    if (theme !== 'dark' && theme !== 'light' && theme !== 'system') return
    setThemePreference(theme)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, themePreference, toggleDarkMode, setThemePreference: applyThemePreference }}>
      {children}
    </DarkModeContext.Provider>
  )
}
