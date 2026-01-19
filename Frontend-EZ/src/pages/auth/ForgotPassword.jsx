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
    <div className={`flex items-center justify-center py-10 px-4 ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <div
        className={`max-w-md w-full p-6 rounded-lg shadow-md border transition-colors ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Forgot Password
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{formTitle}</p>
          </div>
          <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
            step === "done"
              ? "bg-green-100 text-green-700"
              : "bg-indigo-100 text-indigo-700"
          }`}>
            {step.toUpperCase()}
          </div>
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

        <form className="space-y-4" onSubmit={
          step === "email" ? handleSendOtp : step === "otp" ? handleVerifyOtp : handleResetPassword
        }>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Email Address
            </label>
            <input
              required
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              disabled={step !== "email"}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                isDarkMode
                  ? "bg-white/10 border-white/20 text-white placeholder-gray-400 disabled:opacity-60"
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
                    disabled={!canResend || loading}
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
                value={values.otp}
                onChange={handleChange("otp")}
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
                  value={values.newPassword}
                  onChange={handleChange("newPassword")}
                  disabled={step === "done"}
                  placeholder="At least 8 characters"
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
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
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

          <motion.button
            whileHover={{ scale: step === "done" ? 1 : 1.02 }}
            whileTap={{ scale: step === "done" ? 1 : 0.98 }}
            type={step === "done" ? "button" : "submit"}
            onClick={step === "done" ? () => navigate("/login") : undefined}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
              step === "done"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-700 hover:bg-blue-800"
            } ${loading ? "opacity-80" : ""}`}
          >
            {step === "email" && (loading ? "Sending..." : "Send code")}
            {step === "otp" && (loading ? "Verifying..." : "Verify code")}
            {step === "reset" && (loading ? "Updating..." : "Reset password")}
            {step === "done" && "Back to login"}
          </motion.button>
        </form>

        <p className={`text-center mt-4 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Remembered your password?{" "}
          <Link
            to="/login"
            className={`${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-700 hover:text-blue-800"}`}
          >
            Go back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
