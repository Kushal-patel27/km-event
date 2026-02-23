import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ExportDataModal - Reusable export modal for admin pages
 * @param {Object} props
 * @param {boolean} props.isOpen - Control modal visibility
 * @param {function} props.onClose - Close handler
 * @param {function} props.onExport - Export handler (format, filters) => void
 * @param {string} props.title - Modal title
 * @param {Array} props.filters - Available filters configuration
 */
export default function ExportDataModal({ isOpen, onClose, onExport, title = 'Export Data', filters = [] }) {
  const [format, setFormat] = useState('csv');
  const [filterValues, setFilterValues] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, filterValues);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilterValues({});
    setFormat('csv');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isExporting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'csv', icon: '📄', label: 'CSV', desc: 'Comma-separated values' },
                    { value: 'xlsx', icon: '📊', label: 'Excel', desc: 'Microsoft Excel format' },
                    { value: 'pdf', icon: '📑', label: 'PDF', desc: 'Portable document' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        format === option.value
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              {filters.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Filters (Optional)</label>
                  <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {filters.map(filter => (
                      <div key={filter.key} className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                          {filter.label}
                        </label>
                        {filter.type === 'date' && (
                          <input
                            type="date"
                            value={filterValues[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {filter.type === 'select' && (
                          <select
                            value={filterValues[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All</option>
                            {filter.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {filter.type === 'text' && (
                          <input
                            type="text"
                            value={filterValues[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            placeholder={filter.placeholder}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Export Information</p>
                    <p>Format: <strong>{format.toUpperCase()}</strong></p>
                    {Object.entries(filterValues).filter(([k, v]) => v).length > 0 && (
                      <p className="mt-1">
                        Active filters: <strong>{Object.entries(filterValues).filter(([k, v]) => v).length}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                disabled={isExporting}
              >
                Reset Filters
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
