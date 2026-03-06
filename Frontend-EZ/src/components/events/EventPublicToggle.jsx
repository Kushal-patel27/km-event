import React, { useState } from 'react';
import api from '../../services/api';

export default function EventPublicToggle({ event, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null); // 'slug' or 'code'

  const handleTogglePublic = async () => {
    try {
      setLoading(true);
      const response = await api.patch(`/events/${event._id}/toggle-public`);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Failed to toggle public status:', error);
      alert(error.response?.data?.message || 'Failed to update event status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const slugUrl = event.slug 
    ? `${window.location.origin}/event/${event.slug}`
    : null;

  const shortCodeUrl = event.shortCode
    ? `${window.location.origin}/e/${event.shortCode}`
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Public Event Sharing</h3>
          <p className="text-sm text-gray-600 mt-1">
            Make this event publicly accessible via shareable links
          </p>
        </div>
        <button
          onClick={handleTogglePublic}
          disabled={loading}
          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            event.isPublic ? 'bg-red-600' : 'bg-gray-300'
          }`}
        >
          <span className="sr-only">Toggle public status</span>
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
              event.isPublic ? 'translate-x-9' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {event.isPublic ? (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Event is public and shareable</span>
          </div>

          {event.views !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600 px-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{event.views || 0} public views</span>
            </div>
          )}

          {/* Slug URL */}
          {slugUrl && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                SEO-Friendly URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slugUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={() => copyToClipboard(slugUrl, 'slug')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  {copied === 'slug' ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Short Code URL */}
          {shortCodeUrl && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Short Link (for QR codes & sharing)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shortCodeUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={() => copyToClipboard(shortCodeUrl, 'code')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  {copied === 'code' ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tips for sharing:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use the SEO-friendly URL for better search engine visibility</li>
                  <li>• Use the short link for QR codes and social media posts</li>
                  <li>• Public events appear in search engines and event listings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Event is private and not publicly accessible</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 px-3">
            Toggle on to generate shareable links and make this event visible to the public
          </p>
        </div>
      )}
    </div>
  );
}
