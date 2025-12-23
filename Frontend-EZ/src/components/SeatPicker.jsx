import React from 'react'

export default function SeatPicker({ layout = [], booked = [], selected = [], onToggle, maxSelectable = 1 }){
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
        <div key={ri} className="flex gap-2">
          {row.map(seat => {
            const taken = bookedSet.has(seat)
            const isSelected = selectedSet.has(seat)
            return (
              <button key={seat} onClick={()=>handleToggle(seat)} type="button" className={`w-10 h-10 rounded-md text-sm flex items-center justify-center border ${taken ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : isSelected ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-indigo-50'}`}>
                {seat}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
