import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);


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
      await User.create({ name: adminName, email: adminEmail, password: hashed, role: 'admin' })
      console.log('Admin user created:', adminEmail)
    } else {
      // ensure role is admin
      if (existing.role !== 'admin') {
        existing.role = 'admin'
        await existing.save()
        console.log('Existing user promoted to admin:', adminEmail)
      }
    }
  } catch (err) {
    console.error('Failed to create admin user:', err.message)
  }
})()
