import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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
import faqRoutes from "./routes/faqRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import User from "./models/User.js";
import HelpArticle from "./models/HelpArticle.js";
import FAQ from "./models/FAQ.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

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
app.use("/api/faq", faqRoutes);
app.use("/api/help", helpRoutes);


app.get("/", (req, res) => {
  res.send("K&M Events API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// Seed default FAQs if the collection is empty
async function seedFAQs(createdByUser){
  try {
    const count = await FAQ.countDocuments()
    if (count >= 5) {
      console.log(`FAQ already sufficiently populated (${count} entries).`)
      return
    }

    const faqs = [
      // Booking & Tickets
      { category: 'Booking & Tickets', question: 'How do I book tickets?', answer: 'Go to the Events page, pick an event, choose seats, and complete payment. Your ticket is issued instantly.' },
      { category: 'Booking & Tickets', question: 'Can I select specific seats?', answer: 'Yes. For seated events, you can pick seats from the seat map during checkout.' },
      { category: 'Booking & Tickets', question: 'Can I book for friends?', answer: 'You can book multiple tickets and share the QR tickets with your friends.' },

      // Tickets & Entry
      { category: 'Tickets & Entry', question: 'What is a QR ticket?', answer: 'A scannable QR code that validates your entry. Show it at the gate on your phone.' },
      { category: 'Tickets & Entry', question: 'QR not scanning — what should I do?', answer: 'Increase screen brightness and hold steady. Our staff can manually verify your ticket if needed.' },
      { category: 'Tickets & Entry', question: 'Can I enter late?', answer: 'Entry rules depend on the organizer, but most events allow late entry up to a grace period.' },

      // Payment & Refunds
      { category: 'Payment & Refunds', question: 'What payment methods are supported?', answer: 'We support cards, UPI, and popular wallets. Methods may vary by region.' },
      { category: 'Payment & Refunds', question: 'What is your refund policy?', answer: 'Refunds depend on the event’s policy. If an event is cancelled, you receive a full refund automatically.' },
      { category: 'Payment & Refunds', question: 'How long do refunds take?', answer: 'Typically 5–7 business days to your original payment method, depending on your bank.' },

      // Account & Profile
      { category: 'Account & Profile', question: 'How do I reset my password?', answer: 'Use “Forgot Password” on the login page. We’ll email you a reset link.' },
      { category: 'Account & Profile', question: 'How do I change my email?', answer: 'Go to Settings to update your profile details and contact information.' },
      { category: 'Account & Profile', question: 'Where can I find my bookings?', answer: 'See “My Bookings” for all current and past tickets and download options.' },

      // Support & Help
      { category: 'Support & Help', question: 'How do I contact support?', answer: 'Email k.m.easyevents@gmail.com or use the Contact page. We respond within 24 hours.' },
      { category: 'Support & Help', question: 'Do you offer live chat?', answer: 'Yes, live chat is available during business hours for quick assistance.' },
      { category: 'Support & Help', question: 'How fast will I get a response?', answer: 'Most queries are resolved within 24 hours on working days.' },

      // Other
      { category: 'Other', question: 'Do you offer student discounts?', answer: 'Some organizers provide student pricing. Check the event page for available offers.' },
      { category: 'Other', question: 'Is there a mobile app?', answer: 'We’re working on it. Meanwhile, the website is optimized for mobile use.' },
    ].map(f => ({ ...f, isActive: true, createdBy: createdByUser?._id }))

    await FAQ.insertMany(faqs)
    console.log('Seeded default FAQs (added', faqs.length, 'entries).')
  } catch (err) {
    console.error('Failed to seed FAQs:', err.message)
  }
}

// Seed default help articles if the collection is underpopulated
async function seedHelpArticles(createdByUser) {
  try {
    const count = await HelpArticle.countDocuments()
    if (count >= 6) {
      console.log(`Help articles already sufficiently populated (${count} entries).`)
      return
    }

    const articles = [
      {
        category: 'Getting Started',
        title: 'Create Your Account',
        description: 'Sign up in seconds to start booking your favorite events.',
        steps: [
          'Click "Sign Up" on the homepage',
          'Enter your email and create a password',
          'Verify your email address',
          'Complete your profile (optional)',
        ],
        order: 1,
      },
      {
        category: 'Booking & Tickets',
        title: 'How to Book',
        description: 'Step-by-step booking guide.',
        steps: [
          'Find and select your event',
          'Choose ticket quantity and seats',
          'Review and confirm',
          'Complete payment securely',
        ],
        order: 2,
      },
      {
        category: 'Tickets & Entry',
        title: 'Using Your Ticket',
        description: 'How to enter with your digital ticket.',
        steps: [
          'Arrive before event start',
          'Show the QR code at entry',
          'Bring an ID if requested',
        ],
        order: 3,
      },
      {
        category: 'Payment & Refunds',
        title: 'Refund Policy',
        description: 'When you can get your money back.',
        steps: [
          'Cancellations depend on event policy',
          'Event cancelled by organizer: full refund',
          'Refunds typically 5-7 business days',
        ],
        order: 4,
      },
      {
        category: 'Account & Profile',
        title: 'Password Management',
        description: 'Securing your account.',
        steps: [
          'Use strong, unique passwords',
          'Use "Forgot Password" if you forget',
          'Change password regularly',
        ],
        order: 5,
      },
      {
        category: 'Troubleshooting',
        title: 'Payment Failed',
        description: 'What to do when payment is declined.',
        steps: [
          'Check card funds and details',
          'Contact your bank to unblock',
          'Try another payment method',
        ],
        order: 6,
      },
    ].map(item => ({ ...item, isActive: true, createdBy: createdByUser?._id }))

    await HelpArticle.insertMany(articles)
    console.log('Seeded default help articles (added', articles.length, 'entries).')
  } catch (err) {
    console.error('Failed to seed help articles:', err.message)
  }
}

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

    // After ensuring admin exists, seed FAQs and Help Center articles
    const adminUser = await User.findOne({ email: adminEmail })
    if (adminUser) {
      await seedFAQs(adminUser)
      await seedHelpArticles(adminUser)
    } else {
      console.warn('Admin user not found; skipping FAQ and help seeds.')
    }
  } catch (err) {
    console.error('Failed to create admin user:', err.message)
  }
})()
