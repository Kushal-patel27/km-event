import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function SubscriptionSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState({
    free: {
      name: 'Free',
      description: 'Free tier for new organizers',
      commissionPercentage: 30,
      monthlyFee: 0,
      eventLimit: 5,
      ticketLimit: 1000,
      payoutFrequency: 'monthly',
      minPayoutAmount: 100,
      displayOrder: 1,
      features: ['Up to 5 events', 'Basic analytics', 'Monthly payouts', 'Email support']
    },
    basic: {
      name: 'Basic',
      description: 'For growing organizers',
      commissionPercentage: 20,
      monthlyFee: 500,
      eventLimit: 15,
      ticketLimit: 5000,
      payoutFrequency: 'monthly',
      minPayoutAmount: 100,
      displayOrder: 2,
      features: ['Up to 15 events', 'Advanced analytics', 'Monthly payouts', 'Priority support', 'Custom branding']
    },
    pro: {
      name: 'Pro',
      description: 'For professional organizers',
      commissionPercentage: 10,
      monthlyFee: 2000,
      eventLimit: 999,
      ticketLimit: 99999,
      payoutFrequency: 'weekly',
      minPayoutAmount: 100,
      displayOrder: 3,
      features: ['Unlimited events', 'Full analytics', 'Weekly payouts', '24/7 support', 'API access', 'Custom integrations']
    }
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const createPlans = async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        API.post('/subscriptions/plans', plans.free),
        API.post('/subscriptions/plans', plans.basic),
        API.post('/subscriptions/plans', plans.pro)
      ])
      
      if (results.every(r => r.data?.success)) {
        setMessage({ type: 'success', text: 'All plans created successfully!' })
        setTimeout(() => setStep(2), 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create plans' })
    }
    setLoading(false)
  }

  return (
    <AdminLayout title="Subscription System Setup">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                step >= s ? 'bg-red-600' : 'bg-gray-300'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-red-600' : 'bg-gray-300'}`}></div>}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Create Plans</span>
          <span>Assign Organizers</span>
          <span>Launch</span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Create Plans */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Step 1: Create Subscription Plans</h2>
            <p className="text-blue-700">We'll create three pre-configured plans for you. You can customize them anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold rounded-bl">POPULAR</div>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{plans.free.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{plans.free.description}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission:</span>
                  <span className="text-2xl font-bold text-red-600">{plans.free.commissionPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Fee:</span>
                  <span className="font-semibold">₹{plans.free.monthlyFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Limit:</span>
                  <span className="font-semibold">{plans.free.eventLimit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payout Freq:</span>
                  <span className="font-semibold capitalize">{plans.free.payoutFrequency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <ul className="space-y-2">
                  {plans.free.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-green-600">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Basic Plan Preview */}
            <div className="bg-white border border-green-200 rounded-lg p-6 ring-2 ring-green-500 relative">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold rounded-bl">BEST VALUE</div>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{plans.basic.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{plans.basic.description}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission:</span>
                  <span className="text-2xl font-bold text-green-600">{plans.basic.commissionPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Fee:</span>
                  <span className="font-semibold">{formatCurrency(plans.basic.monthlyFee)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Limit:</span>
                  <span className="font-semibold">{plans.basic.eventLimit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payout Freq:</span>
                  <span className="font-semibold capitalize">{plans.basic.payoutFrequency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <ul className="space-y-2">
                  {plans.basic.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-green-600">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pro Plan Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 px-3 py-1 text-xs font-semibold rounded-bl">PREMIUM</div>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{plans.pro.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{plans.pro.description}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission:</span>
                  <span className="text-2xl font-bold text-purple-600">{plans.pro.commissionPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Fee:</span>
                  <span className="font-semibold">{formatCurrency(plans.pro.monthlyFee)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Limit:</span>
                  <span className="font-semibold">Unlimited</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payout Freq:</span>
                  <span className="font-semibold capitalize">{plans.pro.payoutFrequency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <ul className="space-y-2">
                  {plans.pro.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-purple-600">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={createPlans}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Creating Plans...' : 'Create These Plans →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Assign Organizers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Step 2: Assign Plans to Organizers</h2>
            <p className="text-green-700">Go to the Organizer Subscriptions page to assign plans to your organizers.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">👥</div>
              <h3 className="text-2xl font-bold text-gray-900">Ready to Assign Plans</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Now you can assign the Free, Basic, and Pro plans to your organizers. Each organizer will see their subscription details and can start selling tickets.
              </p>

              <button
                onClick={() => navigate('/admin/organizer-subscriptions')}
                className="inline-block mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Go to Organizer Subscriptions →
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium ml-auto"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Launch */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">Step 3: System Ready to Launch! 🚀</h2>
            <p className="text-purple-700">Your subscription and commission system is now ready for use.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">👨‍💼</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Event Admins</h3>
              <p className="text-gray-600 text-sm mb-4">
                Event admins can now view their subscription, track revenue, and request payouts from their dashboard.
              </p>
              <button
                onClick={() => navigate('/event-admin/dashboard')}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                View Event Admin Dashboard →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Admins</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage all subscription plans, organizers, commissions, and view detailed analytics and reports.
              </p>
              <button
                onClick={() => navigate('/admin/subscriptions')}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Go to Admin Hub →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Commission Tracking</h3>
              <p className="text-gray-600 text-sm mb-4">
                Commissions are automatically calculated on every booking based on the organizer's subscription plan.
              </p>
              <button
                onClick={() => navigate('/admin/commission-analytics')}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                View Commission Analytics →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🏦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payout Management</h3>
              <p className="text-gray-600 text-sm mb-4">
                Organizers can request payouts when they have pending commissions above the minimum amount.
              </p>
              <button
                onClick={() => navigate('/admin/subscriptions')}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                View Payout System →
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✓ Setup Complete!</h3>
            <p className="text-green-700 mb-4">
              Your subscription and commission system is now fully operational. All organizers can:
            </p>
            <ul className="space-y-2 text-green-700">
              <li>✓ See their current subscription plan and commission rate</li>
              <li>✓ View revenue tracking and analytics</li>
              <li>✓ Request payouts when they have pending commissions</li>
              <li>✓ Track payout status in real-time</li>
            </ul>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Go to Admin Hub
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium ml-auto"
            >
              Done - Return Home
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
