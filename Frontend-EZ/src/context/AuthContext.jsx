import React, { createContext, useContext, useEffect, useState } from 'react'
import API, { setAuthToken } from '../services/api'

const AuthContext = createContext()
const ADMIN_ROLES = ['super_admin', 'event_admin', 'staff_admin', 'admin']

function enrichUser(userObj){
  if(!userObj) return null
  const role = userObj.role || 'user'
  return {
    ...userObj,
    role,
    isAdmin: ADMIN_ROLES.includes(role) || userObj.isAdmin === true
  }
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => enrichUser(JSON.parse(localStorage.getItem('authUser') || 'null')))

  useEffect(()=>{
    if(user?.token) setAuthToken(user.token)
  }, [])

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

  function login(userObj){
    const enriched = enrichUser(userObj)
    if(enriched?.token) setAuthToken(enriched.token)
    setUser(enriched)
  }

  async function logout(){
    try {
      await API.post('/auth/logout')
    } catch (err) {
      // ignore logout failure so UX is not blocked
    }
    setAuthToken(null)
    setUser(null)
  }

  function signup(userObj){
    login(userObj)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}

export default AuthContext
