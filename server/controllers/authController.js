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

    return await issueTokensAndRespond(user, req, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.password) {
      return res.status(400).json({ message: "Password login not available for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    return await issueTokensAndRespond(user, req, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!adminRoles.has(user.role)) {
      return res.status(403).json({ message: "Not an admin account" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Password login not available for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    return await issueTokensAndRespond(user, req, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshSession = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const tokenHash = hashToken(refreshToken);
    const session = user.sessions.id(decoded.sid);
    if (!session || session.tokenHash !== tokenHash) {
      return res.status(401).json({ message: "Session expired" });
    }

    session.tokenHash = hashToken(refreshToken); // keep in sync
    session.lastSeenAt = new Date();

    const newRefreshToken = signRefreshToken(user._id, session._id.toString());
    session.tokenHash = hashToken(newRefreshToken);

    await user.save();

    const accessToken = signAccessToken(user);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    return res.json(buildUserResponse(user, accessToken));
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.sessions = user.sessions.filter((s) => s._id.toString() !== decoded.sid);
        await user.save();
      }
    } catch (err) {
      // ignore invalid token on logout
    }
  }

  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_OPTIONS.path });
  res.clearCookie("accessToken", { path: ACCESS_COOKIE_OPTIONS.path });
  return res.json({ message: "Logged out" });
};

export const me = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  const accessToken = req.cookies?.accessToken;
  return res.json(buildUserResponse(req.user, accessToken));
};

export const listSessions = async (req, res) => {
  const sessions = (req.user?.sessions || []).map((s) => ({
    id: s._id,
    userAgent: s.userAgent,
    ip: s.ip,
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
  }));
  return res.json({ sessions });
};

export const revokeSession = async (req, res) => {
  const { id } = req.params;
  const targetId = id?.toString();
  if (!targetId) return res.status(400).json({ message: "Session id required" });

  req.user.sessions = req.user.sessions.filter((s) => s._id.toString() !== targetId);
  await req.user.save();

  // If the revoked session is the caller's cookie, clear it
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      if (decoded.sid === targetId) {
        res.clearCookie("refreshToken", { path: REFRESH_COOKIE_OPTIONS.path });
        res.clearCookie("accessToken", { path: ACCESS_COOKIE_OPTIONS.path });
      }
    }
  } catch (err) {
    // ignore invalid cookie
  }

  return res.json({ message: "Session revoked" });
};

export const listAdmins = async (req, res) => {
  const admins = await User.find({ role: { $in: Array.from(ADMIN_ROLE_SET) } })
    .select("name email role createdAt lastLoginAt assignedEvents")
    .populate("assignedEvents", "name");
  return res.json({ admins });
};

export const createAdminUser = async (req, res) => {
  const { name, email, password, role, assignedEvents } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ message: "name, email, password, and role are required" });
  }

  if (!ADMIN_ROLE_SET.has(role)) {
    return res.status(400).json({ message: "Invalid admin role" });
  }

  const existing = await User.findOne({ email });
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.password = hashed;
    if (assignedEvents && Array.isArray(assignedEvents)) {
      existing.assignedEvents = assignedEvents;
    }
    await existing.save();
    return res.json({ message: "Admin updated", user: buildUserResponse(existing) });
  }

  const user = await User.create({ 
    name, 
    email, 
    password: hashed, 
    role,
    assignedEvents: assignedEvents || []
  });
  return res.status(201).json({ message: "Admin created", user: buildUserResponse(user) });
};

export const updateAdminUser = async (req, res) => {
  const { adminId } = req.params;
  const { name, email, password, role, assignedEvents } = req.body;

  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!ADMIN_ROLE_SET.has(role)) {
      return res.status(400).json({ message: "Invalid admin role" });
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.role = role || admin.role;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    if (assignedEvents && Array.isArray(assignedEvents)) {
      admin.assignedEvents = assignedEvents;
    }

    await admin.save();
    return res.json({ message: "Admin updated successfully", user: buildUserResponse(admin) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update admin", error: err.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  const { adminId } = req.params;

  try {
    const admin = await User.findByIdAndDelete(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete admin", error: err.message });
  }
};
