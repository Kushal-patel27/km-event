import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import formatINR from '../utils/currency'

export default function Slider({ slides = [], interval = 4000 }){
  const [index, setIndex] = useState(0)
  const timerRef = useRef()
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)

  useEffect(()=>{
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides])

  useEffect(()=>{
    function onKey(e){
      if(e.key === 'ArrowLeft') prev()
      if(e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [index, slides])

  function start(){
    stop()
    timerRef.current = setTimeout(()=>{
      setIndex(i => (i + 1) % slides.length)
    }, interval)
  }

  function stop(){
    if(timerRef.current) clearTimeout(timerRef.current)
  }

  function go(i){
    setIndex(i)
  }

  function prev(){
    setIndex((index-1+slides.length)%slides.length)
  }

  function next(){
    setIndex((index+1)%slides.length)
  }

  function handleTouchStart(e){
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    stop()
  }

  function handleTouchMove(e){
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  function handleTouchEnd(){
    const dx = touchDeltaX.current
    if(Math.abs(dx) > 50){
      if(dx > 0) prev()
      else next()
    }
    start()
  }

  if(!slides || slides.length === 0) return null

  return (
    <div onMouseEnter={stop} onMouseLeave={start} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative w-full mb-6">
      <div className="overflow-hidden rounded-lg shadow-lg bg-gray-100">
        <div className="relative h-72 md:h-96">
          {slides.map((s, i) => (
            <div key={s.id || i} aria-hidden={i!==index} className={`absolute inset-0 transition-all duration-700 ${i===index ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 translate-x-6 z-10'}`}>
              <img src={s.image} alt={s.title} className="w-full h-full object-cover" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              <div className="absolute left-6 bottom-6 max-w-md glass p-4">
                <h2 className="text-xl md:text-3xl font-bold text-white">{s.title}</h2>
                <p className="text-sm text-white/90 mt-1">{s.location} • {s.date}</p>
                {s.price !== undefined && (
                  <div className="mt-2 text-white font-semibold">From {formatINR(s.price)}</div>
                )}
                <div className="mt-3">
                  <Link to={`/event/${s.id}`} className="btn-primary">View event</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button aria-label="Previous slide" onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <button aria-label="Next slide" onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6L15 12L9 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} aria-label={`Go to slide ${i+1}`} onClick={()=>go(i)} className={`w-3 h-3 rounded-full ${i===index ? 'bg-white' : 'bg-white/50'}`}></button>
        ))}
      </div>
    </div>
  )
}
