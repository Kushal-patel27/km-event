import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isDarkMode } = useDarkMode();

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

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    const backendURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${backendURL}/api/auth/google`;
  };

  return (
    <>
      <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-white text-gray-900'
      }`}>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          <div className={`rounded-2xl shadow-2xl p-8 backdrop-blur-lg border ${
            isDarkMode
              ? 'bg-[#1a1f2e]/80 border-white/15 shadow-red-500/20'
              : 'bg-white/90 border-indigo-100/50'
          }`}>
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-extrabold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Create Account</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Join us to get started</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm p-3 rounded-lg mb-6 ${
                  isDarkMode
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-300/20'
                      : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-300/20'
                      : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-300/20'
                      : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Already have an account? </span>
                  <Link to="/login" className={`font-semibold transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}>
                    Sign in
                  </Link>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg bg-blue-700 hover:bg-blue-800 shadow-blue-400/30`}
              >
                Create Account
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-[#1a1f2e]/80 text-gray-400' : 'bg-white/90 text-gray-500'}`}>Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignup}
              type="button"
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg font-semibold transition-all ${
                isDarkMode
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                  : 'bg-white border-indigo-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </motion.button>
          </div>

          {/* Footer Note */}
          <p className={`text-center mt-6 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            By signing up, you agree to our{' '}
            <a href="#" className={`transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}>
              Terms of Service
            </a>
          </p>
        </motion.div>
      </div>
    </>
  );
}
