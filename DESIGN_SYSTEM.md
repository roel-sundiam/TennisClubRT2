# Tennis Club RT2 Design System

## Overview
This document outlines the modern, professional design system implemented for the Tennis Club RT2 application. The design follows a senior-friendly approach with enhanced accessibility, mobile-first responsive design, and modern UI patterns.

## Core Design Principles

### 1. **Senior-Friendly Design**
- **Large touch targets** (minimum 48px for interactive elements)
- **High contrast colors** for excellent readability
- **Clear typography** with readable font sizes (16px+ base)
- **Simple navigation patterns** with clear visual hierarchy
- **Consistent spacing** and predictable layouts

### 2. **Mobile-First Responsive**
- **Progressive enhancement** from mobile to desktop
- **Touch-optimized interactions** with proper spacing
- **Responsive breakpoints**: 
  - Mobile: ≤768px
  - Tablet: 769px-1024px
  - Desktop: >1024px

### 3. **Modern Professional Aesthetics**
- **Glassmorphism effects** with backdrop blur and transparency
- **Subtle animations** and micro-interactions
- **Professional color palette** with blue primary tones
- **Clean, minimal design** without clutter

## Color System

### Primary Colors
```scss
// Main blue gradient for toolbar
$primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);

// Background gradient for pages
$background-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);

// Text colors
$text-primary: #1a202c;
$text-secondary: #4a5568;
$text-muted: #718096;
$text-white: #ffffff;
$text-white-secondary: rgba(255, 255, 255, 0.9);
$text-white-muted: rgba(255, 255, 255, 0.8);
```

### Semantic Colors
```scss
// Success
$success: #4CAF50;
$success-light: rgba(76, 175, 80, 0.1);

// Warning
$warning: #FF9800;
$warning-light: rgba(255, 152, 0, 0.1);

// Error/Danger
$error: #e53e3e;
$error-light: rgba(229, 62, 62, 0.1);

// Admin
$admin: #d32f2f;
$admin-light: rgba(211, 47, 47, 0.1);
```

## Layout System

### Container Widths
```scss
$container-max-width: 1400px;
$container-sm: 768px;
$container-padding: 2rem;
$container-padding-mobile: 1rem;
```

### Spacing Scale
```scss
$spacing: (
  xs: 0.25rem,  // 4px
  sm: 0.5rem,   // 8px
  md: 0.75rem,  // 12px
  lg: 1rem,     // 16px
  xl: 1.5rem,   // 24px
  2xl: 2rem,    // 32px
  3xl: 3rem,    // 48px
  4xl: 4rem     // 64px
);
```

## Typography

### Font Stack
```scss
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Font Sizes
```scss
$font-sizes: (
  xs: 0.75rem,    // 12px
  sm: 0.875rem,   // 14px
  base: 1rem,     // 16px
  lg: 1.125rem,   // 18px
  xl: 1.25rem,    // 20px
  2xl: 1.375rem,  // 22px
  3xl: 1.75rem,   // 28px
  4xl: 2.25rem    // 36px
);
```

### Font Weights
```scss
$font-weights: (
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
);
```

## Component Architecture

### 1. **Persistent Toolbar** 🔥 **ALWAYS VISIBLE ON ALL PAGES**

The modern toolbar is **ALWAYS present** across all pages in the application and includes:

```scss
.modern-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  color: white;
  min-height: 70px;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}
```

#### Toolbar Elements:
- **Logo Section**: Tennis icon + club name + tagline
- **Desktop Navigation**: Horizontal nav items (hidden on mobile)
- **User Section**: Notifications + coin balance + user avatar menu
- **Mobile Menu**: Hamburger button for mobile navigation

### 2. **Mobile Navigation Menu**

```scss
.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  backdrop-filter: blur(20px);
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1001;
}
```

### 3. **Action Cards**

```scss
.action-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-height: 240px;
}
```

#### Card Hover Effects:
```scss
.action-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
```

## Responsive Breakpoints

### Mobile (≤768px)
```scss
@media (max-width: 768px) {
  .modern-header {
    min-height: 64px;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .mobile-menu-trigger {
    display: inline-flex;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

### Tablet (769px-1024px)
```scss
@media (max-width: 1024px) {
  .desktop-nav {
    display: none;
  }
  
  .mobile-menu-trigger {
    display: inline-flex;
  }
}
```

### Desktop (>1024px)
```scss
@media (min-width: 1025px) {
  .desktop-nav {
    display: flex;
  }
  
  .mobile-menu-trigger {
    display: none;
  }
}
```

## Animation System

### Transitions
```scss
$transitions: (
  fast: 0.2s ease,
  normal: 0.3s ease,
  slow: 0.4s ease,
  bounce: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)
);
```

### Key Animations
```scss
// Card entrance animation
@keyframes cardSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Logo glow effect
@keyframes logoGlow {
  0% { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); }
  100% { filter: drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3)); }
}
```

## Accessibility Features

### Focus Management
```scss
button:focus,
.user-avatar-button:focus,
.mobile-menu-trigger:focus {
  outline: 3px solid #3182ce;
  outline-offset: 2px;
}
```

### High Contrast Mode
```scss
@media (prefers-contrast: high) {
  .dashboard-container {
    background: #000;
  }
  
  .modern-header {
    background: rgba(255, 255, 255, 1);
    border-bottom: 2px solid #000;
  }
}
```

### Touch Targets
- **Minimum size**: 48px × 48px
- **Spacing**: 8px minimum between interactive elements
- **Hover states**: Clear visual feedback for all interactive elements

## Page Structure Template

### Standard Page Layout
```html
<div class="page-container">
  <!-- Toolbar is automatically present -->
  
  <!-- Page Content -->
  <div class="page-content">
    <!-- Alert Components (if needed) -->
    <app-payment-alerts></app-payment-alerts>
    <app-coin-balance-alerts></app-coin-balance-alerts>
    
    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Page-specific content -->
    </div>
  </div>
</div>
```

### Page Content Styling
```scss
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.content-wrapper {
  // Page-specific styles
}
```

## Component Library

### Button Styles
```scss
// Primary button
.btn-primary {
  background: linear-gradient(135deg, #3182ce, #667eea);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

// Secondary button
.btn-secondary {
  background: transparent;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
```

### Form Elements
```scss
.form-field {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Implementation Guidelines

### 1. **Page Creation Checklist**
- [ ] Include persistent toolbar (automatically present)
- [ ] Use standard page container structure
- [ ] Apply responsive breakpoints
- [ ] Implement proper focus management
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify accessibility features

### 2. **Component Standards**
- [ ] Follow spacing scale consistently
- [ ] Use semantic color variables
- [ ] Implement hover states for interactive elements
- [ ] Add loading states where appropriate
- [ ] Include error handling UI

### 3. **Mobile Optimization**
- [ ] Test touch interactions
- [ ] Verify readable font sizes
- [ ] Ensure adequate spacing between elements
- [ ] Test landscape and portrait orientations
- [ ] Optimize for various screen sizes

## Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Features used**: CSS Grid, Flexbox, backdrop-filter, CSS custom properties

## Performance Considerations

- **CSS**: Optimized with minimal specificity conflicts
- **Animations**: Use transform and opacity for smooth performance
- **Images**: Lazy loading implementation recommended
- **Bundle size**: Components are tree-shakeable and modular

---

## Quick Reference

### Key Classes
- `.modern-header` - Main toolbar (always visible)
- `.page-container` - Page wrapper with background
- `.page-content` - Content container with max-width
- `.action-card` - Standard card component
- `.mobile-nav` - Mobile navigation menu
- `.btn-primary` - Primary button style
- `.form-input` - Standard form input

### Important Notes
- **🔥 Toolbar is ALWAYS visible** across all pages
- **Mobile-first approach** for all new components
- **Test accessibility** features during development
- **Follow spacing scale** for consistent layouts
- **Use semantic colors** from the design system

This design system ensures consistency, accessibility, and modern aesthetics across the entire Tennis Club RT2 application.