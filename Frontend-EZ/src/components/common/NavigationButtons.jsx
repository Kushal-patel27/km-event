import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function NavigationButtons({
  homeTo = '/',
  homeLabel = 'Home',
  className = '',
  showHome = true,
  showLabels = true,
  size = 'md',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [historyIndex, setHistoryIndex] = useState(null)
  const [historyLength, setHistoryLength] = useState(() => window.history.length ?? 0)

  useEffect(() => {
    const idx = window.history.state?.idx
    setHistoryIndex(typeof idx === 'number' ? idx : null)
    setHistoryLength(window.history.length ?? 0)
  }, [location.key])

  const canGoBack = historyLength > 1
  const canGoForward = true

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1.5 text-xs'
    : 'px-3 py-2 text-sm'

  const baseButton = `inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition ${sizeClasses}`
  const disabledButton = 'opacity-50 cursor-not-allowed hover:bg-white'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        disabled={!canGoBack}
        className={`${baseButton} ${!canGoBack ? disabledButton : ''}`}
        aria-label="Go back"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {showLabels && <span>Back</span>}
      </button>
      <button
        type="button"
        onClick={() => navigate(1)}
        disabled={false}
        className={`${baseButton} ${!canGoForward ? disabledButton : ''}`}
        aria-label="Go forward"
      >
        {showLabels && <span>Forward</span>}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {showHome && (
        <button
          type="button"
          onClick={() => navigate(homeTo)}
          className={baseButton}
          aria-label={`Go to ${homeLabel}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5a1 1 0 01-1-1v-4H10v4a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
          </svg>
          {showLabels && <span>{homeLabel}</span>}
        </button>
      )}
    </div>
  )
}