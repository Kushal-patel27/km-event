import React, { useState } from 'react'
import { useDarkMode } from '../context/DarkModeContext'
import { motion } from 'framer-motion'

export default function Ticket({ booking }) {
  const { isDarkMode } = useDarkMode()
  const { event, user, id, _id, seats, quantity, date, qrCodes, qrCode, ticketIds, scans } = booking
  const [flipped, setFlipped] = useState({})

  // Determine individual tickets based on seats array or quantity
  let ticketItems = []
  const baseId = _id || id || Date.now().toString()

  if (Array.isArray(seats) && seats.length > 0) {
    ticketItems = seats.map((seat, idx) => {
      const ticketId = ticketIds && ticketIds[idx] ? ticketIds[idx] : null
      const isScanned = scans && scans.some(s => s.ticketId === ticketId)
      return {
        seatLabel: seat.toString(),
        qrId: `${baseId}-${seat}`,
        ticketId,
        qrImage: qrCodes && qrCodes[idx] ? qrCodes[idx].image : null,
        isScanned,
        ticketIndex: idx + 1
      }
    })
  } else {
    const count = quantity || (typeof seats === 'number' ? seats : 1)
    for (let i = 0; i < count; i++) {
      const ticketId = ticketIds && ticketIds[i] ? ticketIds[i] : null
      const isScanned = scans && scans.some(s => s.ticketId === ticketId)
      ticketItems.push({
        seatLabel: count > 1 ? `#${i + 1}` : 'General',
        qrId: `${baseId}-${i + 1}`,
        ticketId,
        qrImage: qrCodes && qrCodes[i] ? qrCodes[i].image : null,
        isScanned,
        ticketIndex: i + 1
      })
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4">
      {ticketItems.map((item, idx) => {
        const qrUrl = item.qrImage || (() => {
          const qrData = JSON.stringify({ 
            ticketId: item.ticketId,
            bid: item.qrId, 
            uid: user?.id,
            evt: event?.id 
          })
          return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`
        })()

        const isFlipped = flipped[item.qrId]

        return (
          <motion.div
            key={item.qrId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="relative h-[600px] cursor-pointer"
            onClick={() => setFlipped(prev => ({ ...prev, [item.qrId]: !prev[item.qrId] }))}
          >
            {/* Animated Glow Background */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-all duration-500 blur-xl -z-10 ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-600 via-pink-600 to-orange-500'
                : 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400'
            }`}></div>

            {/* 3D Flip Container */}
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ perspective: "1000px" }}
              className="relative w-full h-full"
            >
              {/* ===== FRONT SIDE - Event Details ===== */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isFlipped ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-black via-gray-900 to-black'
                    : 'bg-gradient-to-br from-white via-gray-50 to-white'
                }`}>
                  {/* Pattern Overlay */}
                  <div className={`absolute inset-0 ${isDarkMode ? 'opacity-20' : 'opacity-10'}`}>
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="100" y2="100" stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="1" />
                          <line x1="100" y1="0" x2="0" y2="100" stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#pattern)" />
                    </svg>
                  </div>

                  {/* Background Orbs */}
                  {isDarkMode ? (
                    <>
                      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-600 rounded-full blur-3xl opacity-10"></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute top-0 right-0 w-72 h-72 bg-slate-400 rounded-full blur-3xl opacity-25 animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-300 rounded-full blur-3xl opacity-20"></div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 h-full p-12 flex flex-col justify-between">
                    {/* Header */}
                    <div className="space-y-5">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`flex items-center justify-center gap-4 mb-1 ${isDarkMode ? 'text-cyan-300' : 'text-slate-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-teal-500'}`}></div>
                        <span className="text-base font-black uppercase tracking-[0.3em]">EVENT TICKET</span>
                        <div className={`w-4 h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-teal-500'}`}></div>
                      </motion.div>

                      <h2 className={`text-3xl md:text-4xl font-black leading-tight line-clamp-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h2>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-5 py-2 text-xs font-black uppercase rounded-full tracking-[0.15em] shadow-xl ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        }`}>
                          {event.category || 'General'}
                        </span>
                        {item.isScanned && (
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-5 py-2 bg-green-600 text-white text-xs font-black uppercase rounded-full flex items-center gap-2 tracking-[0.15em]"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            USED
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      {/* Row 1: Date & Time */}
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`rounded-2xl p-5 hover:scale-105 transition-all border-2 backdrop-blur-sm ${
                          isDarkMode
                            ? 'bg-white/10 border-white/25 hover:border-white/50 hover:bg-white/15'
                            : 'bg-white/70 border-indigo-200/60 hover:border-indigo-400 hover:bg-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <svg className={`w-7 h-7 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className={`text-xs font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date & Time</div>
                            <div className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Row 2: Location & Seat */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Location */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          className={`rounded-2xl p-5 border-2 backdrop-blur-sm ${
                            isDarkMode
                              ? 'bg-white/10 border-white/25 hover:border-white/50 hover:bg-white/15'
                              : 'bg-white/70 border-indigo-200/60 hover:border-indigo-400 hover:bg-white/90'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            <svg className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <div className={`text-xs font-black uppercase tracking-[0.12em] mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Venue</div>
                              <div className={`text-sm font-bold line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{event.location || 'TBA'}</div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Seat/Ticket */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          className={`rounded-2xl p-5 border-2 backdrop-blur-sm ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-blue-700/40 to-cyan-700/30 border-blue-500/60 hover:border-blue-500/80 hover:from-blue-700/50'
                              : 'bg-gradient-to-br from-slate-100/70 to-teal-100/60 border-slate-300/60 hover:border-slate-500 hover:from-slate-100/90'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            <svg className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-cyan-200' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1zm6 0a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z" />
                            </svg>
                            <div>
                              <div className={`text-xs font-black uppercase tracking-[0.12em] mb-1 ${isDarkMode ? 'text-cyan-200' : 'text-slate-700'}`}>Seat Number</div>
                              <div className={`text-xl font-black ${isDarkMode ? 'text-cyan-100' : 'text-slate-800'}`}>{item.seatLabel}</div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Row 3: Ticket Holder */}
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`rounded-2xl p-5 border-2 backdrop-blur-sm ${
                          isDarkMode
                            ? 'bg-white/10 border-white/25 hover:border-white/50 hover:bg-white/15'
                            : 'bg-white/70 border-indigo-200/60 hover:border-indigo-400 hover:bg-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <svg className={`w-7 h-7 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className={`text-xs font-black uppercase tracking-[0.12em] mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Guest Name</div>
                            <div className={`text-lg font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name || 'Guest'}</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Footer */}
                    <div className={`flex items-center justify-between pt-4 mt-3 border-t-2 ${isDarkMode ? 'border-white/20' : 'border-slate-200/50'}`}>
                      <div className={`flex items-center gap-2 text-sm font-black ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="uppercase tracking-wider">Valid Admission</span>
                      </div>
                      <span className={`font-mono text-base font-black tracking-wider ${isDarkMode ? 'text-cyan-300' : 'text-slate-700'}`}>#{item.qrId.slice(0, 12).toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Flip for QR Code Indicator */}
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute bottom-4 left-4 flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4" />
                    </svg>
                    Flip for QR code
                  </motion.div>
                </div>
              </motion.div>

              {/* ===== BACK SIDE - QR Code ===== */}
              <motion.div
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: isFlipped ? 1 : 0, rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-black via-gray-900 to-black'
                    : 'bg-gradient-to-br from-white via-gray-50 to-white'
                }`}>
                  {/* Animated Orbs */}
                  {isDarkMode ? (
                    <>
                      <div className="absolute top-0 left-0 w-64 h-64 bg-gray-700 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-700 rounded-full blur-3xl opacity-15"></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute top-0 left-0 w-64 h-64 bg-gray-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gray-300 rounded-full blur-3xl opacity-25"></div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 h-full p-7 flex flex-col items-center justify-between" style={{ transform: 'scaleX(-1)' }}>
                    {/* Top - Scan Instructions */}
                    <div className="w-full text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className={`inline-block px-3 py-1 rounded-full mb-3 border ${
                          isDarkMode
                            ? 'bg-gray-500/30 border-gray-400/60'
                            : 'bg-gray-100/80 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
                          <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Scan QR Code</span>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
                        </div>
                      </motion.div>
                      <p className={`text-xs tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Present at entrance for verification</p>
                    </div>

                    {/* Middle - QR Code */}
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="relative"
                    >
                      <div className={`absolute -inset-5 rounded-3xl blur-lg opacity-50 ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-blue-400 via-blue-300 to-indigo-400'
                      }`}></div>
                      <div className={`relative p-5 rounded-3xl shadow-2xl border-2 ${
                        isDarkMode
                          ? 'bg-white border-blue-400/60'
                          : 'bg-white border-blue-300/80'
                      }`}>
                        <img 
                          src={qrUrl} 
                          alt="QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                        {/* QR Corner Decorations */}
                        <div className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                        <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                        <div className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                        <div className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                      </div>
                    </motion.div>

                    {/* Bottom - Ticket Information */}
                    <div className="w-full space-y-3 text-center">
                      {/* Ticket ID */}
                      <div className="space-y-1">
                        <p className={`text-xs uppercase tracking-wider font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ticket ID</p>
                        <motion.code
                          whileHover={{ scale: 1.05 }}
                          className={`inline-block font-mono font-bold tracking-widest text-base px-4 py-2.5 rounded-xl transition-all border ${
                            isDarkMode
                              ? 'text-blue-300 bg-black/50 border-blue-500/50 hover:border-blue-500'
                              : 'text-blue-700 bg-blue-50/60 border-blue-300/50 hover:border-blue-400'
                          }`}
                        >
                          {item.qrId.toUpperCase().slice(0, 18)}
                        </motion.code>
                      </div>

                      {/* Guest Name */}
                      <div className={`rounded-xl py-2.5 px-3 border backdrop-blur-sm ${
                        isDarkMode
                          ? 'bg-white/8 border-white/20'
                          : 'bg-white/70 border-blue-200/50'
                      }`}>
                        <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Authorized To</p>
                        <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name || 'Guest'}</p>
                      </div>

                      {/* Validity Info */}
                      <div className={`text-xs space-y-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>✓ Single entry authorization</p>
                        <p>✓ Non-transferable document</p>
                      </div>
                    </div>

                    {/* Return to Details */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className={`absolute top-4 left-4 flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4" />
                      </svg>
                      Return to details
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Ticket Number Badge */}
            <div className={`absolute -top-4 -right-4 z-20 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-xl border-4 ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-600 to-orange-600 border-white/20'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white/30'
            }`}>
              {item.ticketIndex}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
