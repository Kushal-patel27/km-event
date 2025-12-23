import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    if(users.find(u => u.email === email)){
      setError('An account with that email already exists.')
      return
    }
    const user = { name, email, password }
    signup(user)
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input required value={name} onChange={e=>setName(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div className="flex items-center justify-end">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create account</button>
        </div>
      </form>
    </div>
  )
}
