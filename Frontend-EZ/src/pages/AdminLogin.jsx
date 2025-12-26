import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

export default function AdminLogin(){
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    setError('')
    // call backend login
    (async ()=>{
      try {
        const res = await API.post('/auth/login', { email: 'admin@local', password })
        if(res.data.role !== 'admin') return setError('Not an admin account')
        login({ name: res.data.name, email: res.data.email, token: res.data.token, role: res.data.role })
        navigate('/admin')
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid admin credentials')
      }
    })()
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Admin Password</label>
          <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div className="flex justify-end">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Sign in</button>
        </div>
      </form>
    </div>
  )
}
