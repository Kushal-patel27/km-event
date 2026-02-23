import React from 'react'

// Base Skeleton component with shimmer effect
export const Skeleton = ({ className = '', variant = 'rectangular', width, height, animation = 'pulse' }) => {
  const baseClass = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClass = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-lg h-10'
  }[variant]
  
  const animationClass = {
    pulse: 'animate-pulse',
    shimmer: 'shimmer-effect',
    wave: 'wave-effect',
    none: ''
  }[animation]
  
  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '16px' : variant === 'circular' ? width : '100%')
  }
  
  return (
    <div 
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  )
}

// Skeleton Card for events/posts
export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <Skeleton variant="rectangular" height="200px" animation="shimmer" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="60%" />
        <div className="flex items-center gap-2 mt-4">
          <Skeleton variant="circular" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="30%" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton Post (Instagram-style)
export const SkeletonPost = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Skeleton variant="circular" width="40px" height="40px" animation="shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="80px" />
        </div>
      </div>
      
      {/* Image */}
      <Skeleton variant="rectangular" height="400px" animation="shimmer" />
      
      {/* Footer */}
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <Skeleton variant="circular" width="24px" height="24px" />
          <Skeleton variant="circular" width="24px" height="24px" />
          <Skeleton variant="circular" width="24px" height="24px" />
        </div>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
      </div>
    </div>
  )
}

// Skeleton List Item
export const SkeletonListItem = () => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg mb-2">
      <Skeleton variant="circular" width="50px" height="50px" animation="shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <Skeleton variant="button" width="80px" />
    </div>
  )
}

// Skeleton Table Row
export const SkeletonTableRow = ({ columns = 4 }) => {
  return (
    <tr className="border-b dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" animation="shimmer" />
        </td>
      ))}
    </tr>
  )
}

// Skeleton Grid (for multiple cards)
export const SkeletonGrid = ({ count = 6, columns = 3, Component = SkeletonCard }) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns] || 'grid-cols-1 md:grid-cols-3'
  
  return (
    <div className={`grid ${gridClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}

// Skeleton Page (Full page loader)
export const SkeletonPage = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Skeleton variant="text" width="300px" height="36px" animation="shimmer" />
      <Skeleton variant="text" width="500px" height="20px" animation="shimmer" />
      <div className="mt-8">
        <SkeletonGrid count={6} columns={3} />
      </div>
    </div>
  )
}

// Main Loading component - Entry point
export default function Loading({ variant = 'card', count = 1, columns = 3, ...props }) {
  const variants = {
    card: SkeletonCard,
    post: SkeletonPost,
    list: SkeletonListItem,
    page: SkeletonPage,
    grid: () => <SkeletonGrid count={count} columns={columns} />,
  }
  
  const Component = variants[variant] || SkeletonCard
  
  // For grid, render once
  if (variant === 'grid' || variant === 'page') {
    return <Component {...props} />
  }
  
  // For single components, render based on count
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...props} />
      ))}
    </>
  )
}

