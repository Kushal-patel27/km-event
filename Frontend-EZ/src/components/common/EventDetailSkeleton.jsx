export default function EventDetailSkeleton({ isDarkMode = true }) {
  const bgColor = isDarkMode ? 'bg-black' : 'bg-gray-50';
  const cardBg = isDarkMode ? 'bg-black' : 'bg-white';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
  const shimmerBg = isDarkMode 
    ? 'from-gray-700/50 to-gray-800/50' 
    : 'from-gray-300/50 to-gray-400/50';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  
  return (
    <div className={`min-h-screen py-6 sm:py-12 ${bgColor} ${textColor}`}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className={`rounded-2xl shadow-lg overflow-hidden border ${borderColor} ${cardBg}`}>
          {/* Hero Image Skeleton */}
          <div className={`w-full aspect-video overflow-hidden bg-gradient-to-br ${shimmerBg} relative`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-3">
              <div className={`h-10 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-3/4`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className={`h-8 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-2/3`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>

            {/* Date & Location Skeleton */}
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden flex-1 w-1/2`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden flex-shrink-0 mt-1`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-2/3`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className={`h-3 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-1/2`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className={`border-b ${borderColor} pb-6`}>
              <div className="flex flex-wrap gap-8">
                <div className="space-y-2">
                  <div className={`h-3 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-24`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className={`h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-12`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className={`h-3 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-20`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className={`h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-16`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-3">
              <div className={`h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-32`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="space-y-2">
                <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-5/6`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </div>

            {/* Ticket Types Skeleton */}
            <div className="space-y-4">
              <div className={`h-5 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-40`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className={`border ${borderColor} rounded-lg p-4 space-y-3`}>
                    <div className={`h-4 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-1/2`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className={`h-3 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-2/3`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'} pt-3 flex justify-between items-center`}>
                      <div className={`h-6 bg-gradient-to-r ${isDarkMode ? 'from-red-900/30 to-red-800/30' : 'from-red-300/30 to-red-400/30'} rounded relative overflow-hidden w-20`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className={`h-3 bg-gradient-to-r ${shimmerBg} rounded relative overflow-hidden w-24`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Button Skeleton */}
            <div className={`border-t ${borderColor} pt-6 flex gap-4`}>
              <div className={`h-12 bg-gradient-to-r ${isDarkMode ? 'from-red-900/30 to-red-800/30' : 'from-red-300/30 to-red-400/30'} rounded-lg relative overflow-hidden flex-1`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
