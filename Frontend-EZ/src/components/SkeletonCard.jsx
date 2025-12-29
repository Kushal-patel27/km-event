export default function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#161A23]/80 backdrop-blur-xl overflow-hidden border border-white/10 shadow-xl animate-pulse">
      <div className="h-48 bg-gradient-to-br from-gray-700/50 to-gray-800/50 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded w-2/3 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-10 bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-lg mt-4 relative overflow-hidden\">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  )
}
