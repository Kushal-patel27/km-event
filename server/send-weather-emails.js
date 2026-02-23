import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Booking from "./models/Booking.js";
import Event from "./models/Event.js";
import User from "./models/User.js";
import WeatherAlertConfig from "./models/WeatherAlertConfig.js";
import { fetchWeatherByCoordinates } from "./utils/weatherService.js";
import { sendWeatherAlertEmail } from "./utils/emailService.js";

async function sendEmailsWithDatabaseWeather(eventId) {
  try {
    // Fetch event with all details
    console.log("📍 Fetching comprehensive event details...");
    const event = await Event.findById(eventId)
      .populate("organizer", "name email phone");
    if (!event) {
      console.log("❌ Event not found");
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Event: ${event.title}`);
    console.log(`📅 Date: ${event.date}`);
    console.log(`⏰ Time: ${event.time}`);
    console.log(`📍 Location: ${event.location}`);
    console.log(`👤 Organizer: ${event.organizer?.name || "Not assigned"}`);
    console.log(`📧 Organizer Email: ${event.organizer?.email || "Not available"}`);
    console.log(`💰 Price: ${event.price || "Free"}`);
    console.log(`📝 Description: ${event.description ? event.description.substring(0, 60) + "..." : "N/A"}`);
    console.log(`📌 Coordinates: ${event.latitude}, ${event.longitude}\n`);

    // Check if event has coordinates
    if (!event.latitude || !event.longitude) {
      console.log("⚠️  Event doesn't have coordinates. Using default location (New York)");
      event.latitude = 40.7128;
      event.longitude = -74.0060;
    }

    // Fetch weather alert config
    console.log("⚙️  Fetching weather alert configuration...");
    const alertConfig = await WeatherAlertConfig.findOne({ event: eventId });
    if (!alertConfig) {
      console.log("⚠️  No weather alert configuration found");
    } else {
      console.log(`✅ Weather alerts enabled: ${alertConfig.enabled}`);
      const enabledAlerts = alertConfig.alertTypes ? Object.keys(alertConfig.alertTypes).filter(k => alertConfig.alertTypes[k]) : [];
      console.log(`✅ Alert types: ${enabledAlerts.length > 0 ? enabledAlerts.join(", ") : "None"}\n`);
    }

    // Fetch current weather
    console.log("🌤️  Fetching current weather data...");
    let weather;
    try {
      weather = await fetchWeatherByCoordinates(event.latitude, event.longitude);
    } catch (weatherErr) {
      console.log("⚠️  Could not fetch live weather. Using sample data.");
      weather = {
        temperature: 28,
        humidity: 75,
        windSpeed: 15,
        description: "Partly Cloudy",
        rainfall: 0
      };
    }
    console.log(`✅ Temperature: ${weather.temperature}°C`);
    console.log(`✅ Humidity: ${weather.humidity}%`);
    console.log(`✅ Wind Speed: ${weather.windSpeed} km/h`);
    console.log(`✅ Description: ${weather.description}\n`);

    // Fetch all bookings with complete details
    console.log("📋 Fetching detailed booking information...");
    const bookings = await Booking.find({ event: eventId })
      .populate("user", "name email phone")
      .populate("event", "title date time location price");

    if (bookings.length === 0) {
      console.log("❌ No bookings found for this event");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`✅ Found ${bookings.length} bookings\n`);

    // Send emails to all bookers
    console.log("📧 Sending weather notification emails...");
    console.log("=".repeat(80));

    let successCount = 0;
    let failedCount = 0;

    for (const booking of bookings) {
      try {
        const emailSent = await sendWeatherAlertEmail(
          {
            user: booking.user,
            event: {
              title: event.title,
              name: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              price: event.price,
              description: event.description,
              organizer: event.organizer
            },
            quantity: booking.quantity,
          },
          {
            type: "alert",
            message: `Current weather for your event: ${weather.description}`,
            condition: weather.description,
            temperature: weather.temperature,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            rainfall: weather.rainfall || 0,
            feelsLike: weather.temperature
          },
          event.organizer?.name || "Event Management Team"
        );

        if (emailSent) {
          console.log(`✅ Email sent successfully`);
          console.log(`   📧 To: ${booking.user.email}`);
          console.log(`   👤 Booker: ${booking.user.name}`);
          console.log(`   🎪 Event: ${event.title}`);
          console.log(`   📅 Date: ${new Date(event.date).toLocaleDateString()}`);
          console.log(`   🎫 Tickets: ${booking.quantity}`);
          console.log(`   💰 Price: ${event.price || "Free"}`);
          console.log(`   📍 Location: ${event.location}`);
          console.log("");
          successCount++;
        } else {
          console.log(`❌ Failed to send to: ${booking.user.email}`);
          failedCount++;
        }
      } catch (err) {
        console.log(`❌ Error sending to ${booking.user.email}: ${err.message}`);
        failedCount++;
      }
    }

    console.log("=".repeat(70));
    console.log(`\n📊 Email Summary:`);
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📨 Total: ${successCount + failedCount}\n`);

    await mongoose.disconnect();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

const eventId = process.argv[2];
if (!eventId) {
  console.log("❌ Event ID required");
  console.log("Usage: node send-weather-emails.js <eventId>\n");
  console.log("Example: node send-weather-emails.js 694d26c00a90738cda19ebb8");
  process.exit(1);
}

sendEmailsWithDatabaseWeather(eventId);
