# K&M Events - Home Page Theme Color & Style Guide

## Color Palette

### Primary Colors
```
Background Primary:     #0B0F19  (Deep Navy Blue)
Background Secondary:   #0d1221  (Navy Blue)
Accent Primary:         #ef4444  (Red 500)
Accent Secondary:       #dc2626  (Red 600)
```

### Text Colors
```
White (Primary):        #ffffff
Gray Light:             #f3f4f6  (Gray 100)
Gray Medium:            #d1d5db  (Gray 300)
Gray Dark:              #6b7280  (Gray 500)
Gray Very Dark:         #4b5563  (Gray 600+)
```

### Glassmorphic Effects
```
White Overlays:
  - white/3   = rgba(255, 255, 255, 0.03)
  - white/8   = rgba(255, 255, 255, 0.08)
  - white/10  = rgba(255, 255, 255, 0.1)
  - white/15  = rgba(255, 255, 255, 0.15)
  - white/20  = rgba(255, 255, 255, 0.2)
  - white/30  = rgba(255, 255, 255, 0.3)
  - white/40  = rgba(255, 255, 255, 0.4)

Black Overlays:
  - black/30  = rgba(0, 0, 0, 0.3)
  - black/60  = rgba(0, 0, 0, 0.6)
  - black/70  = rgba(0, 0, 0, 0.7)
  - black/90  = rgba(0, 0, 0, 0.9)
  - black/95  = rgba(0, 0, 0, 0.95)
```

---

## Typography System

### Font Family
```
Primary: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto
```

### Font Weights & Sizes

**Headings:**
- H1: `text-6xl md:text-7xl font-extrabold` (Bright, eye-catching)
- H2: `text-4xl md:text-5xl font-extrabold` (Section titles)
- H3: `text-xl font-bold` (Subsection titles)
- Labels: `text-xs md:text-sm uppercase tracking-[0.3em]` (Section labels)

**Body Text:**
- Large: `text-lg md:text-xl text-gray-300`
- Regular: `text-base md:text-lg text-gray-300`
- Small: `text-sm text-gray-400`
- Tiny: `text-xs text-gray-500`

---

## Component Styling

### Buttons

**Primary Button:**
```tailwind
px-6 sm:px-8 py-3 sm:py-4 
bg-gradient-to-r from-red-600 to-red-500 
hover:from-red-700 hover:to-red-600
rounded-xl text-base sm:text-lg font-bold 
shadow-lg hover:shadow-red-500/50
transform hover:scale-105 
transition-all duration-300
```

**Secondary Button:**
```tailwind
px-6 sm:px-8 py-3 sm:py-4 
border-2 border-white/40 
rounded-xl text-base sm:text-lg font-semibold 
hover:bg-white/10 hover:border-white/60 
backdrop-blur-sm 
transition-all duration-300
```

### Cards

**Glassmorphic Card:**
```tailwind
p-6 md:p-8 
rounded-2xl 
bg-gradient-to-br from-white/8 to-white/3 
border border-white/15 
backdrop-blur-sm 
hover:from-white/15 hover:to-white/8 
hover:border-red-500/40 
transition-all duration-300 
hover:-translate-y-1
```

**Icon Container:**
```tailwind
w-12 h-12 
rounded-full 
bg-gradient-to-br from-red-500/30 to-red-600/10 
flex items-center justify-center 
text-red-300 
group-hover:text-red-200 
transition-colors
```

### Section Backgrounds

**Pattern 1 (Alternating):**
```tailwind
bg-gradient-to-b from-[#0B0F19] to-[#0d1221]
```

**Pattern 2:**
```tailwind
bg-gradient-to-b from-[#0d1221] to-[#0B0F19]
```

**CTA Section:**
```tailwind
bg-gradient-to-r from-red-600 via-red-500 to-red-600
```

---

## Spacing System

### Vertical Spacing
```
Hero:                 min-h-[95vh]
Section Padding:      py-20 to py-32
Content Padding:      px-6 lg:px-12
Section Gaps:         gap-6 md:gap-8
```

### Content Container
```
Max Width:            max-w-6xl
Auto Margin:          mx-auto
Responsive Padding:   px-6 lg:px-12
```

---

## Animation Patterns

### Entrance Animations
```javascript
// Fade & Slide Up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}

// Scale In
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.6 }}

// Slide Left
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.6 }}
```

### Scroll Animations
```javascript
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.6, delay: idx * 0.1 }}
```

### Hover Effects
```javascript
// Lift Effect
group-hover:-translate-y-2

// Scale Effect
hover:scale-105 hover:scale-110

// Color Transition
group-hover:text-red-400
group-hover:border-red-500/40
```

---

## Responsive Breakpoints

### Mobile First Approach
- Base (Mobile): 0px
- Small (sm): 640px
- Medium (md): 768px
- Large (lg): 1024px
- XL (xl): 1280px

### Common Responsive Classes Used
```
text-* sm:text-* md:text-* lg:text-*
flex-col sm:flex-row
gap-3 sm:gap-4 md:gap-6
px-4 sm:px-6 lg:px-12
w-full md:max-w-md
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
```

---

## Shadow & Effects

### Drop Shadows
```
drop-shadow-lg      (Large text shadow effect)
drop-shadow-2xl     (Extra large shadow)
```

### Box Shadows
```
shadow-lg           (Light shadow on cards)
shadow-2xl          (Strong shadow on hover)
shadow-red-500/50   (Colored shadow on buttons)
```

### Blur Effects
```
backdrop-blur-sm    (Small background blur)
blur-3xl            (Heavy blur on decorative elements)
```

---

## Utility Classes Reference

### Border Radius
```
rounded-xl    (Border radius 0.75rem)
rounded-2xl   (Border radius 1rem)
rounded-full  (Border radius 50%)
```

### Border Width
```
border      (1px border)
border-2    (2px border)
border-t    (Top border only)
border-b    (Bottom border only)
```

### Transitions
```
transition-all          (All properties)
transition-colors       (Color changes)
transition-transform    (Transform changes)
duration-300            (300ms duration)
```

---

## Best Practices for Home Page

1. **Color Consistency**: Always use the defined color palette
2. **Spacing**: Maintain py-20 to py-32 for sections
3. **Cards**: Use glassmorphic design for consistency
4. **Animations**: Keep animations smooth with appropriate delays
5. **Responsiveness**: Test all breakpoints (mobile, tablet, desktop)
6. **Accessibility**: Maintain good color contrast for readability
7. **Performance**: Use `once: true` in viewport animations for optimization

---

## Design Philosophy

- **Dark Mode Priority**: The page is optimized for dark mode
- **Glassmorphism**: Transparent, frosted-glass aesthetic
- **Motion Design**: Smooth, purposeful animations enhance UX
- **Visual Hierarchy**: Large, bold typography guides attention
- **Consistency**: Repeating design patterns create cohesion
- **Accessibility**: Good contrast and readable typography

