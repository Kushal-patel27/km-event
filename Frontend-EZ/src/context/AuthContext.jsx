import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('authUser') || 'null'))

  useEffect(()=>{
    if(user) localStorage.setItem('authUser', JSON.stringify(user))
    else localStorage.removeItem('authUser')
  }, [user])

  function login(userObj){
    setUser(userObj)
  }

  function logout(){
    setUser(null)
  }

  function signup(userObj){
    const stored = JSON.parse(localStorage.getItem('users') || '[]')
    stored.push(userObj)
    localStorage.setItem('users', JSON.stringify(stored))
    setUser(userObj)
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
