import React from 'react';
import formatINR from '../../utils/currency';

export default function TemplateCard({ template, onEdit, onDelete, onClone }) {
  const getCategoryIcon = (category) => {
    const icons = {
      concert: '🎵',
      conference: '👔',
      wedding: '💍',
      workshop: '🛠️',
      seminar: '📚',
      festival: '🎉',
      sports: '⚽',
      exhibition: '🖼️',
      networking: '🤝',
      meetup: '☕',
      webinar: '💻',
      party: '🎊',
      fundraiser: '💰',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Template Preview Image */}
      <div className="relative h-48 bg-gradient-to-br from-red-500 to-red-700 overflow-hidden">
        {template.previewImage || template.defaultBanner ? (
          <img
            src={template.previewImage || template.defaultBanner}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">{getCategoryIcon(template.category)}</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {template.isPremium && (
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full shadow-md">
              ⭐ Premium
            </span>
          )}
          {!template.isActive && (
            <span className="px-3 py-1 bg-gray-400 text-white text-xs font-semibold rounded-full shadow-md">
              Inactive
            </span>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1 bg-white bg-opacity-90 text-gray-800 text-xs font-semibold rounded-full shadow-md">
            {template.category}
          </span>
        </div>
      </div>

      {/* Template Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
          {template.name}
        </h3>

        {template.defaultDescription && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {template.defaultDescription}
          </p>
        )}

        {/* Template Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 mb-1">Default Price</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatINR(template.defaultPrice || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Capacity</p>
            <p className="text-sm font-semibold text-gray-900">
              {template.defaultCapacity || 100} attendees
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Used</p>
            <p className="text-sm font-semibold text-gray-900">
              {template.usageCount || 0} times
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Used</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(template.lastUsedAt)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClone}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Clone
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
