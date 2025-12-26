import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post('/auth/register', { name, email, password })
      signup({ name: res.data.name, email: res.data.email, token: res.data.token, role: res.data.role })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <>
    

      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Create Account</h2>

          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div className="flex items-center justify-end">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
