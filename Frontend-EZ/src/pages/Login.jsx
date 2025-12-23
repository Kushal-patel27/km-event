import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if(!found){
      setError('Invalid credentials. Sign up if you don\'t have an account.')
      return
    }
    login({ name: found.name, email: found.email })
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Don't have an account? <Link to="/signup" className="text-indigo-600">Sign up</Link></div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
