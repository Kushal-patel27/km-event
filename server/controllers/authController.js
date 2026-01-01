import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

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
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

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
