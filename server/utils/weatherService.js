import axios from "axios";
import Weather from "../models/Weather.js";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Cache to store weather data with timestamps
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get current weather by coordinates
 */
export const fetchWeatherByCoordinates = async (latitude, longitude) => {
  try {
    const cacheKey = `${latitude},${longitude}`;
    const cachedData = weatherCache.get(cacheKey);

    // Return cached data if still valid
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const weatherData = {
      location: response.data.name,
      latitude: response.data.coord.lat,
      longitude: response.data.coord.lon,
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      windSpeed: Math.round(response.data.wind.speed * 3.6), // Convert m/s to km/h
      weatherCondition: response.data.weather[0].main,
      weatherDescription: response.data.weather[0].description,
      visibility: response.data.visibility,
      rainfall: response.data.rain?.["1h"] || 0,
      pressure: response.data.main.pressure,
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
export const fetchWeatherForecast = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
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
        windSpeed: Math.round(item.wind.speed * 3.6),
        rainfall: item.rain?.["3h"] || 0,
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
 * Generate weather notification based on conditions
 */
export const generateWeatherNotification = (weatherData) => {
  const alerts = [];
  let notificationType = "info";

  const temp = weatherData.temperature;
  const condition = weatherData.weatherCondition.toLowerCase();
  const windSpeed = weatherData.windSpeed;
  const humidity = weatherData.humidity;
  const rainfall = weatherData.rainfall;

  // Temperature alerts
  if (temp > 40) {
    alerts.push("🌡️ Extreme heat warning! Stay hydrated and seek shade.");
    notificationType = "warning";
  } else if (temp < 0) {
    alerts.push("❄️ Freezing conditions! Wear appropriate winter clothing.");
    notificationType = "warning";
  } else if (temp > 35) {
    alerts.push("☀️ High temperature. Please drink plenty of water.");
    notificationType = "caution";
  }

  // Weather condition alerts
  if (
    condition.includes("thunderstorm") ||
    condition.includes("tornado") ||
    condition.includes("squall")
  ) {
    alerts.push("⚡ Severe weather warning! Thunderstorm or tornado expected.");
    notificationType = "warning";
  } else if (condition.includes("rain")) {
    if (rainfall > 5) {
      alerts.push("🌧️ Heavy rainfall expected. Carry an umbrella!");
      notificationType = "caution";
    } else {
      alerts.push("🌦️ Light rain expected. Bring an umbrella just in case.");
      notificationType = "info";
    }
  } else if (condition.includes("snow")) {
    alerts.push("❄️ Snow expected. Dress warmly and wear snow boots.");
    notificationType = "caution";
  }

  // Wind alerts
  if (windSpeed > 50) {
    alerts.push("💨 Strong wind warning! Be cautious during the event.");
    notificationType = "warning";
  } else if (windSpeed > 30) {
    alerts.push("🌬️ Moderate wind expected. Secure loose items.");
    notificationType = "caution";
  }

  // Humidity alerts
  if (humidity > 85) {
    alerts.push("💧 High humidity. It may feel hotter than the actual temperature.");
    notificationType = "info";
  }

  // Fog/Mist alerts
  if (condition.includes("fog") || condition.includes("mist")) {
    alerts.push("🌫️ Poor visibility expected. Be careful while traveling.");
    notificationType = "caution";
  }

  return {
    hasAlert: alerts.length > 0,
    notifications: alerts,
    type: notificationType,
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
