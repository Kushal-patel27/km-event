import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('authUser') || 'null'))

  useEffect(()=>{
    if(user) {
      localStorage.setItem('authUser', JSON.stringify(user))
      if(user.token) localStorage.setItem('token', user.token)
    }
    else {
      localStorage.removeItem('authUser')
      localStorage.removeItem('token')
    }
  }, [user])

  function login(userObj){
    // userObj expected to include token and role
    const enriched = {
      ...userObj,
      isAdmin: userObj.role === 'admin' || userObj.isAdmin
    }
    setUser(enriched)
  }

  function logout(){
    setUser(null)
  }

  function signup(userObj){
    // signup will be handled by API; simply store the returned user
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
