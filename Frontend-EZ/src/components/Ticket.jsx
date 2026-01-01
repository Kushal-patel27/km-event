import React from 'react'
import Logo from './Logo'

export default function Ticket({ booking }) {
  const { event, user, id, _id, seats, quantity, date, qrCodes, qrCode, ticketIds, scans } = booking
  
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
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
      {ticketItems.map((item) => {
        // Use backend-provided QR image with unique ticket ID
        const qrUrl = item.qrImage || (() => {
          const qrData = JSON.stringify({ 
            ticketId: item.ticketId,
            bid: item.qrId, 
            uid: user?.id,
            evt: event?.id 
          })
          return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`
        })()

        return (
          <div key={item.qrId} className="relative bg-white w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200 print:shadow-none print:border-gray-900 break-inside-avoid">
            
            {/* Background Watermark */}
            <div className="absolute -bottom-12 -left-12 opacity-[0.03] pointer-events-none transform rotate-12 z-0">
              <svg width="300" height="300" viewBox="0 0 40 40" fill="currentColor" className="text-indigo-900">
                <rect x="4" y="6" width="32" height="28" rx="6" />
                <path d="M24 14L25.5 18.5H30L26.5 21L27.5 25.5L24 23L20.5 25.5L21.5 21L18 18.5H22.5L24 14Z" fill="white" />
              </svg>
            </div>

            {/* Left Section: Event Details */}
            <div className="flex-1 p-8 relative z-10 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3 opacity-80">
                    <Logo />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 leading-none tracking-tight uppercase">{event.title}</h2>
                  <span className="inline-block mt-3 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                    {event.category || 'General Admission'}
                  </span>
                </div>
                {item.isScanned && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-green-600 uppercase">Used</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Date & Time</div>
                  <div className="font-bold text-lg text-gray-800">{date || 'TBA'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Location</div>
                  <div className="font-bold text-lg text-gray-800">{event.location}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Guest</div>
                  <div className="font-bold text-lg text-gray-800 truncate">{user.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Seat</div>
                  <div className="font-bold text-lg text-indigo-600">{item.seatLabel}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex justify-between items-end">
                 <div className="text-xs text-gray-400">Present this ticket at the entrance</div>
                 <div className="flex flex-col items-end gap-1">
                   {item.ticketId && (
                     <div className="font-mono text-xs font-bold text-indigo-600 tracking-widest uppercase">{item.ticketId}</div>
                   )}
                 </div>
              </div>
            </div>

            {/* Right Section: QR Code (Stub) */}
            <div className="relative md:w-80 bg-gray-900 text-white p-8 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Stub Decoration */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent"></div>
              
              {/* Perforated Line */}
              <div className="absolute left-0 top-0 bottom-0 w-0 border-l-2 border-dashed border-gray-700 h-full hidden md:block"></div>
              <div className="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-gray-700 w-full md:hidden"></div>
              
              {/* Cutouts */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full hidden md:block"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full md:hidden"></div>

              <div className="relative z-10">
                <div className="bg-white p-3 rounded-xl shadow-lg mb-4 inline-block">
                  <img src={qrUrl} alt="QR Code" className="w-32 h-32 object-contain mix-blend-multiply" />
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2">Scan Entry</p>
                {item.ticketId && (
                  <p className="text-sm font-mono font-bold tracking-widest text-indigo-300">{item.ticketId}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}