import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import API, { setAuthToken } from '../services/api'

const AuthContext = createContext()
const ADMIN_ROLES = ['super_admin', 'event_admin', 'staff_admin', 'admin']

function normalizeRole(rawRole){
  if(!rawRole) return 'user'
  return String(rawRole).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

function enrichUser(userObj){
  if(!userObj) return null
  const role = normalizeRole(userObj.role)
  return {
    ...userObj,
    role,
    isAdmin: ADMIN_ROLES.includes(role) || userObj.isAdmin === true
  }
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => enrichUser(JSON.parse(localStorage.getItem('authUser') || 'null')))
  const [sessionMessage, setSessionMessage] = useState(null)

  useEffect(()=>{
    if(user?.token) setAuthToken(user.token)
  }, [user?.token])

  useEffect(()=>{
    if(user) {
      localStorage.setItem('authUser', JSON.stringify(user))
      if(user.token) localStorage.setItem('token', user.token)
    }
    else {
      localStorage.removeItem('authUser')
      localStorage.removeItem('token')
      setAuthToken(null)
    }
  }, [user])

  // Periodic session verification with resilience to transient network/auth blips
  useEffect(() => {
    if (!user?.token) return

    let consecutiveAuthFailures = 0

    const verifySession = async () => {
      try {
        await API.get('/auth/verify-session')
        consecutiveAuthFailures = 0
      } catch (error) {
        // Ignore network errors (connection issues, network changes, etc.)
        if (
          error.code === 'ERR_NETWORK' ||
          error.code === 'ERR_NETWORK_CHANGED' ||
          error.message === 'Network Error' ||
          !error.response
        ) {
          // Network issue - don't logout, just skip this check
          return
        }

        // Authentication-related errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          consecutiveAuthFailures += 1

          // Try one quick retry after a short delay to handle transient cookie/token issues
          if (consecutiveAuthFailures === 1) {
            setTimeout(async () => {
              try {
                await API.get('/auth/verify-session')
                consecutiveAuthFailures = 0
              } catch (err2) {
                // If second attempt still fails with auth error, then logout
                if (err2.response?.status === 401 || err2.response?.status === 403) {
                  const message = err2.response?.data?.message || 'Your session has expired. Please log in again.'
                  setAuthToken(null)
                  setUser(null)
                  setSessionMessage(message)
                  setTimeout(() => setSessionMessage(null), 5000)
                }
              }
            }, 500)
          } else if (consecutiveAuthFailures >= 2) {
            const message = error.response?.data?.message || 'Your session has expired. Please log in again.'
            setAuthToken(null)
            setUser(null)
            setSessionMessage(message)
            setTimeout(() => setSessionMessage(null), 5000)
          }
        }
      }
    }

    // Check immediately on mount
    verifySession()

    // Poll less frequently to reduce churn during network switches
    const interval = setInterval(verifySession, 15000)

    return () => clearInterval(interval)
  }, [user?.token])

  const login = useCallback((userObj) => {
    const enriched = enrichUser(userObj)
    if(enriched?.token) setAuthToken(enriched.token)
    setUser(enriched)
    setSessionMessage(null) // Clear any previous messages
  }, [])

  const logout = useCallback(async (message = null) => {
    try {
      await API.post('/auth/logout')
    } catch (err) {
      // ignore logout failure so UX is not blocked
    }
    setAuthToken(null)
    setUser(null)
    if (message) {
      setSessionMessage(message)
      setTimeout(() => setSessionMessage(null), 5000)
    }
  }, [])

  const signup = useCallback((userObj) => {
    login(userObj)
  }, [login])

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, sessionMessage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}

export default AuthContext
