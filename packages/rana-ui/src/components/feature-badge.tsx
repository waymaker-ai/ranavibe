import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const featureBadgeVariants = cva(
  'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-300',
  {
    variants: {
      variant: {
        gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50',
        glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 text-purple-600 dark:text-purple-400',
        outline: 'border-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 bg-transparent',
        solid: 'bg-purple-600 text-white',
        soft: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      },
      size: {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-1.5 text-sm',
        lg: 'px-5 py-2 text-base',
      },
      hover: {
        none: '',
        glow: 'hover:shadow-xl hover:shadow-purple-500/60',
        lift: 'hover:-translate-y-0.5',
        scale: 'hover:scale-105',
      },
    },
    defaultVariants: {
      variant: 'gradient',
      size: 'md',
      hover: 'none',
    },
  }
);

export interface FeatureBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof featureBadgeVariants> {
  icon?: React.ReactNode;
}

const FeatureBadge = React.forwardRef<HTMLSpanElement, FeatureBadgeProps>(
  ({ className, variant, size, hover, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(featureBadgeVariants({ variant, size, hover, className }))}
        {...props}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
    );
  }
);

FeatureBadge.displayName = 'FeatureBadge';

export { FeatureBadge, featureBadgeVariants };
