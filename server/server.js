import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import scannerRoutes from "./routes/scannerRoutes.js";
import highPerformanceScannerRoutes from "./routes/highPerformanceScannerRoutes.js";
import staffAdminRoutes from "./routes/staffAdminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import eventAdminRoutes from "./routes/eventAdminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import aboutRoutes from "./routes/aboutRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import eventRequestRoutes from "./routes/eventRequestRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import organizersPageRoutes from "./routes/organizersPageRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

// Connect Database
connectDB();

const app = express();

/* ===========================
   ✅ CORS CONFIGURATION
   =========================== */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

      if (
        allowedOrigins.includes(origin) ||
        origin.includes(".trycloudflare.com")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    },
    credentials: true,
  })
);

/* ===========================
   MIDDLEWARE
   =========================== */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ===========================
   ROUTES
   =========================== */

app.use("/api/auth", authRoutes);
app.use("/api/config", configRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/event-requests", eventRequestRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/organizers-page", organizersPageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/hp-scanner", highPerformanceScannerRoutes);
app.use("/api/staff-admin", staffAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/event-admin", eventAdminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/help", helpRoutes);

/* ===========================
   HEALTH CHECK
   =========================== */
app.get("/", (req, res) => {
  res.send("K&M Events API running...");
});

/* ===========================
   SERVER START
   =========================== */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

/* ===========================
   GRACEFUL SHUTDOWN
   =========================== */
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});