import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import { motion } from 'framer-motion'

const Ticket = forwardRef(function Ticket({ booking }, ref) {
  const { isDarkMode } = useDarkMode()
  const { event, user, id, _id, seats, quantity, date, qrCodes, qrCode, ticketIds, scans, qrCheckInEnabled = true } = booking
  const [flipped, setFlipped] = useState({})
  // MOBILE OPTIMIZED
  const [isMobile, setIsMobile] = useState(false)
  const frontRefs = useRef([])
  const backRefs = useRef([])

  // Expose ticket face nodes for PDF capture
  useImperativeHandle(ref, () => ({
    getTicketFaces: () => ({ fronts: frontRefs.current, backs: backRefs.current }),
    resetFlips: () => setFlipped({})
  }))

  useEffect(() => {
    // MOBILE OPTIMIZED
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateMatch = () => setIsMobile(mediaQuery.matches)
    updateMatch()
    mediaQuery.addEventListener('change', updateMatch)
    return () => mediaQuery.removeEventListener('change', updateMatch)
  }, [])

  // Determine individual tickets based on seats array or quantity
  let ticketItems = []
  const baseId = _id || id || Date.now().toString()

  // Reset refs each render so indexes stay aligned
  frontRefs.current = []
  backRefs.current = []

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
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-x-hidden">
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
            className="relative h-[480px] sm:h-[600px] cursor-pointer"
            onClick={() => setFlipped(prev => ({ ...prev, [item.qrId]: !prev[item.qrId] }))}
          >
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
                data-ticket-face="front"
                data-ticket-id={item.qrId}
                ref={el => { frontRefs.current[idx] = el }}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Content */}
                  {/* // MOBILE OPTIMIZED */}
                  <div className="relative h-full p-3 sm:p-6 lg:p-10 flex flex-col justify-between">
                    {/* Header */}
                    <div className="space-y-3 sm:space-y-5">
                      <motion.div 
                        animate={isMobile ? undefined : { scale: [1, 1.05, 1] }}
                        transition={isMobile ? undefined : { duration: 3, repeat: Infinity }}
                        className={`flex items-center justify-center gap-2 sm:gap-4 ${isDarkMode ? 'text-cyan-300' : 'text-slate-700'}`}
                      >
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-teal-500'}`}></div>
                        <span className="text-[10px] sm:text-sm md:text-base font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">EVENT TICKET</span>
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-teal-500'}`}></div>
                      </motion.div>

                      <h2 className={`text-xl sm:text-3xl md:text-4xl lg:text-4xl leading-tight font-black line-clamp-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h2>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {item.isScanned && (
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-green-500/20 border border-green-400 text-green-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            ✓ Verified
                          </span>
                        )}
                        <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                          isDarkMode 
                            ? 'bg-blue-500/20 border-blue-400 text-blue-300' 
                            : 'bg-teal-100 border-teal-400 text-teal-700'
                        }`}>
                          Ticket #{item.ticketIndex}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 sm:space-y-6">
                      {/* // MOBILE OPTIMIZED */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <div className="space-y-1 sm:space-y-2">
                          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest ${
                            isDarkMode ? 'text-cyan-400' : 'text-slate-500'
                          }`}>Date & Time</p>
                          <p className={`text-xs sm:text-sm font-semibold line-clamp-2 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className={`text-[10px] sm:text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {new Date(event.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest ${
                            isDarkMode ? 'text-cyan-400' : 'text-slate-500'
                          }`}>Venue</p>
                          <p className={`text-xs sm:text-sm font-semibold line-clamp-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>{event.location}</p>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest ${
                            isDarkMode ? 'text-cyan-400' : 'text-slate-500'
                          }`}>Seat Number</p>
                          <p className={`text-xs sm:text-base font-bold ${
                            isDarkMode ? 'text-blue-300' : 'text-teal-600'
                          }`}>{item.seatLabel}</p>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest ${
                            isDarkMode ? 'text-cyan-400' : 'text-slate-500'
                          }`}>Guest Name</p>
                          <p className={`text-xs sm:text-sm font-semibold line-clamp-2 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>{user?.name || 'Guest'}</p>
                        </div>
                      </div>

                      {/* Flip Indicator */}
                      <div className={`pt-2 sm:pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-[9px] sm:text-xs text-center font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 ${
                          isDarkMode ? 'text-cyan-400' : 'text-slate-500'
                        }`}>
                          <span>{qrCheckInEnabled ? 'Flip for QR code' : 'Flip for ticket details'}</span>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </p>
                      </div>
                    </div>

                    {/* Footer - Validity Notice */}
                    <div className={`mt-2 sm:mt-6 p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${
                      isDarkMode 
                        ? 'bg-blue-500/10 border-blue-400/30' 
                        : 'bg-teal-50 border-teal-200'
                    }`}>
                      <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide mb-0.5 sm:mb-1 ${
                        isDarkMode ? 'text-cyan-300' : 'text-teal-700'
                      }`}>Valid Admission</p>
                      <p className={`text-[10px] sm:text-xs leading-relaxed ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {qrCheckInEnabled 
                          ? 'This ticket authorizes entry to the specified event. Present QR code at entrance for verification.'
                          : 'This ticket authorizes entry to the specified event. Follow organizer instructions for check-in procedure.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ===== BACK SIDE - QR Code ===== */}
              <motion.div
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: isFlipped ? 1 : 0, rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
                data-ticket-face="back"
                data-ticket-id={item.qrId}
                ref={el => { backRefs.current[idx] = el }}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Content */}
                  {/* // MOBILE OPTIMIZED */}
                  <div className="relative h-full p-3 sm:p-6 lg:p-10 flex flex-col items-center justify-between" style={{ transform: 'scaleX(-1)' }}>
                    {/* Top - Scan Instructions */}
                    <div className="w-full text-center">
                      <motion.div
                        animate={isMobile ? undefined : { scale: [1, 1.1, 1] }}
                        transition={isMobile ? undefined : { duration: 2.5, repeat: Infinity }}
                        className={`inline-block px-2 py-1 sm:px-3 sm:py-1 rounded-full mb-2 sm:mb-3 border ${
                          isDarkMode
                            ? 'bg-gray-500/30 border-gray-400/60'
                            : 'bg-gray-100/80 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
                          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Scan QR Code</span>
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
                        </div>
                      </motion.div>
                      <p className={`text-[10px] sm:text-xs tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {qrCheckInEnabled ? 'Present at entrance for verification' : 'Check-in method as directed by organizer'}
                      </p>
                    </div>

                    {/* Middle - QR Code or Disabled Message */}
                    {qrCheckInEnabled ? (
                      <motion.div
                        animate={isMobile ? undefined : { scale: [1, 1.03, 1] }}
                        transition={isMobile ? undefined : { duration: 2.5, repeat: Infinity }}
                        className="relative"
                      >
                        <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg border-2 ${
                          isDarkMode
                            ? 'bg-white border-gray-400'
                            : 'bg-white border-gray-300'
                        }`}>
                          <img 
                            src={qrUrl} 
                            alt="QR Code" 
                            className="w-32 h-32 sm:w-48 sm:h-48 object-contain"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="relative w-full">
                        <div className={`p-8 rounded-2xl shadow-lg border-2 text-center ${
                          isDarkMode
                            ? 'bg-gray-800/50 border-gray-600'
                            : 'bg-gray-100 border-gray-300'
                        }`}>
                          <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>QR Check-In Not Available</p>
                          <p className={`text-xs leading-relaxed ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            QR code check-in is not enabled for this event.<br />
                            Please follow the organizer's instructions for entry.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bottom - Ticket Info */}
                    <div className="w-full space-y-2 sm:space-y-4">
                      <div className={`flex items-center justify-between text-[10px] sm:text-sm pb-2 sm:pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <span className={`font-bold uppercase tracking-wide ${
                          isDarkMode ? 'text-cyan-300' : 'text-slate-600'
                        }`}>Ticket ID</span>
                        <span className={`font-mono font-semibold text-[9px] sm:text-sm ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>{item.ticketId?.slice(-8) || item.qrId.slice(-8)}</span>
                      </div>

                      <div className={`text-center p-2 sm:p-4 rounded-lg sm:rounded-xl border ${
                        isDarkMode 
                          ? 'bg-blue-500/10 border-blue-400/30' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide mb-1 ${
                          isDarkMode ? 'text-cyan-300' : 'text-slate-700'
                        }`}>Authorized To</p>
                        <p className={`text-xs sm:text-sm font-semibold line-clamp-1 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>{user?.name || 'Guest'}</p>
                        <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Seat: {item.seatLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
})

export default Ticket
