import React from 'react'

export const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)

export const SettingToggle = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-600/30 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/40 transition">
    <div className="flex-1">
      <p className="font-medium text-gray-800 dark:text-white">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
    </div>
    <ToggleSwitch enabled={enabled} onChange={onChange} />
  </div>
)

export const InputField = ({ label, type = 'text', value, onChange, placeholder, className = '', disabled = false, maxLength }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className="w-full px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white/80 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition"
    />
  </div>
)

export const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white/80 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)

export const Button = ({ children, onClick, variant = 'primary', disabled = false, fullWidth = false, className = '' }) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:shadow-lg hover:shadow-indigo-300/50',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-orange-500 text-white hover:bg-orange-600',
  }
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  )
}

export const Modal = ({ isOpen, onClose, title, children, danger = false }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-700/50 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className={`text-xl font-bold mb-4 ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
