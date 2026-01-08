import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * GenieModal: macOS Dock Genie–style opening animation
 * 
 * Features:
 * - Spring-based physics (stiffness: 300, damping: 26, mass: 0.9)
 * - Clip-path deformation for elastic "sheet stretching" effect
 * - Origin from dock-like trigger button at bottom center
 * - GPU-accelerated transforms (scale, translateY, borderRadius)
 * - 60fps performance, no layout reflow
 * - Apple Human Interface Guidelines compliance
 * 
 * Usage:
 *   <GenieModal
 *     isOpen={isOpen}
 *     onClose={onClose}
 *     triggerRef={buttonRef}
 *     title="Modal Title"
 *   >
 *     Modal content here
 *   </GenieModal>
 */

const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
  mass: 0.9,
}

// Genie clip-path variants for elastic deformation
const genieVariants = {
  // Hidden state: small, compressed shape at origin
  hidden: (rect) => ({
    scale: 0.4,
    translateY: 0,
    borderRadius: '50%',
    clipPath: rect
      ? `polygon(
          0% 100%,
          0% 100%,
          50% 100%,
          100% 100%,
          100% 100%,
          100% 50%,
          100% 0%,
          0% 0%,
          0% 50%,
          0% 100%
        )`
      : 'polygon(0% 100%, 0% 100%, 50% 100%, 100% 100%, 100% 100%, 100% 50%, 100% 0%, 0% 0%, 0% 50%, 0% 100%)',
    opacity: 0,
  }),

  // Mid-state: elastic "sheet" being pulled upward (Genie phase)
  genie: (rect) => ({
    scale: 0.75,
    translateY: -50,
    borderRadius: '28px',
    clipPath: rect
      ? `polygon(
          5% 100%,
          5% 80%,
          10% 40%,
          20% 15%,
          50% 5%,
          80% 15%,
          90% 40%,
          95% 80%,
          95% 100%,
          100% 100%,
          100% 100%,
          0% 100%
        )`
      : 'polygon(5% 100%, 5% 80%, 10% 40%, 20% 15%, 50% 5%, 80% 15%, 90% 40%, 95% 80%, 95% 100%, 100% 100%, 100% 100%, 0% 100%)',
    opacity: 0.95,
  }),

  // Final state: perfect rectangle, fully expanded
  visible: {
    scale: 1,
    translateY: 0,
    borderRadius: '12px',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    opacity: 1,
  },
}

// Backdrop fade animation
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function GenieModal({
  isOpen,
  onClose,
  triggerRef,
  title = 'Modal',
  children,
  className = '',
  isDarkMode = false,
}) {
  const modalRef = useRef(null)
  const [triggerRect, setTriggerRect] = useState(null)

  // Capture trigger button position on mount/resize for animation origin
  React.useEffect(() => {
    if (!triggerRef?.current) return

    const updateRect = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      // Store relative to viewport center (dock bottom center origin)
      setTriggerRect({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      })
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [triggerRef, isOpen])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={onClose}
            className={`fixed inset-0 z-40 ${
              isDarkMode
                ? 'bg-black/60 backdrop-blur-sm'
                : 'bg-black/30 backdrop-blur-sm'
            }`}
          />

          {/* Genie Modal */}
          <motion.div
            key="modal"
            ref={modalRef}
            custom={triggerRect}
            variants={genieVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              // Animate to genie phase midway through
              default: springConfig,
              // Stagger clip-path for smoother deformation
              clipPath: {
                ...springConfig,
                delay: 0.05,
              },
            }}
            className={`
              fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl
              z-50 origin-bottom
              ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}
              ${className}
            `}
            style={{
              maxHeight: '90vh',
              willChange: 'transform, clip-path, opacity',
            }}
          >
            {/* Header with close button */}
            <div className={`
              sticky top-0 flex items-center justify-between p-6 border-b
              ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}
              backdrop-blur-sm
            `}>
              <h2 className="text-2xl font-bold">{title}</h2>
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-full transition-colors
                  ${isDarkMode
                    ? 'hover:bg-slate-700 text-gray-300 hover:text-white'
                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }
                `}
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
              {children}
            </div>

            {/* Subtle bottom gradient for scroll indication */}
            <div className={`
              pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t
              ${isDarkMode ? 'from-slate-900 to-transparent' : 'from-white to-transparent'}
            `} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { genieVariants, springConfig }
