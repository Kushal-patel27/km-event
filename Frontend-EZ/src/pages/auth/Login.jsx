import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/DarkModeContext";
import API from "../../services/api";
import { motion } from "framer-motion";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState(searchParams.get("mode") === "admin" ? "admin" : "user"); // 'user' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkMode } = useDarkMode();

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let lastError = null;
      let firstError = null;
      let loginSuccessful = false;

      // Try multiple login endpoints silently
      // For admin mode: try admin first, then staff only (no regular user endpoint)
      // For user mode: try user first, then staff
      // Only try staff login when explicitly in admin mode; user mode should not fall back to staff
      const endpoints = mode === "admin" 
        ? ["/auth/admin/login", "/auth/staff/login"]
        : ["/auth/login"];

      for (const endpoint of endpoints) {
        try {
          const res = await API.post(endpoint, { email, password });
          
          // Login successful
          console.log('Login API Response:', res.data);
          login({
            name: res.data.name,
            email: res.data.email,
            token: res.data.token,
            role: res.data.role,
            _id: res.data._id,
            lastLoginAt: res.data.lastLoginAt,
            assignedEvents: res.data.assignedEvents,
            assignedGates: res.data.assignedGates,
          });

          // Redirect based on role
          const role = String(res.data.role || "").toLowerCase();
          console.log('Normalized role for navigation:', role);
          if (role === "super_admin") {
            console.log('Navigating to /super-admin');
            navigate("/super-admin");
          }
          else if (role === "event_admin") navigate("/event-admin");
          else if (role === "staff_admin") navigate("/staff-admin");
          else if (role === "admin") navigate("/admin");
          else if (role === "staff") navigate("/staff/scanner");
          else navigate("/");
          
          loginSuccessful = true;
          break;
        } catch (err) {
          if (!firstError) firstError = err; // Keep the first error
          lastError = err;
          // Continue to next endpoint
        }
      }

      if (!loginSuccessful) {
        // Throw first error for admin mode (more relevant), last error for user mode
        throw mode === "admin" ? firstError : lastError;
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      if (message === "Password login not available for this account") {
        const encoded = encodeURIComponent(email || "");
        navigate(`/set-password?email=${encoded}`);
        return;
      } else {
        setError(message);
      }
    }
  };

  const handleGoogleLogin = () => {
    const backendURL = import.meta.env.VITE_API_URL || "";
    const redirect = encodeURIComponent(window.location.origin);
    window.location.href = `${backendURL}/api/auth/google?redirect=${redirect}`;
  };

  return (
    <div className={`flex items-center justify-center py-8 px-4 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full p-6 rounded-lg shadow-md border ${
        isDarkMode 
          ? 'bg-black border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-center mb-4">
          <div
            className={`inline-flex rounded-lg border overflow-hidden ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}
            role="tablist"
            aria-label="Login mode"
          >
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                mode === "user"
                  ? "bg-indigo-600 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              aria-selected={mode === "user"}
                onClick={() => setMode("user")}
              >
                User
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-l focus:outline-none ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                } ${
                  mode === "admin"
                    ? "bg-indigo-600 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                aria-selected={mode === "admin"}
                onClick={() => setMode("admin")}
              >
                Admin / Event Admin
              </button>
            </div>
          </div>

          <h2 className={`text-2xl font-semibold mb-1 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {mode === "admin" ? "Admin / Event Admin Login" : "Login"}
          </h2>
          <p className={`text-sm mb-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {mode === "admin"
              ? "Use your admin credentials to access your dashboard."
              : "Sign in to manage your bookings and profile."}
          </p>

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
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
                    name="password"
                    autoComplete="current-password"
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3 sm:gap-0">
                <Link
                  to="/forgot-password"
                  className={`text-sm font-semibold transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}
                >
                  Forgot password?
                </Link>
                <div className="text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Don't have an account? </span>
                  <Link to="/signup" className={`font-semibold transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}>
                    Sign up
                  </Link>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg bg-blue-700 hover:bg-blue-800 shadow-blue-400/30`}
              >
                {mode === "admin" ? "Login as Admin" : "Login"}
              </motion.button>
            </form>

            {mode === "user" && (
            <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-2 ${isDarkMode ? 'bg-black text-gray-400' : 'bg-white/90 text-gray-500'}`}>
                    Or continue with
                  </span>
                  </div>
                </div>

                  <motion.button
                  whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
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
                  Sign in with Google
                </motion.button>
            </>
          )}

          {/* Footer Note */}
          <p className={`text-center mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            By logging in, you agree to our{' '}
            <Link to="/terms" className={`transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}>
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
  );
}
