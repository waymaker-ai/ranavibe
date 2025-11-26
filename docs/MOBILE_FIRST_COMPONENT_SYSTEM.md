# RANA Mobile-First Component System

**Version:** 2.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Why Mobile-First?](#why-mobile-first)
3. [Mobile-First Tailwind Configuration](#mobile-first-tailwind-configuration)
4. [Touch-Optimized Components](#touch-optimized-components)
5. [Gesture Handling](#gesture-handling)
6. [Mobile Navigation Patterns](#mobile-navigation-patterns)
7. [Responsive Images](#responsive-images)
8. [PWA Setup](#pwa-setup)
9. [Offline Support](#offline-support)
10. [Mobile Performance](#mobile-performance)
11. [Native Mobile Feel](#native-mobile-feel)
12. [Testing Mobile Components](#testing-mobile-components)
13. [RANA Quality Gates](#aads-quality-gates)

---

## Overview

The RANA Mobile-First Component System ensures your applications feel native on mobile devices while maintaining desktop functionality. This guide provides production-ready components, patterns, and configurations.

### Key Principles

1. **Touch-First**: All interactions optimized for touch (minimum 44px targets)
2. **Performance**: < 3s load time on 3G networks
3. **Offline-Ready**: Service workers and caching strategies
4. **Native Feel**: Gestures, haptics, and smooth animations
5. **Progressive Enhancement**: Mobile-first, desktop-enhanced

---

## Why Mobile-First?

### Market Reality

- **70%** of web traffic is mobile
- **53%** of users abandon sites that take > 3s to load
- **60%** of conversions happen on mobile
- Mobile users expect **native app experience**

### RANA Competitive Advantage

Most frameworks (shadcn/ui, Chakra, MUI) are desktop-first. RANA is mobile-first by default.

**Before RANA:**
- Touch targets too small (< 44px)
- Desktop-optimized components
- Poor mobile performance
- No offline support
- Generic mobile experience

**With RANA:**
- Touch-optimized components (≥ 44px)
- Mobile-first breakpoints
- < 3s load time on 3G
- PWA with offline support
- Native mobile feel

---

## Mobile-First Tailwind Configuration

### Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Mobile-first breakpoints (default breakpoints are good)
    screens: {
      'sm': '640px',   // Small tablets
      'md': '768px',   // Tablets
      'lg': '1024px',  // Laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large desktops
    },
    extend: {
      // Touch-friendly spacing
      spacing: {
        'touch': '44px',  // Minimum touch target
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Mobile-optimized typography
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      // Touch-optimized animations
      animation: {
        'bounce-subtle': 'bounce-subtle 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      // Safe area utilities for notched devices
      colors: {
        // Mobile-optimized color system
        'mobile': {
          'bg': 'rgb(var(--mobile-bg) / <alpha-value>)',
          'surface': 'rgb(var(--mobile-surface) / <alpha-value>)',
          'border': 'rgb(var(--mobile-border) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [
    // Add safe area support
    require('@tailwindcss/container-queries'),
    // Custom plugin for touch utilities
    function({ addUtilities }: any) {
      const newUtilities = {
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.overscroll-none': {
          overscrollBehavior: 'none',
        },
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config;
```

### Global CSS (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Mobile-optimized color variables */
    --mobile-bg: 255 255 255;
    --mobile-surface: 249 250 251;
    --mobile-border: 229 231 235;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --mobile-bg: 17 24 39;
      --mobile-surface: 31 41 55;
      --mobile-border: 55 65 81;
    }
  }

  /* Remove default mobile styles */
  * {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  /* Smooth scrolling on mobile */
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    overscroll-behavior-y: none; /* Prevent pull-to-refresh on custom implementations */
  }

  /* Safe area support */
  @supports (padding: env(safe-area-inset-top)) {
    body {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}

@layer components {
  /* Touch-optimized button */
  .btn-mobile {
    @apply min-h-[44px] min-w-[44px] touch-target tap-highlight-none;
    @apply active:scale-95 transition-transform duration-100;
  }

  /* Mobile card */
  .card-mobile {
    @apply bg-mobile-surface border border-mobile-border rounded-lg;
    @apply shadow-sm active:shadow-md transition-shadow;
  }

  /* Mobile input */
  .input-mobile {
    @apply min-h-[44px] text-base touch-target; /* Prevents iOS zoom on focus */
    @apply rounded-lg border-2 border-mobile-border;
    @apply focus:border-blue-500 focus:outline-none;
  }
}
```

---

## Touch-Optimized Components

### Button Component

```typescript
// components/mobile/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  haptic?: boolean; // Trigger haptic feedback
  loading?: boolean;
}

export function MobileButton({
  children,
  variant = 'primary',
  size = 'md',
  haptic = true,
  loading = false,
  className,
  onClick,
  ...props
}: MobileButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback on mobile
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10); // 10ms subtle vibration
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || props.disabled}
      className={cn(
        // Base styles
        'btn-mobile inline-flex items-center justify-center gap-2',
        'font-medium rounded-xl transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ring-2 focus-visible:ring-offset-2',

        // Size variants
        {
          'px-4 py-2 text-sm min-h-[44px]': size === 'sm',
          'px-6 py-3 text-base min-h-[48px]': size === 'md',
          'px-8 py-4 text-lg min-h-[56px]': size === 'lg',
        },

        // Color variants
        {
          'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400': variant === 'secondary',
          'bg-transparent hover:bg-gray-100 active:bg-gray-200': variant === 'ghost',
        },

        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

### Input Component

```typescript
// components/mobile/Input.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
}

export function MobileInput({
  label,
  error,
  icon,
  clearable = false,
  className,
  value,
  onChange,
  ...props
}: MobileInputProps) {
  const [internalValue, setInternalValue] = useState(value || '');

  const handleClear = () => {
    setInternalValue('');
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };

  const currentValue = value !== undefined ? value : internalValue;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          value={currentValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            'input-mobile w-full px-4',
            icon && 'pl-10',
            clearable && currentValue && 'pr-10',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {clearable && currentValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### Bottom Sheet Component

```typescript
// components/mobile/BottomSheet.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Snap positions as % of viewport height
  defaultSnapPoint?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [90, 50, 25],
  defaultSnapPoint = 1,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY - startY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Calculate snap position
    const dragDistance = currentY;
    const threshold = 50; // Minimum drag distance to snap

    if (dragDistance > threshold && currentSnap < snapPoints.length - 1) {
      // Snap to smaller size
      setCurrentSnap(currentSnap + 1);
    } else if (dragDistance < -threshold && currentSnap > 0) {
      // Snap to larger size
      setCurrentSnap(currentSnap - 1);
    } else if (dragDistance > 150) {
      // Close if dragged down significantly
      onClose();
    }

    setCurrentY(0);
  };

  const height = snapPoints[currentSnap];
  const translateY = isDragging ? Math.max(0, currentY) : 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          isDragging ? 'transition-none' : ''
        )}
        style={{
          height: `${height}vh`,
          transform: `translateY(${translateY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto px-4 pb-safe-bottom">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
```

### Card Component

```typescript
// components/mobile/Card.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean; // Add press effect
  haptic?: boolean;
}

export function MobileCard({
  children,
  interactive = false,
  haptic = true,
  className,
  onClick,
  ...props
}: MobileCardProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <div
      onClick={interactive ? handleClick : onClick}
      className={cn(
        'card-mobile p-4',
        interactive && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

## Gesture Handling

### Swipe Hook

```typescript
// hooks/useSwipe.ts
import { useState, useRef, useEffect } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe
}

export function useSwipe(handlers: SwipeHandlers) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = handlers;

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
```

### Swipeable Card Example

```typescript
// components/mobile/SwipeableCard.tsx
'use client';

import React, { useState } from 'react';
import { useSwipe } from '@/hooks/useSwipe';
import { cn } from '@/lib/utils';

export interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: React.ReactNode; color: string; label: string };
  rightAction?: { icon: React.ReactNode; color: string; label: string };
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        setOffset(-100);
        setTimeout(() => onSwipeLeft(), 300);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        setOffset(100);
        setTimeout(() => onSwipeRight(), 300);
      }
    },
  });

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background actions */}
      {leftAction && (
        <div className={cn(
          'absolute inset-y-0 left-0 w-20 flex items-center justify-center',
          leftAction.color
        )}>
          {leftAction.icon}
        </div>
      )}
      {rightAction && (
        <div className={cn(
          'absolute inset-y-0 right-0 w-20 flex items-center justify-center',
          rightAction.color
        )}>
          {rightAction.icon}
        </div>
      )}

      {/* Card content */}
      <div
        className={cn(
          'relative bg-white transition-transform duration-300',
          isDragging ? 'transition-none' : ''
        )}
        style={{ transform: `translateX(${offset}px)` }}
        {...swipeHandlers}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## Mobile Navigation Patterns

### Bottom Navigation

```typescript
// components/mobile/BottomNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
}

export interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-bottom z-40">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[64px] min-h-[44px] gap-1',
                'transition-colors duration-200',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              <div className="relative">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Mobile Header

```typescript
// components/mobile/MobileHeader.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileHeaderProps {
  title?: string;
  leftAction?: { icon: React.ReactNode; onClick: () => void; label?: string };
  rightAction?: { icon: React.ReactNode; onClick: () => void; label?: string };
  transparent?: boolean;
}

export function MobileHeader({
  title,
  leftAction,
  rightAction,
  transparent = false,
}: MobileHeaderProps) {
  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 pt-safe-top',
      transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left action */}
        <div className="w-12">
          {leftAction && (
            <button
              onClick={leftAction.onClick}
              className="touch-target flex items-center justify-center -ml-2"
              aria-label={leftAction.label}
            >
              {leftAction.icon}
            </button>
          )}
        </div>

        {/* Title */}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center">
            {title}
          </h1>
        )}

        {/* Right action */}
        <div className="w-12">
          {rightAction && (
            <button
              onClick={rightAction.onClick}
              className="touch-target flex items-center justify-center -mr-2 ml-auto"
              aria-label={rightAction.label}
            >
              {rightAction.icon}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Pull-to-Refresh

```typescript
// components/mobile/PullToRefresh.tsx
'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number; // Distance to trigger refresh
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start pull if at top of scroll
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    // Apply resistance (diminishing returns)
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(resistedDistance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const rotation = (pullDistance / threshold) * 360;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'transition-all duration-200 ease-out',
          isRefreshing ? 'h-16' : 'h-0'
        )}
        style={{ transform: `translateY(${isPulling ? pullDistance : 0}px)` }}
      >
        <div className="flex items-center gap-2 text-gray-600">
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Refreshing...</span>
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5 transition-transform"
                style={{ transform: `rotate(${rotation}deg)` }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">
                {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${isPulling ? pullDistance : 0}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## Responsive Images

### Next.js Image Component Usage

```typescript
// components/mobile/ResponsiveImage.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/4';
}

export function ResponsiveImage({
  src,
  alt,
  priority = false,
  className,
  aspectRatio = '16/9',
}: ResponsiveImageProps) {
  const aspectRatioMap = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-4/3',
    '1/1': 'aspect-square',
    '3/4': 'aspect-3/4',
  };

  return (
    <div className={cn('relative w-full overflow-hidden', aspectRatioMap[aspectRatio], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={priority}
        className="object-cover"
        quality={85} // Balance quality and performance
      />
    </div>
  );
}
```

### Lazy Loading Images

```typescript
// components/mobile/LazyImage.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string; // Base64 or blur hash
  className?: string;
}

export function LazyImage({ src, alt, placeholder, className }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Start loading 50px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('relative overflow-hidden bg-gray-200', className)}>
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder || ''}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
```

---

## PWA Setup

### Web App Manifest (`public/manifest.json`)

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/home-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["productivity", "utilities"],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### Add to HTML (`app/layout.tsx`)

```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover', // For safe area support
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Your App',
  },
};
```

---

## Offline Support

### Service Worker (`public/sw.js`)

```javascript
const CACHE_NAME = 'app-v1';
const RUNTIME_CACHE = 'runtime-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Page requests - network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

### Register Service Worker (`app/register-sw.ts`)

```typescript
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}
```

### Offline Page (`app/offline/page.tsx`)

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
        <p className="text-gray-600 mb-6">
          Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-mobile px-6 py-3 bg-blue-600 text-white rounded-xl"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## Mobile Performance

### Performance Monitoring Hook

```typescript
// hooks/usePerformanceMonitor.ts
import { useEffect } from 'react';

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const metrics: Partial<PerformanceMetrics> = {};

    // Measure Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
        }

        if (entry.entryType === 'largest-contentful-paint') {
          metrics.lcp = entry.startTime;
        }

        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        }

        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          metrics.cls = (metrics.cls || 0) + (entry as any).value;
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Measure TTFB
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // Send metrics after page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('Performance Metrics:', metrics);

        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            fcp: metrics.fcp,
            lcp: metrics.lcp,
            fid: metrics.fid,
            cls: metrics.cls,
            ttfb: metrics.ttfb,
          });
        }
      }, 0);
    });

    return () => observer.disconnect();
  }, []);
}
```

### Code Splitting Example

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false, // Don't render on server
});

const HeavyMap = dynamic(() => import('@/components/HeavyMap'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
  ssr: false,
});

export default function HomePage() {
  return (
    <div className="space-y-4 p-4">
      <h1>Dashboard</h1>

      {/* These only load when visible */}
      <HeavyChart />
      <HeavyMap />
    </div>
  );
}
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback font while loading
  variable: '--font-inter',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## Native Mobile Feel

### Haptic Feedback Utility

```typescript
// lib/haptics.ts
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
};

export function triggerHaptic(pattern: HapticPattern = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  const vibrationPattern = hapticPatterns[pattern];
  navigator.vibrate(vibrationPattern);
}

// React hook
export function useHaptic() {
  const haptic = (pattern: HapticPattern = 'light') => {
    triggerHaptic(pattern);
  };

  return { haptic, triggerHaptic };
}
```

### Smooth Scrolling Hook

```typescript
// hooks/useSmoothScroll.ts
export function useSmoothScroll() {
  const scrollTo = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const y = element.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: y,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return { scrollTo, scrollToTop };
}
```

### Native-Feel Loading

```typescript
// components/mobile/NativeLoader.tsx
export function NativeLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          {/* iOS-style spinner */}
          <svg className="animate-spin" viewBox="0 0 50 50">
            <circle
              className="stroke-current text-blue-600"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80, 200"
              strokeDashoffset="0"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
```

---

## Testing Mobile Components

### Mobile Test Utilities

```typescript
// lib/test-utils/mobile.ts
import { fireEvent } from '@testing-library/react';

export function createTouchEvent(type: 'touchstart' | 'touchmove' | 'touchend', x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  };
}

export function simulateSwipe(
  element: HTMLElement,
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 100
) {
  const startX = direction === 'right' ? 0 : direction === 'left' ? distance : 50;
  const startY = direction === 'down' ? 0 : direction === 'up' ? distance : 50;
  const endX = direction === 'right' ? distance : direction === 'left' ? 0 : 50;
  const endY = direction === 'down' ? distance : direction === 'up' ? 0 : 50;

  fireEvent.touchStart(element, createTouchEvent('touchstart', startX, startY));
  fireEvent.touchMove(element, createTouchEvent('touchmove', endX, endY));
  fireEvent.touchEnd(element, createTouchEvent('touchend', endX, endY));
}

export function simulateTap(element: HTMLElement) {
  fireEvent.touchStart(element, createTouchEvent('touchstart', 50, 50));
  fireEvent.touchEnd(element, createTouchEvent('touchend', 50, 50));
}
```

### Component Test Example

```typescript
// components/mobile/__tests__/SwipeableCard.test.tsx
import { render, screen } from '@testing-library/react';
import { simulateSwipe } from '@/lib/test-utils/mobile';
import { SwipeableCard } from '../SwipeableCard';

describe('SwipeableCard', () => {
  it('should call onSwipeLeft when swiped left', () => {
    const onSwipeLeft = jest.fn();

    render(
      <SwipeableCard onSwipeLeft={onSwipeLeft}>
        <div>Test Content</div>
      </SwipeableCard>
    );

    const card = screen.getByText('Test Content').parentElement!;
    simulateSwipe(card, 'left', 100);

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('should call onSwipeRight when swiped right', () => {
    const onSwipeRight = jest.fn();

    render(
      <SwipeableCard onSwipeRight={onSwipeRight}>
        <div>Test Content</div>
      </SwipeableCard>
    );

    const card = screen.getByText('Test Content').parentElement!;
    simulateSwipe(card, 'right', 100);

    expect(onSwipeRight).toHaveBeenCalled();
  });
});
```

---

## RANA Quality Gates

### Mobile Checklist

```yaml
# .rana.yml - Mobile Quality Gates

mobile:
  enabled: true

  touch_targets:
    enabled: true
    min_size: 44 # Minimum 44px for accessibility

  performance:
    enabled: true
    metrics:
      fcp_threshold: 1800 # First Contentful Paint < 1.8s
      lcp_threshold: 2500 # Largest Contentful Paint < 2.5s
      fid_threshold: 100  # First Input Delay < 100ms
      cls_threshold: 0.1  # Cumulative Layout Shift < 0.1

  pwa:
    enabled: true
    require_manifest: true
    require_service_worker: true
    require_offline_page: true

  gestures:
    enabled: true
    require_swipe_support: true
    require_haptic_feedback: true

  responsive:
    enabled: true
    breakpoints:
      - 320  # Small mobile
      - 375  # Medium mobile
      - 414  # Large mobile
      - 768  # Tablet
      - 1024 # Desktop
```

### Mobile Validation Script

```typescript
// scripts/validate-mobile.ts
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  component: string;
  issues: string[];
  passed: boolean;
}

function validateTouchTargets(componentPath: string): ValidationResult {
  const content = fs.readFileSync(componentPath, 'utf-8');
  const issues: string[] = [];

  // Check for touch-target class or min-h-[44px]
  if (!content.includes('touch-target') && !content.includes('min-h-[44')) {
    issues.push('Missing touch-target class or min-h-[44px]');
  }

  // Check for tap-highlight-none
  if (content.includes('button') && !content.includes('tap-highlight-none')) {
    issues.push('Missing tap-highlight-none on interactive elements');
  }

  return {
    component: path.basename(componentPath),
    issues,
    passed: issues.length === 0,
  };
}

function validateMobileComponents() {
  const componentsDir = path.join(process.cwd(), 'components', 'mobile');

  if (!fs.existsSync(componentsDir)) {
    console.log('⚠️  No mobile components directory found');
    return;
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
  const results: ValidationResult[] = [];

  for (const file of files) {
    const filePath = path.join(componentsDir, file);
    const result = validateTouchTargets(filePath);
    results.push(result);
  }

  // Report
  console.log('\n📱 Mobile Component Validation\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.component}`);
    } else {
      console.log(`❌ ${result.component}`);
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
  });

  console.log(`\nPassed: ${passed}/${total}`);

  if (passed < total) {
    process.exit(1);
  }
}

validateMobileComponents();
```

---

## Complete Mobile Setup

### 1. Install Dependencies

```bash
npm install @tailwindcss/container-queries
npm install -D @testing-library/react @testing-library/jest-dom
```

### 2. Configure Tailwind (see above)

### 3. Create Mobile Components

```bash
mkdir -p components/mobile
# Copy components from this guide
```

### 4. Add to package.json

```json
{
  "scripts": {
    "validate:mobile": "tsx scripts/validate-mobile.ts",
    "test:mobile": "jest --testPathPattern=mobile"
  }
}
```

### 5. Test on Real Devices

```bash
# Use ngrok or similar to test on mobile
npm run dev
# Then use Chrome DevTools Remote Debugging or Safari Web Inspector
```

---

## Summary

The RANA Mobile-First Component System provides:

1. ✅ **Touch-optimized components** (≥ 44px targets)
2. ✅ **Native gestures** (swipe, pull-to-refresh, haptics)
3. ✅ **Mobile navigation** (bottom nav, headers, sheets)
4. ✅ **PWA support** (offline, installable)
5. ✅ **Performance optimization** (< 3s load time)
6. ✅ **Responsive images** (lazy loading, optimization)
7. ✅ **Native feel** (smooth animations, haptics)
8. ✅ **Quality gates** (automated validation)

### Before RANA Mobile

- Desktop-first approach
- Touch targets < 44px
- No offline support
- Generic mobile UX
- Poor performance on 3G

### With RANA Mobile

- Mobile-first by default
- Touch-optimized (≥ 44px)
- PWA with offline support
- Native-like experience
- < 3s load time on 3G

---

**Ready to ship mobile-first apps!** 🚀

*Ashley Kays | Waymaker | RANA v2.0*
