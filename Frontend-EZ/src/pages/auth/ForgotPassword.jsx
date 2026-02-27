import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDarkMode } from '../../context/DarkModeContext';
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
} from '../../services/api';

const STEP_COPY = {
  email: "Send a verification code to your email",
  otp: "Enter the 6-digit code we emailed you",
  reset: "Create a new password",
  done: "Password updated successfully",
};

const initialState = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ForgotPassword() {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const [values, setValues] = useState(initialState);
  const [step, setStep] = useState("email");
  const [resetToken, setResetToken] = useState("");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Prevent body scroll on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const canResend = useMemo(() => timer === 0 && step === "otp", [timer, step]);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");
    try {
      await requestPasswordResetOtp(values.email.trim());
      setStep("otp");
      setStatus("If an account exists, we sent a code to your email.");
      setTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const res = await verifyPasswordResetOtp({ email: values.email.trim(), otp: values.otp.trim() });
      setResetToken(res.data?.resetToken || "");
      setStep("reset");
      setStatus("Code verified. Set a new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    setStatus("");
    try {
      await requestPasswordResetOtp(values.email.trim());
      setTimer(60);
      setStatus("We re-sent a new code to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    if (values.newPassword !== values.confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordWithToken({
        email: values.email.trim(),
        resetToken,
        newPassword: values.newPassword,
      });
      setStep("done");
      setStatus("Password reset successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const formTitle = STEP_COPY[step];

  return (
    <div className={`h-screen flex items-center justify-center px-4 transition-colors overflow-hidden ${
      isDarkMode ? "bg-black" : "bg-gray-50"
    }`}>
      <div
        className={`w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto rounded-xl shadow-xl border p-4 sm:p-5 transition-colors ${
          isDarkMode ? "bg-black border-white/10" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Forgot Password
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{formTitle}</p>
          </div>
          <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
            step === "done"
              ? isDarkMode ? "bg-green-900/30 text-green-300 border border-green-700" : "bg-green-100 text-green-700"
              : isDarkMode ? "bg-indigo-900/30 text-indigo-300 border border-indigo-700" : "bg-indigo-100 text-indigo-700"
          }`}>
            {step.toUpperCase()}
          </div>
        </div>

        {status && (
          <div className={`mb-2.5 p-2 rounded-lg text-xs sm:text-sm ${
            isDarkMode 
              ? "bg-green-900/20 border border-green-700 text-green-300" 
              : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            {status}
          </div>
        )}
        {error && (
          <div className={`mb-2.5 p-2 rounded-lg text-xs sm:text-sm ${
            isDarkMode 
              ? "bg-red-900/20 border border-red-700 text-red-300" 
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {error}
          </div>
        )}

        <form className="space-y-2.5" onSubmit={
          step === "email" ? handleSendOtp : step === "otp" ? handleVerifyOtp : handleResetPassword
        }>
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Email Address
            </label>
            <input
              required
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              disabled={step !== "email"}
              placeholder="you@example.com"
              className={`w-full px-3 py-2 rounded-lg border-2 transition-all outline-none focus:ring-2 focus:ring-offset-0 text-sm ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-50 disabled:bg-gray-900"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-gray-100"
              }`}
            />
          </div>

          {(step === "otp" || step === "reset" || step === "done") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-xs sm:text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Verification Code
                </label>
                {step === "otp" && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className={`text-xs font-semibold transition-colors ${
                      canResend 
                        ? isDarkMode 
                          ? "text-indigo-400 hover:text-indigo-300" 
                          : "text-indigo-600 hover:text-indigo-700"
                        : isDarkMode 
                          ? "text-gray-600 cursor-not-allowed" 
                          : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {canResend ? "Resend code" : `Resend in ${timer}s`}
                  </button>
                )}
              </div>
              <input
                required
                maxLength={6}
                value={values.otp}
                onChange={handleChange("otp")}
                disabled={step !== "otp"}
                placeholder="123456"
                className={`w-full px-3 py-2 rounded-lg border-2 tracking-widest text-center text-base font-bold transition-all outline-none focus:ring-2 focus:ring-offset-0 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-50 disabled:bg-gray-900"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-gray-100"
                }`}
              />
            </div>
          )}

          {(step === "reset" || step === "done") && (
            <div className="space-y-2">
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  New Password
                </label>
                <input
                  required
                  type="password"
                  value={values.newPassword}
                  onChange={handleChange("newPassword")}
                  disabled={step === "done"}
                  placeholder="At least 8 characters"
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-all outline-none focus:ring-2 focus:ring-offset-0 text-sm ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-50 disabled:bg-gray-900"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-gray-100"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Confirm Password
                </label>
                <input
                  required
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  disabled={step === "done"}
                  placeholder="Repeat your password"
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-all outline-none focus:ring-2 focus:ring-offset-0 text-sm ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-50 disabled:bg-gray-900"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-gray-100"
                  }`}
                />
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: step === "done" ? 1 : 1.02 }}
            whileTap={{ scale: step === "done" ? 1 : 0.98 }}
            type={step === "done" ? "button" : "submit"}
            onClick={step === "done" ? () => navigate("/login") : undefined}
            disabled={loading}
            className={`w-full py-2 rounded-lg font-bold text-white transition-all shadow-lg text-sm ${
              step === "done"
                ? "bg-green-600 hover:bg-green-700"
                : isDarkMode
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {step === "email" && (loading ? "Sending..." : "Send code")}
            {step === "otp" && (loading ? "Verifying..." : "Verify code")}
            {step === "reset" && (loading ? "Updating..." : "Reset password")}
            {step === "done" && "Back to login"}
          </motion.button>
        </form>

        <p className={`text-center mt-3 text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Remembered your password?{" "}
          <Link
            to="/login"
            className={`font-semibold ${isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"} transition-colors`}
          >
            Go back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
