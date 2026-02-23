import React, { useState, useEffect } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'

export default function WeatherDisplay({ eventId, compact = false }) {
  const { isDarkMode } = useDarkMode()
  const [weather, setWeather] = useState(null)
  const [units, setUnits] = useState('metric')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:5000/api/weather/${eventId}?units=${units}`)
      if (!res.ok) throw new Error('Failed to fetch weather')
      const data = await res.json()
      setWeather(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchWeather()
      // Auto-refresh every 30 minutes
      const interval = setInterval(fetchWeather, 30 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [eventId, units])

  if (loading && !weather) {
    return (
      <div className={`p-6 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className={`h-8 w-48 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mb-4`} />
        <div className={`h-6 w-full rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border-l-4 border-orange-500 ${isDarkMode ? 'bg-orange-900/20 text-orange-200' : 'bg-orange-50 text-orange-800'}`}>
        <p className="font-semibold">⚠️ Weather unavailable</p>
        <p className="text-sm mt-1">Unable to fetch weather data. Please try again later.</p>
      </div>
    )
  }

  if (!weather) return null

  const { currentWeather, forecast, notification } = weather
  const isCelsius = units === 'metric'
  const windUnit = isCelsius ? 'km/h' : 'mph'

  // Determine weather icon based on condition
  const getWeatherIcon = (condition) => {
    const lower = condition.toLowerCase()
    if (lower.includes('rain')) return '🌧️'
    if (lower.includes('thunderstorm')) return '⛈️'
    if (lower.includes('snow')) return '❄️'
    if (lower.includes('cloud')) return '☁️'
    if (lower.includes('clear') || lower.includes('sunny')) return '☀️'
    if (lower.includes('wind')) return '💨'
    if (lower.includes('fog') || lower.includes('mist')) return '🌫️'
    return '🌤️'
  }

  // Get risk badge if there are risks
  const getRiskBadge = () => {
    if (!notification?.riskData?.hasRisk) return null
    const riskLevel = notification.type
    const bgColor = riskLevel === 'warning' ? 'red' : 'orange'
    const textColor = riskLevel === 'warning' ? 'red' : 'orange'
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${bgColor}-100 text-${bgColor}-700 text-sm font-semibold`}>
        <span className="text-lg">⚠️</span>
        <span>{notification.riskData.riskSummary}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
      {/* Header with Risk Badge */}
      {!compact && (
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Weather Information
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                °{isCelsius ? 'C' : 'F'} / {isCelsius ? 'km/h' : 'mph'}
              </button>
              <button
                onClick={fetchWeather}
                disabled={loading}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                }`}
              >
                {loading ? '⟳ ...' : '⟳ Refresh'}
              </button>
            </div>
          </div>
          {getRiskBadge() && <div className="mt-3">{getRiskBadge()}</div>}
        </div>
      )}

      {/* Current Weather */}
      <div className="p-6">
        {compact ? (
          // Compact view
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{getWeatherIcon(currentWeather.weatherCondition)}</span>
              <div>
                <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentWeather.temperature}°{isCelsius ? 'C' : 'F'}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentWeather.weatherDescription}
                </div>
              </div>
            </div>
            {getRiskBadge()}
          </div>
        ) : (
          // Full view
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Weather Card */}
            <div>
              <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current Conditions
              </h4>
              <div className="flex items-center gap-6 mb-6">
                <span className="text-6xl">{getWeatherIcon(currentWeather.weatherCondition)}</span>
                <div>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentWeather.temperature}°
                  </div>
                  <div className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Feels like {currentWeather.feelsLike}°
                  </div>
                  <div className={`text-sm mt-2 capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentWeather.weatherDescription}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Humidity</p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentWeather.humidity}%
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wind Speed</p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentWeather.windSpeed} {windUnit}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pressure</p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentWeather.pressure} hPa
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Visibility</p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {(currentWeather.visibility / 1000).toFixed(1)} km
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div>
              <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                5-Day Forecast
              </h4>
              <div className="space-y-3">
                {forecast && forecast.slice(0, 5).map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    } transition`}
                  >
                    <div className="flex-1">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {day.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-3xl">{getWeatherIcon(day.condition)}</span>
                      <div>
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {day.temperature}°
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {day.humidity}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alert Message */}
        {notification?.message && (
          <div
            className={`mt-6 p-4 rounded-lg border-l-4 ${
              notification.type === 'warning'
                ? isDarkMode
                  ? 'bg-red-900/20 border-red-500 text-red-200'
                  : 'bg-red-50 border-red-500 text-red-700'
                : notification.type === 'caution'
                ? isDarkMode
                  ? 'bg-orange-900/20 border-orange-500 text-orange-200'
                  : 'bg-orange-50 border-orange-500 text-orange-700'
                : isDarkMode
                ? 'bg-blue-900/20 border-blue-500 text-blue-200'
                : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}
          >
            <p className="font-semibold mb-2">
              {notification.type === 'warning' ? '⚠️' : notification.type === 'caution' ? '⚡' : 'ℹ️'} Weather Alert
            </p>
            <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
          </div>
        )}

        {/* Last Refresh */}
        {lastRefresh && (
          <p className={`text-xs mt-4 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
