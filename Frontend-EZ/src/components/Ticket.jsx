import React from 'react'
import Logo from './Logo'

export default function Ticket({ booking }) {
  const { event, user, id, _id, seats, quantity, date, qrCode } = booking
  
  // Determine individual tickets based on seats array or quantity
  let ticketItems = []
  const baseId = _id || id || Date.now().toString()

  if (Array.isArray(seats) && seats.length > 0) {
    ticketItems = seats.map(seat => ({
      seatLabel: seat.toString(),
      qrId: `${baseId}-${seat}`
    }))
  } else {
    const count = quantity || (typeof seats === 'number' ? seats : 1)
    for (let i = 0; i < count; i++) {
      ticketItems.push({
        seatLabel: count > 1 ? `#${i + 1}` : 'General',
        qrId: `${baseId}-${i + 1}`
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {ticketItems.map((item) => {
        // Prefer backend-provided QR image (data URL) if available,
        // otherwise fall back to generating one via external API.
        const qrUrl = qrCode || (() => {
          const qrData = JSON.stringify({ 
            bid: item.qrId, 
            uid: user?.id,
            evt: event?.id 
          })
          return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`
        })()

        return (
          <div key={item.qrId} className="relative w-full rounded-2xl overflow-hidden print:shadow-none break-inside-avoid group">
            
            {/* Outer Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur -z-10"></div>
            
            {/* Main Ticket Container */}
            <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-700 group-hover:border-red-600 transition-colors duration-300">
              
              {/* Premium Background Pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-900 rounded-full blur-3xl opacity-50"></div>
              </div>

              {/* Left Section: Event Details */}
              <div className="flex-1 p-6 md:p-10 relative z-10 flex flex-col justify-between bg-gradient-to-br from-[#1a1f2e] to-[#111827]">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Event Entry Pass</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight mb-3 line-clamp-2">{event.title}</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-30 text-red-400 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-opacity-30 transition-all">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                      {event.category || 'General Admission'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-white bg-opacity-5 border border-gray-600 border-opacity-30 rounded-lg p-4 md:p-5 hover:bg-opacity-10 transition-all">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Date & Time</div>
                    <div className="text-sm md:text-base font-bold text-white">{date || 'TBA'}</div>
                  </div>
                  <div className="bg-white bg-opacity-5 border border-gray-600 border-opacity-30 rounded-lg p-4 md:p-5 hover:bg-opacity-10 transition-all">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Location</div>
                    <div className="text-sm md:text-base font-bold text-white truncate">{event.location}</div>
                  </div>
                  <div className="bg-white bg-opacity-5 border border-gray-600 border-opacity-30 rounded-lg p-4 md:p-5 hover:bg-opacity-10 transition-all">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Guest Name</div>
                    <div className="text-sm md:text-base font-bold text-white truncate">{user.name}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-600 to-red-700 bg-opacity-20 border border-red-600 border-opacity-40 rounded-lg p-4 md:p-5 hover:bg-opacity-30 transition-all">
                    <div className="text-[10px] text-red-300 uppercase tracking-widest font-bold mb-2">Seat/Ticket</div>
                    <div className="text-sm md:text-base font-bold text-red-400">{item.seatLabel}</div>
                  </div>
                </div>

                <div className="pt-4 md:pt-6 border-t border-gray-600 border-opacity-30 flex justify-between items-center">
                   <div className="text-xs text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Present at entrance
                   </div>
                   <div className="font-mono text-xs text-gray-500 bg-black bg-opacity-30 px-3 py-1 rounded">#{item.qrId.toString().slice(0, 8).toUpperCase()}</div>
                </div>
              </div>

              {/* Right Section: QR Code (Premium Stub) */}
              <div className="relative w-full md:w-72 bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] text-white p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden border-t md:border-t-0 md:border-l border-gray-600 border-opacity-30">
                
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-600 via-transparent to-transparent opacity-20"></div>
                </div>
                
                {/* Dashed Perforation Line */}
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-600 border-opacity-50"></div>
                <div className="md:hidden absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-gray-600 border-opacity-50"></div>
                
                {/* Premium Decorative Cutouts */}
                <div className="absolute hidden md:block left-0 top-1/4 -translate-x-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>
                <div className="absolute hidden md:block left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>
                <div className="absolute hidden md:block left-0 bottom-1/4 -translate-x-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>
                
                <div className="absolute md:hidden top-0 left-1/4 -translate-y-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>
                <div className="absolute md:hidden top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>
                <div className="absolute md:hidden top-0 right-1/4 -translate-y-1/2 w-5 h-5 bg-[#0B0F19] rounded-full border border-gray-700"></div>

                <div className="relative z-10 flex flex-col items-center">
                  {/* QR Code with Premium Styling */}
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-red-600 to-red-900 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-white p-3 rounded-xl shadow-2xl">
                      <img src={qrUrl} alt="QR Code" className="w-36 h-36 object-contain mix-blend-multiply" />
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    Scan to Enter
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  </div>
                  <p className="text-lg md:text-xl font-mono font-bold tracking-widest text-red-500 bg-black bg-opacity-30 px-3 py-2 rounded-lg">{item.qrId.toString().toUpperCase().slice(0, 12)}</p>
                  <p className="text-xs text-gray-500 mt-3 tracking-wider">Valid for one entry</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}