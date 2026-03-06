export default function SkeletonCard({ isDarkMode = true }) {
  const bgColor = isDarkMode ? 'bg-[#161A23]/80' : 'bg-white';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
  const shimmerBg = isDarkMode 
    ? 'from-gray-700/50 to-gray-800/50' 
    : 'from-gray-300/50 to-gray-400/50';
  
  return (
    <div className={`rounded-2xl ${bgColor} backdrop-blur-xl overflow-hidden border ${borderColor} shadow-xl animate-pulse`}>
      <div className={`h-48 bg-gradient-to-br ${shimmerBg} relative overflow-hidden`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className={`h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded w-3/4 relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded w-2/3 relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className={`h-10 bg-gradient-to-r ${isDarkMode ? 'from-red-900/30 to-red-800/30' : 'from-red-300/30 to-red-400/30'} rounded-lg mt-4 relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  )
}
