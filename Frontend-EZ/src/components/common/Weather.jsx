import React, { useState, useEffect } from "react";
import axios from "axios";
import WeatherNotification from "./WeatherNotification";
import "./Weather.css";

const Weather = ({ eventId, latitude, longitude }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchWeatherData();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}`
      );

      setWeather(response.data.currentWeather);
      setForecast(response.data.forecast || []);
      setNotification(response.data.notification);
      setError(null);
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || "";

    const iconMap = {
      clear: "☀️",
      clouds: "☁️",
      rain: "🌧️",
      drizzle: "🌦️",
      thunderstorm: "⛈️",
      snow: "❄️",
      mist: "🌫️",
      smoke: "💨",
      haze: "🌫️",
      dust: "💨",
      fog: "🌫️",
      sand: "🏜️",
      ash: "🌋",
      squall: "🌪️",
      tornado: "🌪️",
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (conditionLower.includes(key)) {
        return icon;
      }
    }
    return "🌡️";
  };

  const getTemperatureClass = (temp) => {
    if (temp > 40) return "temp-extreme-hot";
    if (temp > 35) return "temp-very-hot";
    if (temp > 25) return "temp-warm";
    if (temp > 15) return "temp-mild";
    if (temp > 5) return "temp-cool";
    return "temp-cold";
  };

  if (loading && !weather) {
    return (
      <div className="weather-container loading">
        <div className="loading-spinner">Loading weather data...</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-container error">
        <div className="error-message">{error}</div>
        <button onClick={fetchWeatherData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="weather-container">
      {notification && notification.hasAlert && (
        <WeatherNotification
          notification={notification}
          type={notification.type}
        />
      )}

      {weather && (
        <>
          {/* Current Weather Section */}
          <div className="current-weather">
            <div className="weather-header">
              <h2>Current Weather</h2>
              <button
                onClick={fetchWeatherData}
                className="refresh-button"
                title="Refresh weather data"
              >
                🔄
              </button>
            </div>

            <div className="weather-main">
              <div className="weather-icon-temp">
                <span className="weather-icon">
                  {getWeatherIcon(weather.weatherCondition)}
                </span>
                <div className={`temperature ${getTemperatureClass(weather.temperature)}`}>
                  {weather.temperature}°C
                </div>
              </div>

              <div className="weather-details">
                <div className="detail-item">
                  <span className="detail-label">Feels Like</span>
                  <span className="detail-value">{weather.feelsLike}°C</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Condition</span>
                  <span className="detail-value">
                    {weather.weatherDescription}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Humidity</span>
                  <span className="detail-value">{weather.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wind Speed</span>
                  <span className="detail-value">{weather.windSpeed} km/h</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Visibility</span>
                  <span className="detail-value">
                    {(weather.visibility / 1000).toFixed(1)} km
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Rainfall</span>
                  <span className="detail-value">{weather.rainfall} mm</span>
                </div>
              </div>
            </div>

            <div className="weather-location">
              <span className="location-icon">📍</span>
              {weather.location}
            </div>
          </div>

          {/* Forecast Section */}
          {forecast && forecast.length > 0 && (
            <div className="weather-forecast">
              <h3>5-Day Forecast</h3>
              <div className="forecast-grid">
                {forecast.map((day, index) => (
                  <div key={index} className="forecast-card">
                    <div className="forecast-date">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="forecast-icon">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <div className="forecast-temp">
                      {day.temperature}°C
                    </div>
                    <div className="forecast-condition">
                      {day.description}
                    </div>
                    <div className="forecast-details">
                      <span title="Humidity">💧 {day.humidity}%</span>
                      <span title="Wind Speed">💨 {day.windSpeed} km/h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Last Updated */}
      <div className="weather-footer">
        <small>
          Last updated: {weather && new Date(weather.lastUpdated || Date.now()).toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
};

export default Weather;
