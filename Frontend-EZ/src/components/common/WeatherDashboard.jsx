import React, { useState, useEffect } from "react";
import weatherAPI from "../../services/weatherAPI";
import "./WeatherDashboard.css";

const WeatherDashboard = ({ events = [] }) => {
  const [weatherResults, setWeatherResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState("list"); // list or comparison
  const [filter, setFilter] = useState("all"); // all, warning, caution, info

  useEffect(() => {
    if (events.length > 0) {
      fetchAllWeather();
    }
  }, [events]);

  const fetchAllWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const eventIds = events.map((e) => e._id);
      const response = await weatherAPI.getMultipleEventsWeather(eventIds);

      setWeatherResults(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch weather data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    if (filter === "all") {
      return weatherResults;
    }

    return weatherResults.filter((result) => {
      return result.notification?.type === filter;
    });
  };

  const getRiskColor = (type) => {
    switch (type) {
      case "warning":
        return "#ff6b6b";
      case "caution":
        return "#ffa500";
      case "info":
      default:
        return "#4ecdc4";
    }
  };

  const getRiskIcon = (type) => {
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

  if (loading && weatherResults.length === 0) {
    return (
      <div className="weather-dashboard loading">
        <div className="loading-spinner">Loading weather data...</div>
      </div>
    );
  }

  const filteredResults = getFilteredResults();

  return (
    <div className="weather-dashboard">
      <div className="dashboard-header">
        <h2>Weather Dashboard</h2>
        <button
          onClick={fetchAllWeather}
          className="refresh-btn"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchAllWeather} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* View Selection */}
      <div className="view-selector">
        <button
          className={`view-btn ${selectedView === "list" ? "active" : ""}`}
          onClick={() => setSelectedView("list")}
        >
          📋 List View
        </button>
        <button
          className={`view-btn ${selectedView === "comparison" ? "active" : ""}`}
          onClick={() => setSelectedView("comparison")}
        >
          📊 Comparison View
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({weatherResults.length})
        </button>
        <button
          className={`filter-btn warning ${
            filter === "warning" ? "active" : ""
          }`}
          onClick={() => setFilter("warning")}
        >
          ⚠️ Warning (
          {
            weatherResults.filter((r) => r.notification?.type === "warning")
              .length
          }
          )
        </button>
        <button
          className={`filter-btn caution ${
            filter === "caution" ? "active" : ""
          }`}
          onClick={() => setFilter("caution")}
        >
          ⚡ Caution (
          {
            weatherResults.filter((r) => r.notification?.type === "caution")
              .length
          }
          )
        </button>
      </div>

      {/* Results */}
      {selectedView === "list" ? (
        <div className="weather-list">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <div
                key={result.eventId}
                className="weather-card"
                style={{
                  borderLeftColor: getRiskColor(result.notification?.type),
                }}
              >
                <div className="card-header">
                  <div className="card-title">
                    <span className="risk-icon">
                      {getRiskIcon(result.notification?.type)}
                    </span>
                    <h3>{result.venue}</h3>
                  </div>
                  <div className="card-meta">{result.city}</div>
                </div>

                <div className="card-body">
                  <div className="weather-info">
                    <div className="info-item">
                      <span className="label">Temperature</span>
                      <span className="value">
                        {result.weather?.temperature}°C
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Condition</span>
                      <span className="value">
                        {result.weather?.weatherCondition}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Humidity</span>
                      <span className="value">
                        {result.weather?.humidity}%
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Wind Speed</span>
                      <span className="value">
                        {result.weather?.windSpeed} km/h
                      </span>
                    </div>
                  </div>

                  {result.notification?.notifications && (
                    <div className="notifications">
                      <div className="notification-title">
                        {result.notification.type === "warning"
                          ? "⚠️ Weather Warnings"
                          : result.notification.type === "caution"
                          ? "⚡ Weather Cautions"
                          : "ℹ️ Weather Info"}
                      </div>
                      <ul className="notification-items">
                        {result.notification.notifications.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No weather data available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="weather-comparison">
          <div className="comparison-table">
            <div className="table-header">
              <div className="col venue">Venue</div>
              <div className="col temp">Temp</div>
              <div className="col condition">Condition</div>
              <div className="col humidity">Humidity</div>
              <div className="col wind">Wind</div>
              <div className="col risk">Risk</div>
            </div>
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div
                  key={result.eventId}
                  className="table-row"
                  style={{
                    borderLeftColor: getRiskColor(result.notification?.type),
                  }}
                >
                  <div className="col venue">
                    <strong>{result.venue}</strong>
                    <small>{result.city}</small>
                  </div>
                  <div className="col temp">
                    {result.weather?.temperature}°C
                  </div>
                  <div className="col condition">
                    {result.weather?.weatherCondition}
                  </div>
                  <div className="col humidity">
                    {result.weather?.humidity}%
                  </div>
                  <div className="col wind">
                    {result.weather?.windSpeed} km/h
                  </div>
                  <div className="col risk">
                    <span
                      className="risk-badge"
                      style={{
                        backgroundColor: getRiskColor(
                          result.notification?.type
                        ),
                      }}
                    >
                      {getRiskIcon(result.notification?.type)}{" "}
                      {result.notification?.type?.toUpperCase() || "INFO"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No weather data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;
