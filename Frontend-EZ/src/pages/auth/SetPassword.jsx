import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/DarkModeContext";

const STEP_COPY = {
  email: "Send a verification code to your email",
  otp: "Enter the 6-digit code we emailed you",
  reset: "Create a new password",
  done: "Password updated successfully",
};

export default function SetPassword() {
  const { user, login } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("email");
  const [timer, setTimer] = useState(0);
  const [minPasswordLength, setMinPasswordLength] = useState(8);

  const isAuthenticated = Boolean(user?.token);
  const canResend = useMemo(() => timer === 0 && step === "otp", [timer, step]);

  // Fetch minimum password length from config
  useEffect(() => {
    const fetchMinLength = async () => {
      try {
        const res = await API.get('/config/public');
        setMinPasswordLength(res.data?.security?.passwordMinLength || 8);
      } catch (err) {
        setMinPasswordLength(8); // Default to 8 if fetch fails
      }
    };
    fetchMinLength();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.hasPassword) {
      navigate("/");
    }
  }, [isAuthenticated, user?.hasPassword, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const tokenHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const handleAuthenticatedSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await API.put("/auth/password/set", { newPassword }, tokenHeader());
      login({ ...user, hasPassword: true });
      setStatus("Password set successfully. Redirecting...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password");
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      setSaving(true);
      await API.post("/auth/password/forgot", { email: email.trim() });
      setStep("otp");
      setStatus("If an account exists, we sent a code to your email.");
      setTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send code. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      setSaving(true);
      const res = await API.post("/auth/password/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });
      setResetToken(res.data?.resetToken || "");
      setStep("reset");
      setStatus("Code verified. Set a new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setStatus("");
    try {
      setSaving(true);
      await API.post("/auth/password/forgot", { email: email.trim() });
      setTimer(60);
      setStatus("We re-sent a new code to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await API.post("/auth/password/reset", {
        email: email.trim(),
        resetToken,
        newPassword,
      });
      setStep("done");
      setStatus("Password reset successfully. You can now log in.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setSaving(false);
    }
  };

  const formTitle = STEP_COPY[step];

  return (
    <div className={`flex items-center justify-center py-10 px-4 ${
      isDarkMode ? "bg-black" : "bg-gray-50"
    }`}>
      <div className={`max-w-md w-full p-6 rounded-lg shadow-md border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="mb-4">
          <h1 className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Set Your Password
          </h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {isAuthenticated ? "Create a password so you can log in with email next time." : formTitle}
          </p>
        </div>

        {status && (
          <div className={`mb-3 text-sm ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
            {status}
          </div>
        )}
        {error && (
          <div className={`mb-3 text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
            {error}
          </div>
        )}

        {isAuthenticated ? (
          <form className="space-y-4" onSubmit={handleAuthenticatedSubmit}>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                New Password
              </label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`At least ${minPasswordLength} characters`}
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-gray-500"
                    : "bg-white border-blue-200 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-gray-500"
                    : "bg-white border-blue-200 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400"
            >
              {saving ? "Saving..." : "Set Password"}
            </motion.button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={step === "email" ? handleSendOtp : step === "otp" ? handleVerifyOtp : handleResetPassword}
          >
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step !== "email"}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-gray-500 disabled:opacity-60"
                    : "bg-white border-blue-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
                }`}
              />
            </div>

            {(step === "otp" || step === "reset" || step === "done") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Verification Code
                  </label>
                  {step === "otp" && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!canResend || saving}
                      className={`text-xs font-semibold ${
                        canResend ? "text-blue-600 hover:text-blue-700" : "text-gray-400"
                      }`}
                    >
                      {canResend ? "Resend code" : `Resend in ${timer}s`}
                    </button>
                  )}
                </div>
                <input
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={step !== "otp"}
                  placeholder="123456"
                  className={`w-full px-4 py-3 rounded-lg border tracking-widest text-center text-lg font-bold transition-all outline-none ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-gray-500 disabled:opacity-60"
                      : "bg-white border-blue-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
                  }`}
                />
              </div>
            )}

            {(step === "reset" || step === "done") && (
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    New Password
                  </label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={step === "done"}
                    placeholder={`At least ${minPasswordLength} characters`}
                    className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                      isDarkMode
                        ? "bg-white/10 border-white/20 text-white placeholder-gray-500 disabled:opacity-60"
                        : "bg-white border-blue-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Confirm Password
                  </label>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={step === "done"}
                    placeholder="Repeat your password"
                    className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                      isDarkMode
                        ? "bg-white/10 border-white/20 text-white placeholder-gray-500 disabled:opacity-60"
                        : "bg-white border-blue-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
                    }`}
                  />
                </div>
              </div>
            )}

            {step !== "done" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400"
              >
                {saving
                  ? "Please wait..."
                  : step === "email"
                  ? "Send Code"
                  : step === "otp"
                  ? "Verify Code"
                  : "Set Password"}
              </motion.button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
