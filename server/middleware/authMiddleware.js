import jwt from "jsonwebtoken";
import User, { ADMIN_ROLE_SET } from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Not authorized" });
    if (!user.active) return res.status(403).json({ message: "Account is deactivated" });
    if (typeof decoded.tv !== "number" || decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    req.user = user;
    req.userRole = user.role;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (roles.length === 0) return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

export const requireAdminRole = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (!ADMIN_ROLE_SET.has(req.user.role)) {
    return res.status(403).json({ message: "Admin role required" });
  }
  return next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin required" });
  }
  return next();
};

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (!ADMIN_ROLE_SET.has(req.user.role)) {
    return res.status(403).json({ message: "Admin role required" });
  }
  return next();
};

// Event Admin: Check if user has access to specific event
export const requireEventAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Super admin has access to all events
  if (req.user.role === "super_admin" || req.user.role === "admin") {
    return next();
  }

  // Event admin can only access assigned events
  if (req.user.role === "event_admin") {
    const eventId = req.params.eventId || req.params.id || req.body.eventId;
    
    if (!eventId) {
      return res.status(400).json({ message: "Event ID required" });
    }

    // Check if event is in user's assignedEvents array
    const hasAccess = req.user.assignedEvents.some(
      (assignedId) => assignedId.toString() === eventId.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this event" });
    }

    return next();
  }

  return res.status(403).json({ message: "Insufficient permissions" });
};

// Event Admin only (not staff or other admins)
export const requireEventAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (!["event_admin", "super_admin", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Event admin role required" });
  }
  return next();
};

export default protect;
