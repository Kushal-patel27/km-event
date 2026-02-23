# Skeleton Loading Component

Instagram-style skeleton loading effect for React. Easy to use and highly reusable.

## Quick Start

```jsx
import Loading from './components/common/Loading'

function MyComponent() {
  const { data, loading } = useData()
  
  if (loading) {
    return <Loading variant="grid" count={6} columns={3} />
  }
  
  return <div>{/* Your content */}</div>
}
```

## Usage Examples

### 1. Simple Single Skeleton
```jsx
<Loading variant="card" />
```

### 2. Multiple Skeletons
```jsx
<Loading variant="card" count={3} />
```

### 3. Instagram-Style Post
```jsx
<Loading variant="post" />
```

### 4. List Items
```jsx
<Loading variant="list" count={5} />
```

### 5. Grid Layout
```jsx
<Loading variant="grid" count={6} columns={3} />
```

### 6. Full Page
```jsx
<Loading variant="page" />
```

## Available Variants

| Variant | Description |
|---------|-------------|
| `card` | Event/post card skeleton (default) |
| `post` | Instagram-style post with header, image, and footer |
| `list` | List item with avatar and text |
| `grid` | Grid of multiple skeletons |
| `page` | Full page skeleton layout |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `"card"` | Type of skeleton to display |
| `count` | number | `1` | Number of skeletons to render |
| `columns` | number | `3` | Grid columns (for grid variant) |

## Individual Components

For more control, use individual skeleton components:

```jsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonPost, 
  SkeletonListItem,
  SkeletonGrid 
} from './components/common/Loading'

// Base skeleton
<Skeleton variant="text" width="200px" />
<Skeleton variant="circular" width="50px" height="50px" />
<Skeleton variant="button" width="120px" />

// Pre-built skeletons
<SkeletonCard />
<SkeletonPost />
<SkeletonListItem />
<SkeletonGrid count={6} columns={3} />
```

## Custom Skeleton Layout

```jsx
import { Skeleton } from './components/common/Loading'

function CustomSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton variant="circular" width="60px" height="60px" animation="shimmer" />
      <Skeleton variant="text" width="80%" height="24px" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="button" width="100%" height="44px" />
    </div>
  )
}
```

## Animation Types

| Animation | Description |
|-----------|-------------|
| `shimmer` | Instagram-style shimmer (recommended) |
| `pulse` | Pulsing opacity animation |
| `wave` | Wave opacity animation |
| `none` | No animation |

```jsx
<Skeleton animation="shimmer" />
```

## Skeleton Variants

| Variant | Description | Default Height |
|---------|-------------|----------------|
| `rectangular` | Rectangular shape | 100% |
| `circular` | Circle shape | Same as width |
| `text` | Text line | 16px |
| `button` | Button shape | 40px |

## Real-World Examples

### Event List Page
```jsx
function EventsPage() {
  const { events, loading } = useEvents()
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      
      {loading ? (
        <Loading variant="grid" count={9} columns={3} />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  )
}
```

### Dashboard with Stats
```jsx
function Dashboard() {
  const { stats, loading } = useStats()
  
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton variant="text" width="300px" height="36px" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg">
              <Skeleton variant="text" width="120px" />
              <Skeleton variant="text" width="80px" height="32px" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return <div>{/* Your dashboard */}</div>
}
```

### Table Loading
```jsx
import { SkeletonTableRow } from './components/common/Loading'

function BookingsTable() {
  const { bookings, loading } = useBookings()
  
  return (
    <table>
      <thead>{/* headers */}</thead>
      <tbody>
        {loading ? (
          Array.from({length: 5}).map((_, i) => (
            <SkeletonTableRow key={i} columns={4} />
          ))
        ) : (
          bookings.map(booking => <BookingRow key={booking.id} {...booking} />)
        )}
      </tbody>
    </table>
  )
}
```

## Dark Mode Support

All skeleton components automatically support dark mode when using Tailwind's dark mode.

## Features

✓ Instagram-style shimmer effect  
✓ Multiple pre-built layouts  
✓ Highly customizable  
✓ Dark mode support  
✓ Responsive design  
✓ Zero dependencies (except React)  
✓ TypeScript-friendly  
✓ Performance optimized  

## File Structure

```
components/common/
├── Loading.jsx          # Main component
├── LoadingExamples.jsx  # Usage examples
└── LOADING_README.md    # This file
```

## CSS Required

The shimmer and wave animations are defined in `src/index.css`:

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer-effect {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

This is already included in your project's `index.css`.

## Tips

1. **Use `variant="grid"` for collections** - It's the easiest way to show loading for lists of items
2. **Match your layout** - Create custom skeletons that match your actual content layout
3. **Use shimmer animation** - It looks more polished than pulse
4. **Keep it simple** - Don't overcomplicate the skeleton, it's just a placeholder
5. **Test dark mode** - Make sure it looks good in both light and dark themes

## Need Help?

Check `LoadingExamples.jsx` for comprehensive examples of all use cases.
