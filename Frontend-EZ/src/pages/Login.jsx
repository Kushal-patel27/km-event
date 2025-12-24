import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth(); // context login
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // save token
      localStorage.setItem("token", res.data.token);

      // update auth context
      login({
        name: res.data.name,
        email: res.data.email,
      });

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>


      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Login</h2>

          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Don’t have an account?
                <Link to="/signup" className="text-indigo-600 ml-1">
                  Sign up
                </Link>
              </div>

              <button className="bg-indigo-600 text-white px-4 py-2 rounded">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
