import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Not authorized" });
      if (!user.active) return res.status(403).json({ message: "Account is deactivated" });
      // tokenVersion check
      if (typeof decoded.tv !== 'number' || decoded.tv !== user.tokenVersion) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "No token provided" });
  }
};

export default protect;

// Require admin role
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' })
  }
  next()
}
