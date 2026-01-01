import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import passport from "./config/passport.js";
import contactRoutes from "./routes/contactRoutes.js";
import aboutRoutes from "./routes/aboutRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Please define it in your environment or .env file.");
  process.exit(1);
}

connectDB();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/about", aboutRoutes);


app.get("/", (req, res) => {
  res.send("K&M Events API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// create default admin user if configured
;(async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@local'
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
    const adminName = process.env.ADMIN_NAME || 'Admin'

    const existing = await User.findOne({ email: adminEmail })
    if (!existing) {
      const salt = await bcrypt.genSalt(10)
      const hashed = await bcrypt.hash(adminPass, salt)
      await User.create({ name: adminName, email: adminEmail, password: hashed, role: 'super_admin' })
      console.log('Admin user created:', adminEmail)
    } else {
      // ensure role is admin
      if (existing.role !== 'super_admin') {
        existing.role = 'super_admin'
        await existing.save()
        console.log('Existing user promoted to admin:', adminEmail)
      }
    }
  } catch (err) {
    console.error('Failed to create admin user:', err.message)
  }
})()
