import React, { useEffect, useRef, useState } from 'react'

export default function Slider({ slides = [], interval = 4000 }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line
  }, [index, slides])

  function start() {
    stop()
    if (slides.length <= 1) return
    timerRef.current = setTimeout(() => {
      setIndex(i => (i + 1) % slides.length)
    }, interval)
  }

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function prev() {
    setIndex(i => (i - 1 + slides.length) % slides.length)
  }

  function next() {
    setIndex(i => (i + 1) % slides.length)
  }

  function go(i) {
    setIndex(i)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    stop()
  }

  function handleTouchMove(e) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 50) {
      touchDeltaX.current > 0 ? prev() : next()
    }
    start()
  }

  if (!slides.length) return null

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={stop}
      onMouseLeave={start}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* SLIDES */}
      {slides.map((s, i) => (
        <div
          key={s.id || i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            draggable="false"
          />
        </div>
      ))}

      {/* LEFT ARROW */}
      <button
        aria-label="Previous banner"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
      >
        ‹
      </button>

      {/* RIGHT ARROW */}
      <button
        aria-label="Next banner"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
      >
        ›
      </button>

      {/* DOTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
