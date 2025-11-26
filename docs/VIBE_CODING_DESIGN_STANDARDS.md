# Vibe Coding Design Standards for RANA

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

"Vibe coding" refers to rapidly building UIs with AI assistance (v0.dev, Claude, etc.). This guide ensures vibe-coded projects maintain visual distinctiveness, avoid generic "AI-generated" aesthetics, and follow design best practices.

**The Problem:** AI tools often produce homogeneous designs that look identical across projects, lack brand personality, and use predictable patterns.

**The Solution:** Strategic customization, design system ownership, and deliberate differentiation while maintaining speed.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Avoiding Generic AI Aesthetics](#avoiding-generic-ai-aesthetics)
3. [Component Library Strategy](#component-library-strategy)
4. [Design System Customization](#design-system-customization)
5. [Visual Distinctiveness Patterns](#visual-distinctiveness-patterns)
6. [Advanced UI Techniques](#advanced-ui-techniques)
7. [RANA Quality Gates for Design](#aads-quality-gates-for-design)
8. [Examples & Templates](#examples--templates)

---

## Core Principles

### 1. AI as Accelerator, Not Designer

```
❌ WRONG: "Build me a dashboard" → Accept AI output as-is
✅ RIGHT: "Build me a dashboard" → Customize with brand identity
```

**Mindset:** AI handles boilerplate. You handle differentiation.

### 2. Own Your Design System

```yaml
# .rana.yml design configuration
standards:
  design_system:
    enabled: true
    path: "docs/DESIGN_SYSTEM.md"
    components_library: "@/components/design-system"

    # Ownership principles
    ownership:
      - copy_dont_import        # Copy components, don't npm install
      - customize_extensively   # Make it yours
      - document_patterns       # Create your own system
      - version_control         # Track design evolution
```

### 3. Strategic Customization Layers

```
Layer 1: Foundation (Tailwind config, colors, typography)
         ↓
Layer 2: Components (shadcn/ui customized)
         ↓
Layer 3: Compositions (Unique layouts and patterns)
         ↓
Layer 4: Brand Polish (Animations, micro-interactions, voice)
```

### 4. Design Debt is Technical Debt

- Track design consistency issues like bugs
- Refactor generic components into branded ones
- Regular design reviews in code reviews

---

## Avoiding Generic AI Aesthetics

### Common AI-Generated Patterns to Avoid

#### ❌ Generic Pattern 1: Default shadcn/ui

```tsx
// ❌ This looks like every AI-generated app
<Card>
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Welcome to your dashboard</p>
  </CardContent>
</Card>
```

#### ✅ Customized Alternative

```tsx
// ✅ Branded, distinctive
<BrandCard
  variant="gradient-border"
  glowEffect
  className="backdrop-blur-sm"
>
  <CardHeader className="relative">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
    <CardTitle className="relative z-10 font-display text-2xl">
      Dashboard
    </CardTitle>
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground leading-relaxed">
      Welcome to your dashboard
    </p>
  </CardContent>
</BrandCard>
```

#### ❌ Generic Pattern 2: Basic Button Styles

```tsx
// ❌ Default Tailwind buttons everyone uses
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

#### ✅ Distinctive Alternative

```tsx
// ✅ Custom design system button
<Button
  variant="primary"
  size="lg"
  className="group relative overflow-hidden"
>
  <span className="relative z-10 flex items-center gap-2">
    Click me
    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
  </span>
  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-600 transition-transform group-hover:scale-105" />
  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
</Button>
```

#### ❌ Generic Pattern 3: Standard Grid Layouts

```tsx
// ❌ Everyone's using this exact grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

#### ✅ Dynamic Alternative

```tsx
// ✅ Masonry or asymmetric layouts
<div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
  {items.map((item, i) => (
    <Card
      key={item.id}
      className={cn(
        "break-inside-avoid mb-4 transition-all hover:scale-[1.02]",
        i % 3 === 0 && "md:col-span-2", // Featured items
      )}
    >
      {item.name}
    </Card>
  ))}
</div>
```

### The "Obviously AI-Generated" Checklist

If your UI has 3+ of these, it needs customization:

- [ ] Using default shadcn/ui components without modification
- [ ] Generic gradient backgrounds (purple-to-blue, etc.)
- [ ] Standard card grids with no variation
- [ ] Default Inter/Geist font without alternatives
- [ ] No custom animations or micro-interactions
- [ ] Predictable layouts (hero → features → pricing → CTA)
- [ ] Stock illustrations/icons with no customization
- [ ] Generic color schemes (slate, zinc, gray)

---

## Component Library Strategy

### Pattern 1: Copy-Paste with Ownership

```bash
# ✅ GOOD: Copy and customize
npx shadcn-ui@latest add button
# Now you own it - customize extensively

# ❌ BAD: Install as dependency
npm install @some-ui-library
# You don't own it - harder to customize
```

### Pattern 2: Three-Tier Component Architecture

```
Tier 1: Primitives (shadcn/ui base)
├── button.tsx
├── input.tsx
├── card.tsx
└── ...

Tier 2: Design System (Your branded components)
├── BrandButton.tsx      (Extends button with your style)
├── BrandInput.tsx       (Your form styling)
├── BrandCard.tsx        (Your card variants)
└── ...

Tier 3: Compositions (Feature-specific)
├── DashboardCard.tsx    (Combines multiple Tier 2)
├── FeatureGrid.tsx      (Complex layouts)
└── ...
```

### Pattern 3: Design System as Code

```typescript
// components/design-system/index.ts

/**
 * ✅ RANA: Design System Compliance
 *
 * All app components MUST import from this file.
 * Never import shadcn components directly.
 */

// Primitives (from shadcn/ui but exported through our system)
export { Button } from './primitives/button';
export { Input } from './primitives/input';
export { Card, CardHeader, CardContent } from './primitives/card';

// Branded components (our customizations)
export { BrandButton } from './brand/BrandButton';
export { BrandCard } from './brand/BrandCard';
export { GradientButton } from './brand/GradientButton';
export { AnimatedCard } from './brand/AnimatedCard';

// Compositions (feature components)
export { DashboardCard } from './compositions/DashboardCard';
export { FeatureGrid } from './compositions/FeatureGrid';
export { HeroSection } from './compositions/HeroSection';

// Design tokens
export { colors, typography, spacing, animations } from './tokens';
```

---

## Design System Customization

### Level 1: Tailwind Configuration

```typescript
// tailwind.config.ts - Make it YOURS
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // ✅ CUSTOM COLORS (not default slate/zinc)
      colors: {
        // Your brand colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... your specific palette
          950: '#0c1e3d',
        },
        // Semantic colors mapped to your brand
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          // ... custom scale
        },
      },

      // ✅ CUSTOM TYPOGRAPHY
      fontFamily: {
        // Not just Inter - make it unique
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },

      // ✅ CUSTOM ANIMATIONS
      animation: {
        // Beyond fade-in
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },

      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      // ✅ CUSTOM SPACING SCALE
      spacing: {
        // Add your own rhythm
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ✅ CUSTOM BORDER RADIUS
      borderRadius: {
        // Your brand's border style
        'brand': '0.75rem',
        '4xl': '2rem',
      },

      // ✅ CUSTOM SHADOWS
      boxShadow: {
        'brand': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'brand-lg': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'inner-brand': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    // Custom plugin for brand utilities
    function ({ addUtilities }) {
      addUtilities({
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    },
  ],
};

export default config;
```

### Level 2: CSS Variables & Themes

```css
/* globals.css - Your brand's DNA */

@layer base {
  :root {
    /* ✅ BRAND COLORS (not default slate) */
    --primary: 220 90% 56%;
    --primary-foreground: 0 0% 100%;

    /* ✅ CUSTOM GRADIENTS */
    --gradient-brand: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-accent: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

    /* ✅ CUSTOM SPACING RHYTHM */
    --spacing-unit: 0.25rem;
    --spacing-section: calc(var(--spacing-unit) * 24); /* 6rem */

    /* ✅ TYPOGRAPHY SCALE */
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;
    --font-size-5xl: 3rem;

    /* ✅ ANIMATION SPEEDS */
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;

    /* ✅ ELEVATION (shadows) */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  }

  .dark {
    /* Dark mode customizations */
    --primary: 220 90% 60%;
    /* ... */
  }
}

@layer components {
  /* ✅ BRANDED UTILITIES */
  .gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent;
  }

  .glass-card {
    @apply bg-white/5 backdrop-blur-md border border-white/10;
  }

  .hover-lift {
    @apply transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl;
  }
}
```

### Level 3: Component Variants

```typescript
// components/design-system/brand/BrandButton.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // ✅ NOT JUST "default" - make it unique
        primary: 'bg-gradient-to-r from-primary to-primary-600 text-white hover:shadow-lg hover:scale-105',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',

        // ✅ CUSTOM BRANDED VARIANTS
        gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-2xl hover:shadow-purple-500/50',
        glass: 'glass-card hover:bg-white/10',
        glow: 'bg-primary text-white shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/75',
        animated: 'group relative overflow-hidden bg-primary text-white',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
    },
  }
);

interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function BrandButton({
  className,
  variant,
  size,
  rounded,
  isLoading,
  icon,
  children,
  ...props
}: BrandButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {variant === 'animated' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          <span className="relative z-10 flex items-center gap-2">
            {icon}
            {children}
          </span>
        </>
      )}
      {variant !== 'animated' && (
        <>
          {isLoading && <Spinner className="mr-2" />}
          {!isLoading && icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
```

---

## Visual Distinctiveness Patterns

### Pattern 1: Custom Color Palettes

```typescript
// lib/colors.ts - NEVER use default colors
export const brandColors = {
  // ✅ CUSTOM PALETTE (not slate/zinc/gray)
  // Generated from your brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // ✅ ACCENT COLORS (complementary)
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    // ... complementary palette
  },

  // ✅ SEMANTIC COLORS
  success: {
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },
  warning: {
    light: '#f59e0b',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
};

// ✅ GRADIENTS
export const brandGradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  accent: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ocean: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
};
```

### Pattern 2: Typography Hierarchy

```typescript
// app/layout.tsx
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';

// ✅ UNIQUE FONT COMBINATIONS (not just Inter)
const displayFont = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '700', '900'],
});

const bodyFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
```

```css
/* Typography usage */
.heading-display {
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.heading-primary {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.body-text {
  font-family: var(--font-body);
  line-height: 1.7;
}

.code-block {
  font-family: var(--font-mono);
  font-size: 0.875em;
}
```

### Pattern 3: Micro-Interactions

```tsx
// components/brand/AnimatedCard.tsx
import { motion } from 'framer-motion';

export function AnimatedCard({ children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ✅ USAGE
<AnimatedCard className="p-6 bg-white rounded-lg">
  <h3>Feature Title</h3>
  <p>Feature description</p>
</AnimatedCard>
```

### Pattern 4: Custom Illustrations/Icons

```tsx
// components/brand/BrandIcon.tsx

/**
 * ✅ CUSTOM ICONS (not just Lucide/Heroicons)
 * Combine libraries or create custom SVGs
 */

export function BrandIcon({ name, className, ...props }) {
  const icons = {
    // Custom SVG icons matching your brand
    custom: (
      <svg viewBox="0 0 24 24" className={className} {...props}>
        {/* Your custom paths */}
      </svg>
    ),
    // Combine with icon libraries
    feature: (
      <div className="relative">
        <Sparkles className={cn("text-primary", className)} />
        <div className="absolute inset-0 bg-primary/20 blur-xl" />
      </div>
    ),
  };

  return icons[name] || null;
}
```

---

## Advanced UI Techniques

### Technique 1: Glassmorphism

```tsx
// components/brand/GlassCard.tsx
export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        // Glass effect
        'bg-white/10 backdrop-blur-md',
        // Border with gradient
        'border border-white/20',
        // Shadow
        'shadow-xl',
        // Hover effect
        'transition-all hover:bg-white/15',
        className
      )}
      {...props}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
```

### Technique 2: Gradient Borders

```tsx
// components/brand/GradientBorder.tsx
export function GradientBorder({ children, className }) {
  return (
    <div className="relative p-[1px] rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
      <div className={cn('bg-white dark:bg-gray-900 rounded-lg', className)}>
        {children}
      </div>
    </div>
  );
}
```

### Technique 3: Animated Gradients

```tsx
// components/brand/AnimatedGradient.tsx
export function AnimatedGradient({ children, className }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-gradient" />
      <div className={cn('relative z-10', className)}>
        {children}
      </div>
    </div>
  );
}

// Add to tailwind.config.ts
animation: {
  gradient: 'gradient 3s ease infinite',
},
keyframes: {
  gradient: {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
}
```

### Technique 4: Particle Effects

```tsx
// components/brand/ParticleBackground.tsx
import { useEffect, useRef } from 'react';

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Particle system implementation
    const particles: Array<{x: number; y: number; vx: number; vy: number}> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={1920}
      height={1080}
    />
  );
}
```

---

## RANA Quality Gates for Design

### Design Quality Gates

Add to `.rana.yml`:

```yaml
quality_gates:
  design_implementation:
    # Design System
    - design_system_compliance     # All components from design system
    - no_inline_styles            # Use Tailwind classes or CSS modules
    - consistent_spacing          # Follow spacing scale
    - consistent_typography       # Follow type scale

    # Visual Polish
    - animations_present          # Micro-interactions implemented
    - loading_states_styled       # Beautiful loading states
    - error_states_styled         # Clear error messaging
    - empty_states_designed       # Empty state illustrations

    # Accessibility
    - color_contrast_aaa          # WCAG AAA contrast ratios
    - focus_states_visible        # Clear focus indicators
    - aria_labels_present         # Screen reader support
    - keyboard_navigation         # Full keyboard support

    # Responsiveness
    - mobile_first_design         # Mobile-optimized first
    - tablet_breakpoint_tested    # Tested at tablet sizes
    - desktop_breakpoint_tested   # Tested at desktop sizes
    - touch_targets_sized         # Minimum 44px touch targets

    # Brand Consistency
    - custom_color_palette        # Not default Tailwind colors
    - unique_typography           # Custom font combinations
    - branded_components          # Not stock components
    - visual_distinctiveness      # Doesn't look generic

  design_review:
    - no_default_components       # All shadcn components customized
    - animations_smooth           # 60fps animations
    - images_optimized            # Next/Image for all images
    - fonts_optimized             # Font loading optimized
    - layout_shifts_minimal       # CLS score < 0.1
```

### Design Checklist

```markdown
## Design Implementation

### Setup
- [ ] Custom Tailwind config created
- [ ] Brand colors defined
- [ ] Typography scale configured
- [ ] Animation keyframes added
- [ ] Design system documented

### Components
- [ ] All shadcn components copied (not installed)
- [ ] Components customized with brand styles
- [ ] Variants created for different use cases
- [ ] Animations added to interactive elements
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented

### Visual Polish
- [ ] Consistent spacing throughout
- [ ] Consistent typography hierarchy
- [ ] Smooth transitions (300ms default)
- [ ] Hover states on interactive elements
- [ ] Focus states clearly visible
- [ ] Loading indicators match brand
- [ ] Error messages styled and helpful

### Accessibility
- [ ] Color contrast meets WCAG AAA
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Touch targets are 44px minimum

### Responsiveness
- [ ] Mobile layout tested (320px+)
- [ ] Tablet layout tested (768px+)
- [ ] Desktop layout tested (1024px+)
- [ ] Large desktop tested (1440px+)
- [ ] Touch interactions work
- [ ] No horizontal scroll

### Brand Distinctiveness
- [ ] Doesn't look like default shadcn
- [ ] Custom color palette used
- [ ] Unique typography combination
- [ ] Custom animations present
- [ ] Branded micro-interactions
- [ ] Visual style is distinctive
```

---

## Examples & Templates

### Example 1: Branded Card Component

```tsx
// components/design-system/brand/BrandCard.tsx
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BrandCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'bordered';
  glowEffect?: boolean;
  animateOnHover?: boolean;
}

export function BrandCard({
  children,
  variant = 'default',
  glowEffect = false,
  animateOnHover = true,
  className,
  ...props
}: BrandCardProps) {
  const variants = {
    default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
    gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20',
    bordered: 'bg-white dark:bg-gray-900 border-2 border-primary',
  };

  const Component = animateOnHover ? motion.div : 'div';
  const animationProps = animateOnHover ? {
    whileHover: { scale: 1.02, y: -4 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  } : {};

  return (
    <Component
      className={cn(
        'rounded-xl p-6 transition-all',
        variants[variant],
        glowEffect && 'shadow-lg shadow-primary/20',
        className
      )}
      {...animationProps}
      {...props}
    >
      {glowEffect && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
}

// Usage
<BrandCard variant="gradient" glowEffect>
  <h3 className="text-2xl font-display font-bold mb-2">Feature Title</h3>
  <p className="text-muted-foreground">Feature description with brand styling</p>
</BrandCard>
```

### Example 2: Animated Hero Section

```tsx
// components/compositions/HeroSection.tsx
import { motion } from 'framer-motion';
import { BrandButton } from '@/components/design-system';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950 dark:via-gray-900 dark:to-pink-950" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-purple-200 mb-8"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">
            Introducing our new platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-7xl lg:text-8xl font-display font-black mb-6 leading-tight"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Build Amazing
          </span>
          <br />
          Products Faster
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          The production-ready platform for shipping features fast without
          sacrificing quality or design.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <BrandButton
            variant="animated"
            size="xl"
            className="group"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </BrandButton>

          <BrandButton variant="ghost" size="xl">
            View Demo
          </BrandButton>
        </motion.div>
      </div>
    </section>
  );
}
```

### Example 3: Design System Documentation

```markdown
<!-- docs/DESIGN_SYSTEM.md -->

# Design System

## Brand Colors

### Primary Palette
- `primary-50` through `primary-950`: Main brand colors
- Use for: Primary actions, brand elements, headers

### Accent Palette
- `accent-50` through `accent-950`: Complementary colors
- Use for: Highlights, secondary actions, CTAs

### Semantic Colors
- `success`: Green tones for positive actions
- `warning`: Amber tones for warnings
- `error`: Red tones for errors
- `info`: Blue tones for information

## Typography

### Font Families
- **Display**: Playfair Display (headings, hero text)
- **Body**: Inter (body text, UI)
- **Mono**: JetBrains Mono (code, technical content)

### Type Scale
```tsx
<h1 className="text-5xl font-display font-black">Hero Heading</h1>
<h2 className="text-4xl font-display font-bold">Section Heading</h2>
<h3 className="text-2xl font-display font-semibold">Subsection</h3>
<p className="text-base font-body">Body text</p>
<code className="text-sm font-mono">Code sample</code>
```

## Components

### Buttons
```tsx
import { BrandButton } from '@/components/design-system';

// Primary action
<BrandButton variant="primary">Primary</BrandButton>

// Gradient with animation
<BrandButton variant="animated">Animated</BrandButton>

// Glass effect
<BrandButton variant="glass">Glass</BrandButton>
```

### Cards
```tsx
import { BrandCard } from '@/components/design-system';

// Gradient card with glow
<BrandCard variant="gradient" glowEffect>
  <h3>Title</h3>
  <p>Content</p>
</BrandCard>
```

## Animations

### Transition Speeds
- `duration-fast` (150ms): Micro-interactions
- `duration-normal` (300ms): Standard transitions
- `duration-slow` (500ms): Large movements

### Common Patterns
```tsx
// Hover lift
<div className="hover-lift">Content</div>

// Fade in on scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

## Spacing

Use consistent spacing scale:
- `space-1` (4px)
- `space-2` (8px)
- `space-4` (16px)
- `space-6` (24px)
- `space-8` (32px)
- `space-12` (48px)
- `space-16` (64px)

## Guidelines

### DO:
✅ Use design system components
✅ Follow spacing scale
✅ Use brand colors
✅ Add animations to interactions
✅ Maintain accessibility

### DON'T:
❌ Use inline styles
❌ Use default Tailwind colors
❌ Skip loading/error states
❌ Ignore mobile responsiveness
❌ Forget accessibility
```

---

## Conclusion

Vibe coding accelerates development, but brand distinctiveness requires intentional design decisions. By following these standards, you can ship fast while maintaining a unique, polished visual identity.

**Key Takeaways:**
- Copy, don't import: Own your components
- Customize extensively: Make it uniquely yours
- Layer customization: Foundation → Components → Compositions → Polish
- Avoid generic patterns: Stand out from AI-generated designs
- Maintain quality gates: Design is as important as code

---

**Resources:**
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Customization](https://tailwindcss.com/docs/configuration)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

*Part of the RANA Framework - Production-Quality AI Development*
