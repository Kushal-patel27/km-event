import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { motion } from "framer-motion";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className={`py-8 px-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'
      }`}>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          <div className={`rounded-lg shadow-md p-6 backdrop-blur-lg border ${
            isDarkMode
              ? 'bg-black border-gray-800'
              : 'bg-white/90 border-indigo-100/50'
          }`}>
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Create Account</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Join us to get started</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm p-3 rounded-lg mb-4 ${
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
                      ? 'bg-black border-gray-800 text-gray-100 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
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
                      ? 'bg-black border-gray-800 text-gray-100 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all outline-none ${
                      isDarkMode
                        ? 'bg-black border-gray-800 text-gray-100 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                        : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-black text-gray-400' : 'bg-white/90 text-gray-500'}`}>Or continue with</span>
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
                  ? 'bg-black border-gray-800 text-gray-100 hover:border-gray-600'
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
          <p className={`text-center mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            By signing up, you agree to our{' '}
            <Link to="/terms" className={`transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}>
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
