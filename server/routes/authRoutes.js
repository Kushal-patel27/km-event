import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  setPassword,
  loginStaff,
  getMe,
  refreshSession,
  logout,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  logoutAll,
  getMyData,
  listAdmins,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
} from "../controllers/authController.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { protect, requireSuperAdmin } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please wait and try again." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset attempts. Please try again later." },
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/staff/login", loginStaff);
router.post("/password/forgot", otpRequestLimiter, requestPasswordResetOtp);
router.post("/password/verify-otp", otpVerifyLimiter, verifyPasswordResetOtp);
router.post("/password/reset", passwordResetLimiter, resetPasswordWithToken);
router.post("/refresh", protect, refreshSession);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/verify-session", protect, (req, res) => {
  // If middleware passed, session is valid
  res.json({ valid: true, user: { _id: req.user._id, email: req.user.email, role: req.user.role } });
});
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.put("/password/set", protect, setPassword);
router.get("/preferences", protect, getPreferences);
router.put("/preferences", protect, updatePreferences);
router.post("/logout-all", protect, logoutAll);
router.get("/my-data", protect, getMyData);

// Admin user management (super admin only)
router.get("/admin/users", protect, requireSuperAdmin, listAdmins);
router.post("/admin/users", protect, requireSuperAdmin, createAdminUser);
router.put("/admin/users/:adminId", protect, requireSuperAdmin, updateAdminUser);
router.delete("/admin/users/:adminId", protect, requireSuperAdmin, deleteAdminUser);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: process.env.FRONTEND_URL || "http://localhost:5173/login"
  }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const token = jwt.sign({ id: req.user._id, tv: req.user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/auth/callback?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}`);
  }
);

export default router;
