import React, { useState, useEffect } from "react";
import axios from "axios";
import "./WeatherAlertsAdmin.css";

const WeatherAlertsAdmin = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, warning, caution, info
  const [expandedAlert, setExpandedAlert] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchWeatherAlerts();
  }, []);

  const fetchWeatherAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/weather/admin/all-alerts`
      );
      setAlerts(response.data.alerts || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch weather alerts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "caution":
        return "⚡";
      case "info":
        return "ℹ️";
      default:
        return "📍";
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "warning":
        return "#ff4444";
      case "caution":
        return "#ff9800";
      case "info":
        return "#2196f3";
      default:
        return "#666";
    }
  };

  const filteredAlerts =
    filter === "all"
      ? alerts
      : alerts.filter((alert) => alert.weatherAlert.type === filter);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="weather-alerts-container">
        <div className="loading">Loading weather alerts...</div>
      </div>
    );
  }

  return (
    <div className="weather-alerts-container">
      <div className="alerts-header">
        <h1>📊 Weather Alerts & Affected Bookings</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Alerts</span>
            <span className="stat-value">{alerts.length}</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-label">Warnings</span>
            <span className="stat-value">
              {alerts.filter((a) => a.weatherAlert.type === "warning").length}
            </span>
          </div>
          <div className="stat-card caution">
            <span className="stat-label">Cautions</span>
            <span className="stat-value">
              {alerts.filter((a) => a.weatherAlert.type === "caution").length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Affected Bookings</span>
            <span className="stat-value">
              {alerts.reduce((sum, a) => sum + a.totalBookings, 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({alerts.length})
        </button>
        <button
          className={`filter-btn warning ${filter === "warning" ? "active" : ""}`}
          onClick={() => setFilter("warning")}
        >
          ⚠️ Warnings (
          {alerts.filter((a) => a.weatherAlert.type === "warning").length})
        </button>
        <button
          className={`filter-btn caution ${filter === "caution" ? "active" : ""}`}
          onClick={() => setFilter("caution")}
        >
          ⚡ Cautions (
          {alerts.filter((a) => a.weatherAlert.type === "caution").length})
        </button>
        <button
          className={`filter-btn ${filter === "info" ? "active" : ""}`}
          onClick={() => setFilter("info")}
        >
          ℹ️ Info ({alerts.filter((a) => a.weatherAlert.type === "info").length})
        </button>
        <button className="refresh-btn" onClick={fetchWeatherAlerts}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredAlerts.length === 0 ? (
        <div className="no-alerts">
          <p>No weather alerts at this time ✅</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert, index) => (
            <div
              key={index}
              className="alert-card"
              style={{
                borderLeftColor: getAlertColor(alert.weatherAlert.type),
              }}
            >
              <div className="alert-header-row">
                <div className="alert-title">
                  <span className="alert-icon">
                    {getAlertIcon(alert.weatherAlert.type)}
                  </span>
                  <div>
                    <h3>{alert.eventName}</h3>
                    <p className="event-details">
                      📍 {alert.eventLocation} • 📅{" "}
                      {formatDate(alert.eventDate)}
                    </p>
                  </div>
                </div>
                <button
                  className="expand-btn"
                  onClick={() =>
                    setExpandedAlert(
                      expandedAlert === index ? null : index
                    )
                  }
                >
                  {expandedAlert === index ? "▼" : "▶"}
                </button>
              </div>

              <div className="weather-info">
                <div className="weather-condition">
                  <strong>{alert.weatherAlert.condition}</strong>
                  <span className="temp">
                    🌡️ {alert.weatherAlert.temperature}°C
                  </span>
                </div>
                <div className="weather-details">
                  <span title="Humidity">
                    💧 {alert.weatherAlert.humidity}%
                  </span>
                  <span title="Wind Speed">
                    💨 {alert.weatherAlert.windSpeed} km/h
                  </span>
                  {alert.weatherAlert.rainfall > 0 && (
                    <span title="Rainfall">
                      🌧️ {alert.weatherAlert.rainfall}mm
                    </span>
                  )}
                </div>
                <p className="alert-message">{alert.weatherAlert.message}</p>
                <p className="last-updated">
                  Last updated: {formatDate(alert.weatherAlert.lastUpdated)}
                </p>
              </div>

              {expandedAlert === index && (
                <div className="booking-details">
                  <div className="bookings-header">
                    <h4>
                      👥 Affected Bookings ({alert.totalBookings} total,{" "}
                      {alert.totalTickets} tickets)
                    </h4>
                  </div>

                  {alert.affectedBookings.length === 0 ? (
                    <p className="no-bookings">No bookings for this event</p>
                  ) : (
                    <div className="bookings-table">
                      <table>
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Tickets</th>
                            <th>Seats</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Booked On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alert.affectedBookings.map((booking, bidx) => (
                            <tr key={bidx}>
                              <td>
                                <strong>{booking.userName}</strong>
                              </td>
                              <td>{booking.userEmail}</td>
                              <td>{booking.userPhone}</td>
                              <td className="tickets-count">
                                {booking.ticketsBooked}
                              </td>
                              <td>
                                {booking.seats && booking.seats.length > 0
                                  ? booking.seats.join(", ")
                                  : "-"}
                              </td>
                              <td className="amount">
                                ₹{booking.totalAmount.toLocaleString()}
                              </td>
                              <td>
                                <span className={`status ${booking.status}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td>{formatDate(booking.bookingDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button className="btn-notify">
                      📧 Send Notification Emails
                    </button>
                    <button className="btn-export">📊 Export Bookings</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherAlertsAdmin;
