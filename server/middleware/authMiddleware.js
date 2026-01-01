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
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  return next();
};

export default protect;
