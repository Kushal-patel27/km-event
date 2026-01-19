import React from 'react'
import SeatPicker from './SeatPicker'
import { generateSeatLayout, getBookedSeatsForEvent } from '../utils/bookings'

export default function BookingSteps({ 
  currentStep, 
  event, 
  quantity, 
  selectedSeats, 
  onSelectSeats,
  onStepChange,
  bookedSeatsFromDB = [] // Accept booked seats from parent
}) {
  const steps = [
    { number: 1, title: 'Select Tickets', icon: '🎫' },
    { number: 2, title: 'Choose Seats', icon: '💺' },
    { number: 3, title: 'Confirm Booking', icon: '✓' }
  ]

  // Use backend booked seats instead of localStorage
  const bookedSeats = bookedSeatsFromDB
  const totalSeats = event?.capacity || 0
  const availableSeats = totalSeats - bookedSeats.length

  return (
    <div className="space-y-8">
      {/* Steps Progress */}
      <div className="flex gap-4 md:gap-6 justify-between items-center">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            {/* Step */}
            <div 
              onClick={() => onStepChange(step.number)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                currentStep === step.number 
                  ? 'bg-red-600 text-white shadow-lg scale-110' 
                  : currentStep > step.number 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600 group-hover:bg-gray-400'
              }`}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div className="text-sm font-medium text-gray-700 text-center mt-2">{step.title}</div>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-1 rounded transition-colors ${
                currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 1 && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Select Number of Tickets</h3>
            <p className="text-gray-600 text-sm mb-4">Choose how many tickets you want to book</p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                You selected <span className="font-bold text-lg">{quantity}</span> ticket(s)
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Choose Seats</h3>
            <p className="text-gray-600 text-sm mb-6">See live availability and lock your seats instantly.</p>
            
            <div className="space-y-8">
              {/* Seat Availability Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-300">
                  <div className="text-sm font-medium text-green-700 mb-1">Available</div>
                  <div className="text-3xl font-bold text-green-600">{availableSeats}</div>
                  <div className="text-xs text-green-600 mt-1">seats left</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-300">
                  <div className="text-sm font-medium text-gray-700 mb-1">Booked</div>
                  <div className="text-3xl font-bold text-gray-600">{bookedSeats.length}</div>
                  <div className="text-xs text-gray-600 mt-1">seats taken</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-300">
                  <div className="text-sm font-medium text-indigo-700 mb-1">Your Selection</div>
                  <div className="text-3xl font-bold text-indigo-600">{selectedSeats.length}/{quantity}</div>
                  <div className="text-xs text-indigo-600 mt-1">selected</div>
                </div>
              </div>

              {/* Seat Legend */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Seat Legend</h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-xs font-semibold">
                      <span className="text-gray-600">A1</span>
                    </div>
                    <span className="text-sm text-gray-700">Available - Click to select</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-xs font-semibold text-white">
                      ✓
                    </div>
                    <span className="text-sm text-gray-700">Selected by you</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center text-xs font-semibold text-gray-600 cursor-not-allowed">
                      ✗
                    </div>
                    <span className="text-sm text-gray-700">Already booked</span>
                  </div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="bg-gradient-to-b from-blue-900 to-blue-800 p-8 rounded-lg border-4 border-blue-950">
                <div className="mb-6">
                  <div className="text-center text-white font-bold text-lg mb-2">🎬 SCREEN 🎬</div>
                  <div className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 rounded-full"></div>
                </div>

                <div className="bg-white p-8 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-6 text-center">
                    Select {Number(quantity)} seat(s) • {selectedSeats.length} selected
                  </div>
                  
                  {/* Improved Seat Picker with better styling */}
                  <div className="space-y-4 flex flex-col items-center">
                    {generateSeatLayout(event.capacity, 10).map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-3 items-center">
                        <div className="w-8 text-center font-semibold text-gray-600 text-sm">
                          {String.fromCharCode(65 + rowIdx)}
                        </div>
                        <div className="flex gap-3">
                          {row.map((seat) => {
                            const isBooked = bookedSeats.includes(seat)
                            const isSelected = selectedSeats.includes(seat)

                            return (
                              <button
                                key={seat}
                                type="button"
                                disabled={isBooked}
                                onClick={() => {
                                  if (isBooked) return
                                  if (isSelected) {
                                    onSelectSeats(selectedSeats.filter(s => s !== seat))
                                  } else {
                                    if (selectedSeats.length < Number(quantity)) {
                                      onSelectSeats([...selectedSeats, seat])
                                    }
                                  }
                                }}
                                className={`w-8 h-8 rounded text-xs font-semibold flex items-center justify-center transition-all ${
                                  isBooked
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                                    : isSelected
                                    ? 'bg-red-600 text-white shadow-lg scale-110 hover:scale-110'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:shadow-md cursor-pointer'
                                }`}
                                title={isBooked ? `Seat booked` : `Row ${String.fromCharCode(65 + rowIdx)}, Seat ${seat}`}
                              >
                                {isBooked ? '✗' : isSelected ? '✓' : seat}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 rounded-full mb-2"></div>
                  <div className="text-center text-white font-semibold text-sm opacity-90">Ground Level</div>
                </div>
              </div>

              {/* Selected Seats Display */}
              {selectedSeats.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
                  <p className="text-sm font-semibold text-green-900 mb-3">
                    ✓ Your Selected Seats
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat, idx) => {
                      const layout = generateSeatLayout(event.capacity, 10)
                      let rowLetter = ''
                      layout.forEach((row, i) => {
                        if (row.includes(seat)) rowLetter = String.fromCharCode(65 + i)
                      })
                      return (
                        <div 
                          key={seat}
                          className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
                        >
                          {rowLetter}{seat}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedSeats.length < Number(quantity) && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                  <p className="text-sm font-medium text-yellow-900">
                    ⚠ Please select {Number(quantity) - selectedSeats.length} more seat(s) to proceed
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Your Booking</h3>
            <p className="text-gray-600 text-sm mb-4">Review and confirm your booking details</p>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{quantity} ticket(s)</span>
              </div>
              {selectedSeats.length > 0 && (
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-semibold text-green-700">
                    {selectedSeats.map((seat, idx) => {
                      const layout = generateSeatLayout(event.capacity, 10)
                      let rowLetter = ''
                      layout.forEach((row, i) => {
                        if (row.includes(seat)) rowLetter = String.fromCharCode(65 + i)
                      })
                      return idx > 0 ? `, ${rowLetter}${seat}` : `${rowLetter}${seat}`
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between pt-6 border-t">
        <button
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 1}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          ← Back
        </button>
        
        <button
          onClick={() => onStepChange(currentStep + 1)}
          disabled={currentStep === 3 || (currentStep === 2 && selectedSeats.length !== Number(quantity))}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
            currentStep === 3 || (currentStep === 2 && selectedSeats.length !== Number(quantity))
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
