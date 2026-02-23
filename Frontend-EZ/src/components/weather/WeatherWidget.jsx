import React, { useState, useEffect } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'

/**
 * Compact weather widget for dashboards and event listings
 */
export default function WeatherWidget({ eventId, showForecast = false }) {
  const { isDarkMode } = useDarkMode()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:5000/api/weather/${eventId}?units=metric`)
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch (err) {
        console.error('Weather fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchWeather()
    }
  }, [eventId])

  if (loading || !weather) return null

  const { currentWeather, notification } = weather
  const hasRisk = notification?.riskData?.hasRisk

  const getWeatherIcon = (condition) => {
    const lower = condition.toLowerCase()
    if (lower.includes('rain')) return '🌧️'
    if (lower.includes('thunderstorm')) return '⛈️'
    if (lower.includes('snow')) return '❄️'
    if (lower.includes('cloud')) return '☁️'
    if (lower.includes('clear') || lower.includes('sunny')) return '☀️'
    if (lower.includes('wind')) return '💨'
    if (lower.includes('fog')) return '🌫️'
    return '🌤️'
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDarkMode
          ? hasRisk
            ? 'border-orange-600 bg-orange-900/20'
            : 'border-gray-700 bg-gray-800'
          : hasRisk
          ? 'border-orange-300 bg-orange-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Weather
        </h4>
        {hasRisk && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              notification.type === 'warning'
                ? 'bg-red-500 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            ⚠️ Alert
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getWeatherIcon(currentWeather.weatherCondition)}</span>
          <div>
            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentWeather.temperature}°C
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentWeather.weatherDescription}
            </p>
          </div>
        </div>
        <div className={`text-right text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>💧 {currentWeather.humidity}%</p>
          <p>💨 {currentWeather.windSpeed} km/h</p>
        </div>
      </div>

      {hasRisk && (
        <div
          className={`mt-3 pt-3 border-t text-xs ${
            isDarkMode
              ? 'border-orange-600/50 text-orange-200'
              : 'border-orange-200 text-orange-800'
          }`}
        >
          <p className="font-semibold">⚠️ {notification.riskData.riskSummary}</p>
        </div>
      )}

      {showForecast && weather.forecast && (
        <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Next 3 Days
          </p>
          <div className="flex gap-2">
            {weather.forecast.slice(0, 3).map((day, idx) => (
              <div key={idx} className={`flex-1 rounded p-2 text-center text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-lg">{getWeatherIcon(day.condition)}</p>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {day.temperature}°
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
