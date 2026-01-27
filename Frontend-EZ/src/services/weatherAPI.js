import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const weatherAPI = {
  /**
   * Get current weather for an event
   */
  getCurrentWeather: async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching current weather:", error);
      throw error;
    }
  },

  /**
   * Get weather alerts/notifications
   */
  getWeatherAlerts: async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}/alerts`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      throw error;
    }
  },

  /**
   * Get weather history
   */
  getWeatherHistory: async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}/history`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching weather history:", error);
      throw error;
    }
  },

  /**
   * Get weather for multiple events
   */
  getMultipleEventsWeather: async (eventIds) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/weather/multiple/events`,
        { eventIds }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching weather for multiple events:", error);
      throw error;
    }
  },

  /**
   * Compare weather between locations
   */
  compareWeather: async (locations) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/weather/compare/locations`,
        { locations }
      );
      return response.data;
    } catch (error) {
      console.error("Error comparing weather:", error);
      throw error;
    }
  },

  /**
   * Get weather impact assessment
   */
  getWeatherImpactAssessment: async (eventId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/${eventId}/impact`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching impact assessment:", error);
      throw error;
    }
  },

  /**
   * Update weather settings
   */
  updateWeatherSettings: async (eventId, settings) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/weather/${eventId}/settings`,
        settings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating weather settings:", error);
      throw error;
    }
  },
};

export default weatherAPI;
