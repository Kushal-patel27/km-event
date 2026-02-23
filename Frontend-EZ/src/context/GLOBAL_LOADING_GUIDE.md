# Global Loading System

The app now has a global skeleton loading system available in ALL files!

## Quick Usage

Import the `useLoading` hook in any component:

```jsx
import { useLoading } from '../context/LoadingContext'

function MyComponent() {
  const { showLoading, hideLoading } = useLoading()
  
  const fetchData = async () => {
    // Show loading overlay
    showLoading({ variant: 'grid', count: 6, columns: 3 })
    
    try {
      const data = await API.get('/events')
      // Process data...
    } finally {
      // Hide loading overlay
      hideLoading()
    }
  }
  
  return <div>...</div>
}
```

## API

### `useLoading()` Hook

Returns an object with:
- `isLoading` - boolean indicating if loading is active
- `showLoading(options)` - function to show loading overlay
- `hideLoading()` - function to hide loading overlay

### `showLoading(options)`

Options object:
```jsx
{
  variant: 'card' | 'post' | 'list' | 'grid' | 'page', // default: 'card'
  count: number,    // default: 6
  columns: number   // default: 3 (for grid variant)
}
```

## Examples

### 1. Loading Events Page
```jsx
import { useLoading } from '../context/LoadingContext'
import { useEffect } from 'react'

function EventsPage() {
  const { showLoading, hideLoading } = useLoading()
  const [events, setEvents] = useState([])
  
  useEffect(() => {
    const loadEvents = async () => {
      showLoading({ variant: 'grid', count: 9, columns: 3 })
      
      try {
        const response = await API.get('/events')
        setEvents(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        hideLoading()
      }
    }
    
    loadEvents()
  }, [])
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}
```

### 2. Loading Dashboard
```jsx
import { useLoading } from '../context/LoadingContext'

function Dashboard() {
  const { showLoading, hideLoading } = useLoading()
  
  useEffect(() => {
    showLoading({ variant: 'page' })
    
    Promise.all([
      API.get('/stats'),
      API.get('/recent-events'),
      API.get('/bookings')
    ])
    .then(([stats, events, bookings]) => {
      // Process data...
    })
    .finally(() => {
      hideLoading()
    })
  }, [])
  
  return <div>Dashboard content...</div>
}
```

### 3. Loading on Button Click
```jsx
import { useLoading } from '../context/LoadingContext'

function CreateEvent() {
  const { showLoading, hideLoading } = useLoading()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    showLoading({ variant: 'card', count: 1 })
    
    try {
      await API.post('/events', formData)
      navigate('/events')
    } catch (error) {
      alert('Error creating event')
    } finally {
      hideLoading()
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### 4. Loading List
```jsx
const { showLoading, hideLoading } = useLoading()

const loadBookings = async () => {
  showLoading({ variant: 'list', count: 5 })
  
  try {
    const data = await API.get('/bookings')
    setBookings(data)
  } finally {
    hideLoading()
  }
}
```

## Local vs Global Loading

### Use Global Loading (useLoading) when:
- ✅ Loading entire pages on mount
- ✅ Route transitions
- ✅ Major data operations (create, update, delete)
- ✅ Form submissions
- ✅ Initial app load

### Use Local Loading (useState) when:
- ✅ Small sections of a page
- ✅ Individual cards or items
- ✅ Inline loading indicators
- ✅ Multiple independent loading states on one page

### Example - Local Loading
```jsx
import Loading from '../components/common/Loading'
import { useState } from 'react'

function EventCard() {
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    API.get('/event/123')
      .then(data => setEvent(data))
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) {
    return <Loading variant="card" />
  }
  
  return <div>Event content...</div>
}
```

## Features

✓ **Global Loading Overlay** - Shows full-screen loading across entire app  
✓ **Available Everywhere** - Use in any component file  
✓ **Customizable** - Choose variant, count, and columns  
✓ **Dark Mode Support** - Automatically adapts to theme  
✓ **Simple API** - Just `showLoading()` and `hideLoading()`  
✓ **Non-blocking** - Can be dismissed at any time  

## Important Notes

1. **Always use try/finally** to ensure `hideLoading()` is called even if an error occurs
2. **Don't nest multiple showLoading calls** - hide the previous one first
3. **Use appropriate variants** - match the content you're loading
4. **Clean up in useEffect** - if component unmounts, loading should stop

## Testing

```jsx
import { useLoading } from '../context/LoadingContext'

function TestPage() {
  const { showLoading, hideLoading } = useLoading()
  
  return (
    <div className="p-6 space-y-4">
      <button onClick={() => showLoading({ variant: 'card', count: 3 })}>
        Show Card Loading
      </button>
      <button onClick={() => showLoading({ variant: 'grid', count: 6, columns: 3 })}>
        Show Grid Loading
      </button>
      <button onClick={() => showLoading({ variant: 'post' })}>
        Show Post Loading
      </button>
      <button onClick={() => showLoading({ variant: 'page' })}>
        Show Page Loading
      </button>
      <button onClick={hideLoading}>
        Hide Loading
      </button>
    </div>
  )
}
```

## Files

- `src/context/LoadingContext.jsx` - Global loading context provider
- `src/components/common/Loading.jsx` - Skeleton loading components
- `src/App.jsx` - LoadingProvider wraps entire app

## How It Works

1. `LoadingProvider` wraps the entire app in `App.jsx`
2. When you call `showLoading()`, a full-screen overlay appears
3. The overlay shows the skeleton loading animation
4. When you call `hideLoading()`, the overlay disappears
5. Your actual content is visible underneath

The loading state is managed globally, so any component can control it!
