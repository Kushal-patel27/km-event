import React, { useMemo, useState, useEffect } from 'react'

export default function Logo({ className = '', dark = false, size = '5xl' }) {
  const lightSrc = '/assets/km-logo.png'
  const darkSrc = '/assets/km-logo.png'

  const correctSrc = dark ? darkSrc : lightSrc
  const [src, setSrc] = useState(correctSrc)
  const [loadError, setLoadError] = useState(false)

  // Update src when dark prop changes
  useEffect(() => {
    setSrc(correctSrc)
    setLoadError(false)
  }, [correctSrc, dark])

  // Pick size classes
  const imgClass = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 md:h-9 md:w-9'
      case 'lg':
        return 'h-14 w-14 md:h-16 md:w-16'
      case 'xl':
        return 'h-16 w-16 md:h-20 md:w-20'
      case '2xl':
        return 'h-20 w-20 md:h-24 md:w-24'
      case '3xl':
        return 'h-24 w-24 md:h-28 md:w-28'
      case '4xl':
        return 'h-28 w-28 md:h-32 md:w-32'
      case '5xl':
        return 'h-32 w-32 md:h-40 md:w-40'
      default:
        return 'h-10 w-10 md:h-12 md:w-12'
    }
  }, [size])

  function handleError() {
    // Fallback to the other variant if one is missing
    if (!loadError) {
      const fallback = src === lightSrc ? darkSrc : lightSrc
      setSrc(fallback)
      setLoadError(true)
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="K&M Events">
      <img
        key={`${correctSrc}-img`}
        src={src}
        alt="K&M Events"
        className={`${imgClass} object-contain block`}
        draggable="false"
        loading="eager"
        decoding="async"
        onError={handleError}
      />
      <span className="sr-only">K&M Events</span>
    </div>
  )
}