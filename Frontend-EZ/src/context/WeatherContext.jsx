import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const WeatherContext = createContext();

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};

export const WeatherProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchWeather = useCallback(async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}`
      );

      setWeatherData((prev) => ({
        ...prev,
        [eventId]: response.data,
      }));

      if (response.data.notification) {
        setNotifications((prev) => ({
          ...prev,
          [eventId]: response.data.notification,
        }));
      }

      return response.data;
    } catch (err) {
      setError(err.message || "Failed to fetch weather");
      console.error("Weather fetch error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchMultipleWeather = useCallback(async (eventIds) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/weather/multiple/events`,
        { eventIds }
      );

      const newWeatherData = {};
      const newNotifications = {};

      response.data.data.forEach((item) => {
        newWeatherData[item.eventId] = item.weather;
        newNotifications[item.eventId] = item.notification;
      });

      setWeatherData((prev) => ({
        ...prev,
        ...newWeatherData,
      }));

      setNotifications((prev) => ({
        ...prev,
        ...newNotifications,
      }));

      return response.data.data;
    } catch (err) {
      setError(err.message || "Failed to fetch weather for multiple events");
      console.error("Multiple weather fetch error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const getWeatherAlerts = useCallback(async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}/alerts`
      );
      return response.data;
    } catch (err) {
      console.error("Error fetching alerts:", err);
      throw err;
    }
  }, [API_URL]);

  const getWeatherImpact = useCallback(async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}/impact`
      );
      return response.data.impactAssessment;
    } catch (err) {
      console.error("Error fetching impact assessment:", err);
      throw err;
    }
  }, [API_URL]);

  const clearWeatherData = useCallback((eventId) => {
    setWeatherData((prev) => {
      const newData = { ...prev };
      delete newData[eventId];
      return newData;
    });

    setNotifications((prev) => {
      const newNotifications = { ...prev };
      delete newNotifications[eventId];
      return newNotifications;
    });
  }, []);

  const clearAllWeatherData = useCallback(() => {
    setWeatherData({});
    setNotifications({});
  }, []);

  const value = {
    weatherData,
    loading,
    error,
    notifications,
    fetchWeather,
    fetchMultipleWeather,
    getWeatherAlerts,
    getWeatherImpact,
    clearWeatherData,
    clearAllWeatherData,
  };

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
};
