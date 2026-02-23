import React from 'react';
import { useDarkMode } from '../../context/DarkModeContext';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const { isDarkMode } = useDarkMode();
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const spinnerColor = isDarkMode ? 'border-red-500' : 'border-indigo-600';

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} ${spinnerColor} border-b-2 mx-auto`}></div>
        {message && (
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
