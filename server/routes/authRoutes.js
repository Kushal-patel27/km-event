import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  loginStaff,
  loginAdmin,
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
} from "../controllers/authController.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { protect, requireSuperAdmin } from "../middleware/authMiddleware.js";
import { protect, requireSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/staff/login", loginStaff);
router.post("/refresh", protect, refreshSession);
router.post("/logout", logout);
router.post("/admin/login", loginAdmin);
router.post("/refresh", protect, refreshSession);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
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
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/auth/callback?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}`);
  }
);

export default router;
