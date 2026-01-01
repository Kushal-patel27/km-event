import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  refreshSession,
  logout,
  me,
  listSessions,
  revokeSession,
  listAdmins,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../controllers/authController.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { protect, requireAdminRole, requireSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/refresh", refreshSession);
router.post("/logout", logout);
router.get("/me", protect, me);
router.get("/sessions", protect, requireAdminRole, listSessions);
router.post("/sessions/revoke/:id", protect, requireAdminRole, revokeSession);
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
