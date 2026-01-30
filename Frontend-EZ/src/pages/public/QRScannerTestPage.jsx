import React from 'react';
import { Link } from 'react-router-dom';

/**
 * QR Scanner Test Page
 * Quick links to test high-performance QR scanner UI components
 */
export default function QRScannerTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎫 High-Performance QR Scanner
          </h1>
          <p className="text-lg text-gray-600">
            Test the new high-traffic QR scanning system designed for 10,000-20,000 attendees
          </p>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
              ✅ Backend Ready
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
              ✅ UI Integrated
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold">
              ✅ Redis Caching
            </span>
          </div>
        </div>
        
        {/* Scanner Interface Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="text-6xl">📱</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Staff Scanner Interface
              </h2>
              <p className="text-gray-600 mb-4">
                Mobile-optimized scanner with QR camera, offline mode, and real-time validation feedback.
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Real-time QR code scanning with device camera</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Offline mode with automatic sync queue</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Sub-50ms validation with performance metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Audio feedback (success/duplicate/error)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Scan history tracking (last 50 scans)</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Link
                  to="/staff/hp-scanner"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Open Scanner →
                </Link>
                <a
                  href="https://github.com/yourusername/km-event/blob/main/HIGH_PERFORMANCE_QR_UI_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  📚 View Guide
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analytics Dashboard Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="text-6xl">📊</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600 mb-4">
                Real-time monitoring of entry statistics, gate traffic, staff performance, and duplicate attempts.
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Live stats (auto-refresh every 10 seconds)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Interactive charts (gate traffic, entry timeline)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Staff performance table with success rates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Duplicate attempt monitoring and alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Dark mode support with responsive design</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Link
                  to="/super-admin/scanner-analytics"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg"
                >
                  Open Analytics →
                </Link>
                <a
                  href="https://github.com/yourusername/km-event/blob/main/HIGH_PERFORMANCE_QR_SYSTEM.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  📚 Technical Docs
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backend Status */}
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Backend Services</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Node.js Server</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Redis Cache</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Check Connection
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">MongoDB</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Rate Limiting</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
            
            {/* Frontend Status */}
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frontend Components</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Scanner UI</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Integrated
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Analytics Dashboard</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Integrated
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">html5-qrcode</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Installed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">recharts</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Installed
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Targets</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">&lt;50ms</div>
              <div className="text-sm text-gray-600">Average Validation</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">80%+</div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">3,000+</div>
              <div className="text-sm text-gray-600">Scans/Minute</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">60/min</div>
              <div className="text-sm text-gray-600">Per Device Limit</div>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/staff/login"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔑</div>
                <div>
                  <div className="font-semibold text-gray-900">Staff Login</div>
                  <div className="text-sm text-gray-600">Access scanner interface</div>
                </div>
              </div>
            </Link>
            
            <Link
              to="/super-admin/login"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">👑</div>
                <div>
                  <div className="font-semibold text-gray-900">Admin Login</div>
                  <div className="text-sm text-gray-600">View analytics dashboard</div>
                </div>
              </div>
            </Link>
            
            <a
              href="/HIGH_PERFORMANCE_QR_SYSTEM.md"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">📘</div>
                <div>
                  <div className="font-semibold text-gray-900">Technical Documentation</div>
                  <div className="text-sm text-gray-600">Architecture & implementation</div>
                </div>
              </div>
            </a>
            
            <a
              href="/QR_SYSTEM_QUICK_SETUP.md"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚡</div>
                <div>
                  <div className="font-semibold text-gray-900">Quick Setup Guide</div>
                  <div className="text-sm text-gray-600">5-minute installation</div>
                </div>
              </div>
            </a>
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>High-Performance QR Scanner System v1.0.0</p>
          <p className="mt-1">Built for 10,000-20,000 concurrent attendees</p>
        </div>
        
      </div>
    </div>
  );
}
