import axios from "axios";
import Weather from "../models/Weather.js";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const DEFAULT_UNITS = process.env.WEATHER_UNITS || "metric"; // metric | imperial

// Cache to store weather data with timestamps
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get current weather by coordinates
 */
export const fetchWeatherByCoordinates = async (latitude, longitude, units = DEFAULT_UNITS) => {
  try {
    const cacheKey = `${latitude},${longitude},${units}`;
    const cachedData = weatherCache.get(cacheKey);

    // Return cached data if still valid
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=${units}`
    );

    const windSpeedRaw = response.data.wind.speed || 0;
    // OpenWeather returns m/s for metric and miles/hour for imperial
    const windSpeed = units === "imperial"
      ? Math.round(windSpeedRaw)
      : Math.round(windSpeedRaw * 3.6);

    const weatherData = {
      location: response.data.name,
      latitude: response.data.coord.lat,
      longitude: response.data.coord.lon,
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      windSpeed,
      weatherCondition: response.data.weather[0].main,
      weatherDescription: response.data.weather[0].description,
      visibility: response.data.visibility,
      rainfall: response.data.rain?.["1h"] || 0,
      pressure: response.data.main.pressure,
      units,
    };

    // Cache the data
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather:", error.message);
    throw new Error("Failed to fetch weather data");
  }
};

/**
 * Get weather forecast
 */
export const fetchWeatherForecast = async (latitude, longitude, units = DEFAULT_UNITS) => {
  try {
    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=${units}`
    );

    const forecast = response.data.list
      .filter((item, index) => index % 8 === 0) // Get every 24 hours
      .slice(0, 5) // Get 5 days forecast
      .map((item) => ({
        date: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: units === "imperial"
          ? Math.round(item.wind.speed || 0)
          : Math.round((item.wind.speed || 0) * 3.6),
        rainfall: item.rain?.["3h"] || 0,
        units,
      }));

    return forecast;
  } catch (error) {
    console.error("Error fetching forecast:", error.message);
    throw new Error("Failed to fetch weather forecast");
  }
};

/**
 * Get UV index
 */
export const fetchUVIndex = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/uvi?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`
    );
    return response.data.value;
  } catch (error) {
    console.error("Error fetching UV index:", error.message);
    return null;
  }
};

/**
 * Detect weather risk types and return risk level
 * Returns: { riskType, riskLevel, details }
 */
export const detectWeatherRisks = (weatherData) => {
  const risks = [];
  const temp = weatherData.temperature;
  const condition = weatherData.weatherCondition.toLowerCase();
  const windSpeed = weatherData.windSpeed;
  const rainfall = weatherData.rainfall || 0;
  const units = weatherData.units || "metric";

  // EXTREME HEAT (> 35°C / 95°F)
  const heatThreshold = units === "metric" ? 35 : 95;
  if (temp > heatThreshold) {
    risks.push({
      type: "HEATWAVE",
      level: temp > (units === "metric" ? 40 : 104) ? "warning" : "caution",
      temperature: temp,
      details: `Temperature: ${temp}°${units === "metric" ? "C" : "F"}`,
    });
  }

  // THUNDERSTORM (Severe)
  if (condition.includes("thunderstorm") || condition.includes("tornado")) {
    risks.push({
      type: "THUNDERSTORM",
      level: "warning",
      condition,
      details: "Thunderstorm or severe weather expected",
    });
  }

  // HEAVY RAIN (> 5mm in 3h)
  if (condition.includes("rain")) {
    if (rainfall > 5) {
      risks.push({
        type: "HEAVY_RAIN",
        level: rainfall > 10 ? "warning" : "caution",
        rainfall,
        details: `Heavy rainfall expected (${rainfall}mm)`,
      });
    }
  }

  // STRONG WINDS (> 40 km/h)
  const windThreshold = units === "metric" ? 40 : 25; // km/h or mph
  if (windSpeed > windThreshold) {
    risks.push({
      type: "STRONG_WIND",
      level: windSpeed > (units === "metric" ? 60 : 37) ? "warning" : "caution",
      windSpeed,
      details: `Wind speed: ${windSpeed} ${units === "metric" ? "km/h" : "mph"}`,
    });
  }

  // CYCLONE / TORNADO (Condition check)
  if (condition.includes("tornado") || condition.includes("squall")) {
    risks.push({
      type: "CYCLONE",
      level: "warning",
      condition,
      details: "Severe cyclone or tornado alert",
    });
  }

  return {
    hasRisk: risks.length > 0,
    risks,
    riskSummary:
      risks.length > 0
        ? risks.map((r) => r.type).join(", ")
        : "No major risks",
  };
};

/**
 * Generate weather notification based on conditions
 */
export const generateWeatherNotification = (weatherData) => {
  const riskData = detectWeatherRisks(weatherData);
  const alerts = [];
  let notificationType = "info";

  const temp = weatherData.temperature;
  const condition = weatherData.weatherCondition.toLowerCase();
  const windSpeed = weatherData.windSpeed;
  const humidity = weatherData.humidity;
  const rainfall = weatherData.rainfall;

  // Map detected risks to alerts
  for (const risk of riskData.risks) {
    if (risk.level === "warning") {
      notificationType = "warning";
    } else if (risk.level === "caution" && notificationType !== "warning") {
      notificationType = "caution";
    }

    switch (risk.type) {
      case "HEATWAVE":
        alerts.push(`🌡️ Extreme heat warning! ${risk.details} - Stay hydrated and seek shade.`);
        break;
      case "HEAVY_RAIN":
        alerts.push(`🌧️ Heavy rainfall expected (${rainfall}mm). Carry an umbrella!`);
        break;
      case "THUNDERSTORM":
        alerts.push("⚡ Severe weather warning! Thunderstorm expected.");
        break;
      case "STRONG_WIND":
        alerts.push(`💨 Strong wind warning! Wind speed: ${windSpeed} - Be cautious during the event.`);
        break;
      case "CYCLONE":
        alerts.push("🌀 Severe cyclone/tornado alert! Take shelter immediately.");
        break;
    }
  }

  // Additional conditions not yet flagged as risks
  if (temp < 0) {
    alerts.push("❄️ Freezing conditions! Wear appropriate winter clothing.");
    notificationType = "warning";
  }

  if (condition.includes("snow")) {
    alerts.push("❄️ Snow expected. Dress warmly and wear snow boots.");
    if (notificationType === "info") notificationType = "caution";
  }

  if (humidity > 85) {
    alerts.push("💧 High humidity. It may feel hotter than the actual temperature.");
  }

  if (condition.includes("fog") || condition.includes("mist")) {
    alerts.push("🌫️ Poor visibility expected. Be careful while traveling.");
    if (notificationType === "info") notificationType = "caution";
  }

  return {
    hasAlert: alerts.length > 0,
    notifications: alerts,
    type: notificationType,
    riskData,
    message:
      alerts.length > 0
        ? alerts.join("\n")
        : "Weather conditions are normal. Enjoy the event!",
  };
};

/**
 * Save or update weather data for an event
 */
export const saveWeatherData = async (eventId, weatherData, forecast) => {
  try {
    const notification = generateWeatherNotification(weatherData);

    const weatherRecord = await Weather.findOneAndUpdate(
      { eventId },
      {
        ...weatherData,
        eventId,
        forecast,
        notificationSent: true,
        notificationType: notification.type,
        notificationMessage: notification.message,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Attach risk data to the weather object for downstream use
    weatherRecord.riskData = notification.riskData;

    return weatherRecord;
  } catch (error) {
    console.error("Error saving weather data:", error.message);
    throw error;
  }
};

/**
 * Get weather alerts for an event
 */
export const getWeatherAlerts = async (eventId) => {
  try {
    const weatherData = await Weather.findOne({ eventId });

    if (!weatherData) {
      return {
        hasAlert: false,
        notifications: [],
        message: "No weather data available",
      };
    }

    return {
      hasAlert: weatherData.notificationType !== "none",
      notificationType: weatherData.notificationType,
      message: weatherData.notificationMessage,
      temperature: weatherData.temperature,
      condition: weatherData.weatherCondition,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      rainfall: weatherData.rainfall,
      lastUpdated: weatherData.lastUpdated,
    };
  } catch (error) {
    console.error("Error getting weather alerts:", error.message);
    throw error;
  }
};

/**
 * Clear old cache entries
 */
export const clearOldCache = () => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      weatherCache.delete(key);
    }
  }
};

// Run cache cleanup every 30 minutes
setInterval(clearOldCache, 30 * 60 * 1000);
