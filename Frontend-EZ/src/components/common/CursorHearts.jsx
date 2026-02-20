import React, { useEffect, useRef } from 'react'

export default function CursorHearts() {
  const containerRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const lastSpawnRef = useRef(0)
  const rafRef = useRef(null)

  const colors = ['#ef4444', '#ec4899', '#a855f7'] // red, pink, purple
  const maxParticles = 100
  const spawnInterval = 50 // ms between spawns

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isActive = true

    // Track mouse position
    const handleMouseMove = (e) => {
      const deltaY = e.clientY - mouseRef.current.y
      prevMouseRef.current = { ...mouseRef.current }
      mouseRef.current = { x: e.clientX, y: e.clientY }
      
      const now = Date.now()
      const isMovingDown = deltaY > 0
      
      // Faster spawn when moving down
      const currentInterval = isMovingDown ? 20 : spawnInterval
      
      if (now - lastSpawnRef.current > currentInterval) {
        lastSpawnRef.current = now
        
        // Spawn multiple hearts when moving down fast
        const spawnCount = isMovingDown && deltaY > 5 ? Math.min(3, Math.floor(deltaY / 5)) : 1
        
        for (let i = 0; i < spawnCount; i++) {
          const offsetX = (Math.random() - 0.5) * 20
          spawnHeart(e.clientX + offsetX, e.clientY - 10)
        }
      }
    }

    // Spawn a heart particle
    const spawnHeart = (x, y) => {
      if (particlesRef.current.length >= maxParticles) {
        // Remove oldest particle
        const oldest = particlesRef.current.shift()
        if (oldest.element.parentNode) {
          oldest.element.remove()
        }
      }

      const heart = document.createElement('div')
      const heartEmojis = ['❤️', '💜',  '🧡' ,'💛' ,'💚', '💙' ]
      heart.innerHTML = heartEmojis[Math.floor(Math.random() * heartEmojis.length)]
      heart.className = 'cursor-heart'
      
      const size = 16 + Math.random() * 8 // 16-24px
      const color = colors[Math.floor(Math.random() * colors.length)]
      const xDrift = (Math.random() - 0.5) * 15 // -7.5 to 7.5px drift (reduced)
      const speed = 0.4 + Math.random() * 0.3 // 0.4 to 0.7 (slower)
      const rotation = (Math.random() - 0.5) * 30 // -15 to 15 degrees
      
      heart.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: ${size}px;
        pointer-events: none;
        z-index: 9999;
        color: ${color};
        will-change: transform, opacity;
        user-select: none;
        transition: opacity 0.3s ease-out;
      `

      container.appendChild(heart)

      const particle = {
        element: heart,
        x,
        y,
        initialX: x,
        initialY: y,
        xDrift,
        speed,
        rotation,
        opacity: 0.6,
        life: 0
      }

      particlesRef.current.push(particle)
    }

    // Animation loop
    const animate = () => {
      if (!isActive) return

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life += 0.016 // ~60fps frame time
        particle.y -= particle.speed
        particle.x += particle.xDrift * 0.008 // Slower horizontal drift
        
        // Fade out as it approaches the top (last 150px)
        if (particle.y < 150) {
          particle.opacity = 0.6 * (particle.y / 150)
        }

        // Remove when reaches top of screen
        if (particle.y <= 0) {
          if (particle.element.parentNode) {
            particle.element.remove()
          }
          return false
        }

        const offsetX = particle.x - particle.initialX
        const offsetY = particle.y - particle.initialY
        particle.element.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${particle.rotation}deg)`
        particle.element.style.opacity = particle.opacity

        return true
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    // Start
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    rafRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      isActive = false
      document.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      // Clean up all particles
      particlesRef.current.forEach((particle) => {
        if (particle.element.parentNode) {
          particle.element.remove()
        }
      })
      particlesRef.current = []
    }
  }, [])

  return <div ref={containerRef} style={{ pointerEvents: 'none' }} />
}
