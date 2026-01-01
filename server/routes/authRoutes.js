import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  logoutAll,
  getMyData,
} from "../controllers/authController.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.get("/preferences", protect, getPreferences);
router.put("/preferences", protect, updatePreferences);
router.post("/logout-all", protect, logoutAll);
router.get("/my-data", protect, getMyData);

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
