import React, { useState, useRef } from 'react'
import { useDarkMode } from '../context/DarkModeContext'
import GenieModal from '../components/GenieModal'
import GenieDockButton from '../components/GenieDockButton'
import { motion } from 'framer-motion'

/**
 * GenieAnimationDemo: Full showcase of macOS Dock Genie animation
 * 
 * Demonstrates:
 * - Dock button trigger at bottom center
 * - Genie modal with elastic unfold
 * - Multiple content types
 * - Dark/light mode support
 * - Integration patterns
 */

export default function GenieAnimationDemo() {
  const { isDarkMode } = useDarkMode()
  const [activeModal, setActiveModal] = useState(null)
  const buttonRefs = useRef({
    help: null,
    settings: null,
    gallery: null,
  })

  const triggerRef = buttonRefs.current[activeModal]

  const contentSections = [
    {
      id: 'help',
      icon: '?',
      label: 'Help & Support',
      title: 'Help Center',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {[
              { q: 'How do I book tickets?', a: 'Navigate to Events, select your event, choose seats, and complete payment.' },
              { q: 'What\'s your refund policy?', a: 'Refunds depend on cancellation timing: 7+ days = full, 3-7 days = 75%, 0-3 days = none.' },
              { q: 'Can I modify my booking?', a: 'Yes, subject to availability and event policies. Modifications within 24 hours of the event are not allowed.' },
            ].map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <p className="font-semibold mb-1">{item.q}</p>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      title: 'User Settings',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Account Preferences</h3>
            <div className="space-y-3">
              <SettingToggle label="Email Notifications" defaultChecked isDarkMode={isDarkMode} />
              <SettingToggle label="Marketing Emails" defaultChecked={false} isDarkMode={isDarkMode} />
              <SettingToggle label="Event Reminders" defaultChecked isDarkMode={isDarkMode} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              💡 <strong>Tip:</strong> Enable event reminders to get notifications before your booked events start.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'gallery',
      icon: '🎨',
      label: 'Gallery',
      title: 'Event Gallery',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold mb-4">Recent Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['🎭 Theater Night', '🎵 Music Festival', '⚽ Sports Event', '🎪 Comedy Show'].map(
              (event, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-800/50 hover:border-red-500/50'
                      : 'border-gray-200 bg-gray-50 hover:border-indigo-300'
                  }`}
                >
                  <p className="text-center font-semibold">{event}</p>
                </motion.div>
              )
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div
      className={`min-h-screen py-12 transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-900 to-slate-950'
          : 'bg-gradient-to-b from-gray-50 to-white'
      }`}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-5xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Genie Animation Demo
          </h1>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            macOS Dock Genie–style opening animation powered by Framer Motion
          </p>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '⚡', title: 'Spring Physics', desc: 'Stiffness 300, damping 26, mass 0.9' },
            { icon: '🎬', title: 'Clip-Path Deformation', desc: 'Elastic sheet stretching effect' },
            { icon: '🎯', title: 'Origin-Based', desc: 'Animates from dock button position' },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-xl border-2 ${
                isDarkMode
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="font-bold mb-1">{card.title}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl border-2 mb-12 ${
            isDarkMode
              ? 'bg-blue-900/20 border-blue-500/50'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <p className={`text-center text-lg ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            👇 <strong>Click any button at the bottom center</strong> to trigger the Genie animation
          </p>
        </motion.div>

        {/* Feature Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`p-8 rounded-xl border-2 mb-16 ${
            isDarkMode
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Animation Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '✅ 60fps GPU-accelerated transforms',
              '✅ Spring-based physics (no easing)',
              '✅ Elastic clip-path deformation',
              '✅ Dock-origin animation',
              '✅ Subtle micro-overshoot',
              '✅ Fast start, slow settle',
              '✅ Zero layout reflow',
              '✅ Pixel-perfect final state',
            ].map((feature, idx) => (
              <div key={idx} className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {feature}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Dock Buttons at bottom */}
      {contentSections.map((section) => (
        <GenieDockButton
          key={section.id}
          ref={(el) => (buttonRefs.current[section.id] = el)}
          icon={section.icon}
          label={section.label}
          onClick={() => setActiveModal(section.id)}
          isDarkMode={isDarkMode}
        />
      ))}

      {/* Modals */}
      {contentSections.map((section) => (
        <GenieModal
          key={`modal-${section.id}`}
          isOpen={activeModal === section.id}
          onClose={() => setActiveModal(null)}
          triggerRef={triggerRef}
          title={section.title}
          isDarkMode={isDarkMode}
        >
          {section.content}
        </GenieModal>
      ))}
    </div>
  )
}

// Helper toggle component
function SettingToggle({ label, defaultChecked, isDarkMode }) {
  const [checked, setChecked] = React.useState(defaultChecked)
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
      isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-5 h-5 cursor-pointer"
      />
      <span className="font-medium">{label}</span>
    </label>
  )
}
