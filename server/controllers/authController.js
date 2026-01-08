import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User, { ADMIN_ROLE_SET } from "../models/User.js";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

const adminRoles = new Set(["super_admin", "event_admin", "staff_admin", "admin"]);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function signRefreshToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

function getClientMetadata(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0]?.trim() || req.ip;
  return {
    userAgent: req.get("user-agent") || "unknown",
    ip,
  };
}

function buildUserResponse(user, token) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    token,
  };
}

async function issueTokensAndRespond(user, req, res) {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = signRefreshToken(user._id, sessionId.toString());
  const { userAgent, ip } = getClientMetadata(req);

  const session = {
    _id: sessionId,
    tokenHash: hashToken(refreshToken),
    userAgent,
    ip,
    lastSeenAt: new Date(),
  };

  user.sessions.push(session);
  while (user.sessions.length > 5) {
    user.sessions.shift();
  }
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
  return res.json(buildUserResponse(user, accessToken));
}

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!JWT_SECRET) return res.status(500).json({ message: "Missing JWT_SECRET" });

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.active) {
      return res.status(403).json({ message: "Account disabled. Contact support." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Password login not available for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login admin/staff user
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.active) {
      return res.status(403).json({ message: "Account disabled. Contact support." });
    }

    // Check if user is an admin
    if (!ADMIN_ROLE_SET.has(user.role)) {
      return res.status(403).json({ message: "Only admin users can login here" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Password login not available for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login staff (scanner) user
export const loginStaff = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.active) {
      return res.status(403).json({ message: "Account disabled. Contact support." });
    }

    // Check if user is staff (scanner only)
    if (user.role !== "staff") {
      return res.status(403).json({ message: "Only scanner staff can login here" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Password login not available for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedEvents: user.assignedEvents,
      assignedGates: user.assignedGates,
      lastLoginAt: user.lastLoginAt,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current authenticated user
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware without password
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh session - create new token
export const refreshSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = jwt.sign({ id: req.user._id, tv: req.user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout - clear session
export const logout = async (req, res) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile (name, email)
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If changing email, ensure unique
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    await user.save();

    const token = jwt.sign({ id: user._id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get / update preferences
export const getPreferences = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    res.json(req.user.preferences || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    const user = await User.findById(req.user._id);
    user.preferences = {
      ...user.preferences,
      ...req.body,
    };
    await user.save();
    res.json(user.preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout all sessions: bump tokenVersion
export const logoutAll = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    const user = await User.findById(req.user._id);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download my data (Contacts + Bookings)
import Contact from "../models/Contact.js";
import Booking from "../models/Booking.js";

export const getMyData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    const [contacts, bookings] = await Promise.all([
      Contact.find({ userId: req.user._id }).lean(),
      Booking.find({ user: req.user._id }).lean(),
    ]);
    res.json({
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
      contacts,
      bookings,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all admin users (super admin only)
export const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: Array.from(ADMIN_ROLE_SET) } })
      .select("-password")
      .lean();
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create admin user (super admin only)
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedEvents } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Validate role
    if (!ADMIN_ROLE_SET.has(role)) {
      return res.status(400).json({ message: "Invalid admin role" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      assignedEvents: assignedEvents || [],
      active: true,
    });

    res.status(201).json({
      message: "Admin user created successfully",
      admin: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update admin user (super admin only)
export const updateAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, password, role, assignedEvents } = req.body;

    // Validate adminId
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: "Invalid admin ID" });
    }

    const user = await User.findById(adminId);
    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: adminId } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (role) {
      if (!ADMIN_ROLE_SET.has(role)) {
        return res.status(400).json({ message: "Invalid admin role" });
      }
      user.role = role;
    }
    if (assignedEvents) {
      user.assignedEvents = assignedEvents;
    }

    await user.save();

    res.json({
      message: "Admin updated successfully",
      admin: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete admin user (super admin only)
export const deleteAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Validate adminId
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: "Invalid admin ID" });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === adminId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(adminId);
    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

