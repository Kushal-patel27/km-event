import React from 'react'

export default function SeatPicker({ layout = [], booked = [], selected = [], onToggle, maxSelectable = 1, isDarkMode = false }){
  const bookedSet = new Set(booked.map(Number))
  const selectedSet = new Set(selected.map(Number))

  function handleToggle(seat){
    if(bookedSet.has(seat)) return
    if(selectedSet.has(seat)) return onToggle(selected.filter(s => Number(s)!==seat))
    if(selected.length >= maxSelectable) return
    onToggle([...selected, seat])
  }

  return (
    <div className="space-y-2">
      {layout.map((row, ri) => (
        <div key={ri} className="flex gap-2 flex-wrap justify-center">
          {row.map(seat => {
            const taken = bookedSet.has(seat)
            const isSelected = selectedSet.has(seat)
            
            let btnStyle = {}
            let btnClass = `w-10 h-10 rounded-md text-sm flex items-center justify-center border-2 font-bold transition-all cursor-pointer hover:scale-110`
            
            if (taken) {
              btnClass += isDarkMode ? ' bg-gray-500 text-gray-700 border-gray-600 cursor-not-allowed opacity-50' : ' bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed'
            } else if (isSelected) {
              if (isDarkMode) {
                btnStyle = {
                  backgroundColor: '#ff3333',
                  color: 'white',
                  borderColor: '#ff1111',
                  boxShadow: '0 0 15px rgba(255, 51, 51, 0.8)'
                }
                btnClass += ' border-red-600'
              } else {
                btnClass += ' bg-red-600 text-white border-red-700'
              }
            } else {
              if (isDarkMode) {
                btnClass += ' bg-gray-600 text-white border-gray-500 hover:bg-red-600/50 hover:border-red-400'
              } else {
                btnClass += ' bg-white text-gray-900 border-gray-300 hover:bg-indigo-50 hover:border-red-400'
              }
            }
            
            return (
              <button 
                key={seat} 
                onClick={()=>handleToggle(seat)} 
                type="button" 
                style={btnStyle}
                className={btnClass}
              >
                {seat}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
