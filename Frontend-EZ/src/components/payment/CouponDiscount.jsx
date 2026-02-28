import React, { useState } from 'react'
import API from '../../services/api'

export default function CouponDiscount({ 
  eventId, 
  subtotal,
  isDarkMode,
  onCouponApplied,
  onCouponRemoved 
}) {
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleValidateCoupon = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    
    if (!couponCode.trim()) {
      setError('Please enter a coupon code')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const res = await API.post('/coupons/validate', {
        code: couponCode.toUpperCase(),
        eventId,
        subtotal
      })

      if (res.data.success) {
        const couponData = res.data.data
        setAppliedCoupon(couponData)
        setSuccess(`✓ ${couponData.description}`)
        setCouponCode('')
        
        // Call callback with discount info
        if (onCouponApplied) {
          onCouponApplied({
            couponId: couponData.couponId,
            code: couponData.code,
            discountAmount: couponData.discountAmount,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue
          })
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to apply coupon'
      setError(errorMsg)
      console.error('Error validating coupon:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setError('')
    setSuccess('')
    
    if (onCouponRemoved) {
      onCouponRemoved()
    }
  }

  if (!eventId) {
    return null
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-indigo-50 border-indigo-200'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-indigo-900'}`}>
          Have a Discount Code?
        </h3>
      </div>

      {appliedCoupon ? (
        <>
          {/* Applied Coupon Display */}
          <div className={`p-3 rounded-lg mb-3 ${
            isDarkMode
              ? 'bg-green-900/20 border border-green-700'
              : 'bg-green-100 border border-green-300'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-bold text-lg ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  {appliedCoupon.code}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  {appliedCoupon.description}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className={`text-sm font-medium px-3 py-1 rounded transition ${
                  isDarkMode
                    ? 'hover:bg-green-800 text-green-300'
                    : 'hover:bg-green-200 text-green-700'
                }`}
              >
                Remove
              </button>
            </div>

            {/* Discount Amount */}
            <div className={`mt-3 pt-3 border-t flex justify-between items-center ${
              isDarkMode ? 'border-green-700' : 'border-green-200'
            }`}>
              <span className={isDarkMode ? 'text-green-300' : 'text-green-700'}>Discount:</span>
              <span className={`font-bold text-lg ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                - ₹{appliedCoupon.discountAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Coupon Input Form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleValidateCoupon(e)
                  }
                }}
                placeholder="Enter coupon code"
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-indigo-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                disabled={loading || !couponCode.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                  loading || !couponCode.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Checking...' : 'Apply'}
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className={`p-2 rounded text-sm ${
                isDarkMode
                  ? 'bg-red-900/20 border border-red-700 text-red-300'
                  : 'bg-red-100 border border-red-300 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {success && (
              <div className={`p-2 rounded text-sm ${
                isDarkMode
                  ? 'bg-green-900/20 border border-green-700 text-green-300'
                  : 'bg-green-100 border border-green-300 text-green-700'
              }`}>
                {success}
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-indigo-700'}`}>
            💡 Tip: Check your email or event page for available discount codes
          </p>
        </>
      )}
    </div>
  )
}
