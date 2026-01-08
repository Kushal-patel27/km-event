import React from 'react'
import { motion } from 'framer-motion'

/**
 * GenieDockButton: Dock-like trigger button for Genie animation
 * 
 * Features:
 * - Positioned at bottom center (dock-style)
 * - Spring-based hover scale effect
 * - Smooth press-down animation
 * - Accessibility-first design
 * - Integrates with GenieModal trigger
 * 
 * Usage:
 *   const ref = useRef(null)
 *   <GenieDockButton ref={ref} onClick={() => setIsOpen(true)} icon="?" label="Help" />
 */

const GenieDockButton = React.forwardRef(
  ({ onClick, icon, label, isDarkMode = false }, ref) => {
    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        whileHover={{
          scale: 1.15,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10,
            mass: 0.8,
          },
        }}
        whileTap={{
          scale: 0.95,
          transition: { type: 'spring', stiffness: 600, damping: 20 },
        }}
        className={`
          fixed bottom-8 left-1/2 -translate-x-1/2 z-30
          w-16 h-16 rounded-full
          flex items-center justify-center
          font-bold text-xl
          transition-all duration-200
          shadow-lg hover:shadow-xl
          ${isDarkMode
            ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
            : 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white'
          }
          backdrop-blur-sm
          border border-white/20
        `}
        aria-label={label}
        title={label}
      >
        <span className="text-2xl">{icon}</span>
      </motion.button>
    )
  }
)

GenieDockButton.displayName = 'GenieDockButton'

export default GenieDockButton
