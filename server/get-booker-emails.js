import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Booking from "./models/Booking.js";
import Event from "./models/Event.js";
import User from "./models/User.js";

async function getBookersEmails(eventId) {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("📧 Fetching email addresses for event...");
    const bookings = await Booking.find({ event: eventId })
      .populate("user", "name email phone")
      .populate("event", "name date time");

    if (bookings.length === 0) {
      console.log("❌ No bookings found for this event");
      await mongoose.disconnect();
      process.exit(0);
    }

    const event = bookings[0].event;
    console.log(`\n📌 Event: ${event.name}`);
    console.log(`📅 Date: ${event.date}`);
    console.log(`⏰ Time: ${event.time}`);
    console.log(`\n📨 Email addresses that received weather notifications:\n`);
    console.log("=".repeat(60));

    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.user.name}`);
      console.log(`   📧 Email: ${booking.user.email}`);
      console.log(`   📱 Phone: ${booking.user.phone || "Not provided"}`);
      console.log(`   🎫 Tickets: ${booking.quantity}`);
      console.log("-".repeat(60));
    });

    console.log(`\n✅ Total bookers notified: ${bookings.length}`);
    console.log(`✅ Total notifications sent (4 tests): ${bookings.length * 4}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

const eventId = process.argv[2];
if (!eventId) {
  console.log("❌ Event ID required");
  console.log("Usage: node get-booker-emails.js <eventId>");
  process.exit(1);
}

getBookersEmails(eventId);
