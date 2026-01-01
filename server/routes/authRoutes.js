import express from "express";
import { registerUser, loginUser, getMe, updateProfile, changePassword, getPreferences, updatePreferences, logoutAll, getMyData } from "../controllers/authController.js";
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

export default router;
