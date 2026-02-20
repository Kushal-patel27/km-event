import React from 'react'
import Loading, { 
  Skeleton, 
  SkeletonCard, 
  SkeletonPost, 
  SkeletonListItem,
  SkeletonTableRow,
  SkeletonGrid,
  SkeletonPage
} from './Loading'

/**
 * SKELETON LOADING COMPONENT USAGE EXAMPLES
 * ==========================================
 * 
 * This file demonstrates all the ways to use the skeleton loading components.
 * Copy any example below into your components.
 */

// Example 1: Simple Loading Component (Most Common)
export function Example1_SimpleLoading() {
  return (
    <div>
      {/* Single card skeleton */}
      <Loading variant="card" />
      
      {/* Multiple card skeletons */}
      <Loading variant="card" count={3} />
      
      {/* Instagram-style post skeleton */}
      <Loading variant="post" />
      
      {/* List item skeleton */}
      <Loading variant="list" count={5} />
      
      {/* Grid of skeletons */}
      <Loading variant="grid" count={6} columns={3} />
      
      {/* Full page skeleton */}
      <Loading variant="page" />
    </div>
  )
}

// Example 2: Using Individual Skeleton Components
export function Example2_IndividualComponents() {
  return (
    <div>
      {/* Single card */}
      <SkeletonCard />
      
      {/* Instagram post */}
      <SkeletonPost />
      
      {/* List items */}
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
      
      {/* Grid of cards */}
      <SkeletonGrid count={6} columns={3} Component={SkeletonCard} />
      
      {/* Full page */}
      <SkeletonPage />
    </div>
  )
}

// Example 3: Base Skeleton Component (Custom Layouts)
export function Example3_CustomSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Basic skeleton */}
      <Skeleton />
      
      {/* Text skeleton */}
      <Skeleton variant="text" width="200px" />
      
      {/* Circular skeleton (avatar) */}
      <Skeleton variant="circular" width="50px" height="50px" />
      
      {/* Button skeleton */}
      <Skeleton variant="button" width="120px" />
      
      {/* With different animations */}
      <Skeleton animation="shimmer" />
      <Skeleton animation="pulse" />
      <Skeleton animation="wave" />
      <Skeleton animation="none" />
      
      {/* Custom height and width */}
      <Skeleton width="100%" height="300px" />
    </div>
  )
}

// Example 4: Real-World Event Card Skeleton
export function Example4_EventCardSkeleton() {
  return (
    <div className="max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Event Image */}
      <Skeleton variant="rectangular" height="250px" animation="shimmer" />
      
      <div className="p-6 space-y-4">
        {/* Event Title */}
        <Skeleton variant="text" width="80%" height="24px" />
        
        {/* Event Details */}
        <div className="space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
        
        {/* Organizer Info */}
        <div className="flex items-center gap-3 pt-4">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="30%" />
          </div>
        </div>
        
        {/* Action Button */}
        <Skeleton variant="button" width="100%" height="44px" animation="shimmer" />
      </div>
    </div>
  )
}

// Example 5: Table Skeleton
export function Example5_TableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="p-4"><Skeleton variant="text" width="80px" /></th>
            <th className="p-4"><Skeleton variant="text" width="100px" /></th>
            <th className="p-4"><Skeleton variant="text" width="120px" /></th>
            <th className="p-4"><Skeleton variant="text" width="60px" /></th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRow columns={4} />
          <SkeletonTableRow columns={4} />
          <SkeletonTableRow columns={4} />
          <SkeletonTableRow columns={4} />
          <SkeletonTableRow columns={4} />
        </tbody>
      </table>
    </div>
  )
}

// Example 6: Dashboard Skeleton
export function Example6_DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="300px" height="36px" animation="shimmer" />
        <Skeleton variant="text" width="500px" height="20px" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <Skeleton variant="text" width="120px" className="mb-4" />
            <Skeleton variant="text" width="80px" height="32px" />
          </div>
        ))}
      </div>
      
      {/* Events Grid */}
      <SkeletonGrid count={6} columns={3} />
    </div>
  )
}

// Example 7: Conditional Loading (How to use in real components)
export function Example7_ConditionalLoading({ loading, data }) {
  if (loading) {
    return <Loading variant="grid" count={6} columns={3} />
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-lg p-4">
          {/* Your actual content */}
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * QUICK USAGE GUIDE:
 * ===================
 * 
 * 1. Import the component:
 *    import Loading from './components/common/Loading'
 * 
 * 2. Use in your component:
 *    {loading ? <Loading variant="card" count={3} /> : <YourContent />}
 * 
 * 3. Available variants:
 *    - "card" - Event/post card skeleton
 *    - "post" - Instagram-style post
 *    - "list" - List item skeleton
 *    - "grid" - Grid of skeletons
 *    - "page" - Full page skeleton
 * 
 * 4. Props:
 *    - variant: string (default: "card")
 *    - count: number (default: 1) - How many skeletons to show
 *    - columns: number (default: 3) - Grid columns (for grid variant)
 * 
 * 5. Animation types:
 *    - "shimmer" - Instagram-style shimmer effect (recommended)
 *    - "pulse" - Pulsing animation
 *    - "wave" - Wave animation
 *    - "none" - No animation
 */

export default function LoadingExamples() {
  return (
    <div className="space-y-12 p-6">
      <h1 className="text-3xl font-bold">Skeleton Loading Examples</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Simple Loading</h2>
        <Example1_SimpleLoading />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Individual Components</h2>
        <Example2_IndividualComponents />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Custom Skeleton</h2>
        <Example3_CustomSkeleton />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Event Card Skeleton</h2>
        <Example4_EventCardSkeleton />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Table Skeleton</h2>
        <Example5_TableSkeleton />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Dashboard Skeleton</h2>
        <Example6_DashboardSkeleton />
      </section>
    </div>
  )
}
