import React from 'react'
import { motion } from 'framer-motion'

export default function GenieEffect({ children }) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.3,
        y: -200,
        rotateX: 15,
        filter: "blur(10px)"
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)"
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.3,
        y: -200,
        rotateX: 15,
        filter: "blur(10px)"
      }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.4 },
        scale: { 
          type: "spring",
          stiffness: 200,
          damping: 22
        },
        y: { 
          type: "spring",
          stiffness: 180,
          damping: 20
        },
        rotateX: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.4 }
      }}
      style={{
        transformOrigin: "center top",
        perspective: "1200px",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity, filter"
      }}
    >
      {children}
    </motion.div>
  )
}
