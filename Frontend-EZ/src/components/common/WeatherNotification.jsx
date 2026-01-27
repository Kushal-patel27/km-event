import React, { useState, useEffect } from "react";
import "./WeatherNotification.css";

const WeatherNotification = ({ notification, type = "info" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [autoClose, setAutoClose] = useState(true);

  useEffect(() => {
    if (autoClose && type !== "warning") {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, type]);

  if (!isVisible) return null;

  const getNotificationStyle = () => {
    switch (type) {
      case "warning":
        return "notification-warning";
      case "caution":
        return "notification-caution";
      case "info":
      default:
        return "notification-info";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "caution":
        return "⚡";
      case "info":
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`weather-notification ${getNotificationStyle()}`}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon()}</span>
        <div className="notification-message">
          <div className="notification-title">
            {type === "warning"
              ? "Weather Warning"
              : type === "caution"
              ? "Weather Caution"
              : "Weather Info"}
          </div>
          {notification.notifications &&
          notification.notifications.length > 0 ? (
            <ul className="notification-list">
              {notification.notifications.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          ) : (
            <div className="notification-text">{notification.message}</div>
          )}
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="notification-close"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default WeatherNotification;
