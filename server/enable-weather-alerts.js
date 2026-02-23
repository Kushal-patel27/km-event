import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import SystemConfig from "./models/SystemConfig.js";

async function enableWeatherAlerts() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("Enabling weather alerts...");
    const result = await SystemConfig.findByIdAndUpdate(
      "system_config",
      {
        $set: {
          "weatherAlerts.enabled": true,
          "weatherAlerts.allowedRoles": ["super_admin", "event_admin", "staff_admin"],
        },
      },
      { upsert: true, new: true }
    );

    console.log("✅ Weather alerts enabled!");
    console.log("Config:", result.weatherAlerts);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

enableWeatherAlerts();
