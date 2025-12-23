import React from 'react'

export default function Logo({ className = '', dark = false }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon */}
      <div className="relative">
        <div className={`absolute inset-0 bg-indigo-500 blur-lg opacity-20 rounded-full ${dark ? 'bg-white opacity-10' : ''}`}></div>
        <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-sm">
          <defs>
            <linearGradient id="logo_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="32" height="28" rx="8" fill="url(#logo_grad)" />
          <path d="M13 6V34" stroke="white" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M24 13L25.8 18.5H31.5L27 21.8L28.8 27.5L24 24.2L19.2 27.5L21 21.8L16.5 18.5H22.2L24 13Z" fill="white" />
        </svg>
      </div>
      
      {/* Text */}
      <div className="flex flex-col justify-center">
        <span className={`text-2xl font-black tracking-tight leading-none ${dark ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'}`}>K&M</span>
        <span className={`text-[0.65rem] font-bold tracking-[0.25em] uppercase leading-none mt-1 ${dark ? 'text-indigo-200' : 'text-indigo-500'}`}>Events</span>
      </div>
    </div>
  )
}