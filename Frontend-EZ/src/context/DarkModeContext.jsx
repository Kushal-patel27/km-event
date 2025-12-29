import React, { createContext, useContext, useState } from 'react'

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

  const toggleDarkMode = () => {
    // Don't allow toggle if forceDark is true
    if (forceDark) return
    
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
