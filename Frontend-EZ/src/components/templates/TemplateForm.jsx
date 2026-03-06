import React, { useState } from 'react';

export default function TemplateForm({ initialData = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'other',
    defaultDescription: initialData?.defaultDescription || '',
    defaultBanner: initialData?.defaultBanner || '',
    previewImage: initialData?.previewImage || '',
    defaultPrice: initialData?.defaultPrice || 0,
    defaultCurrency: initialData?.defaultCurrency || 'INR',
    defaultCapacity: initialData?.defaultCapacity || 100,
    defaultDuration: {
      hours: initialData?.defaultDuration?.hours || 2,
      minutes: initialData?.defaultDuration?.minutes || 0
    },
    isPremium: initialData?.isPremium || false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    tags: initialData?.tags?.join(', ') || ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'concert', 'conference', 'wedding', 'workshop', 'seminar',
    'festival', 'sports', 'exhibition', 'networking', 'meetup',
    'webinar', 'party', 'fundraiser', 'other'
  ];

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.defaultPrice < 0) {
      newErrors.defaultPrice = 'Price cannot be negative';
    }
    
    if (formData.defaultCapacity < 1) {
      newErrors.defaultCapacity = 'Capacity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };
      
      await onSubmit(submitData);
    } catch (err) {
      alert(err.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Summer Music Festival Template"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Description
        </label>
        <textarea
          name="defaultDescription"
          value={formData.defaultDescription}
          onChange={handleChange}
          rows={4}
          placeholder="Enter a default description for events created from this template..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Banner URL
          </label>
          <input
            type="url"
            name="defaultBanner"
            value={formData.defaultBanner}
            onChange={handleChange}
            placeholder="https://example.com/banner.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview Image URL
          </label>
          <input
            type="url"
            name="previewImage"
            value={formData.previewImage}
            onChange={handleChange}
            placeholder="https://example.com/preview.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Price and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Price
          </label>
          <input
            type="number"
            name="defaultPrice"
            value={formData.defaultPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.defaultPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
            }`}
          />
          {errors.defaultPrice && <p className="text-red-500 text-sm mt-1">{errors.defaultPrice}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            name="defaultCurrency"
            value={formData.defaultCurrency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Capacity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="defaultCapacity"
          value={formData.defaultCapacity}
          onChange={handleChange}
          min="1"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.defaultCapacity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        {errors.defaultCapacity && <p className="text-red-500 text-sm mt-1">{errors.defaultCapacity}</p>}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Duration
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hours</label>
            <input
              type="number"
              name="defaultDuration.hours"
              value={formData.defaultDuration.hours}
              onChange={handleChange}
              min="0"
              max="23"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Minutes</label>
            <input
              type="number"
              name="defaultDuration.minutes"
              value={formData.defaultDuration.minutes}
              onChange={handleChange}
              min="0"
              max="59"
              step="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="music, outdoor, summer (comma-separated)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isPremium"
            checked={formData.isPremium}
            onChange={handleChange}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Premium Template (Exclusive features)
          </span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Active (Visible to users)
          </span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : initialData ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}
