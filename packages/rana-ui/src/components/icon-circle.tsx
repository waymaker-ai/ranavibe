import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const iconCircleVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-all duration-300',
  {
    variants: {
      variant: {
        purple: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50',
        orange: 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/50',
        blue: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50',
        green: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50',
        glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 text-purple-600 dark:text-purple-400',
        outline: 'border-2 bg-transparent text-purple-600 dark:text-purple-400',
      },
      size: {
        xs: 'h-8 w-8 text-sm',
        sm: 'h-10 w-10 text-base',
        md: 'h-12 w-12 text-lg',
        lg: 'h-16 w-16 text-2xl',
        xl: 'h-20 w-20 text-3xl',
        '2xl': 'h-24 w-24 text-4xl',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-2xl',
        scale: 'hover:scale-110',
        rotate: 'hover:rotate-12',
        glow: 'hover:shadow-2xl',
      },
    },
    defaultVariants: {
      variant: 'purple',
      size: 'md',
      hover: 'none',
    },
  }
);

export interface IconCircleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconCircleVariants> {
  icon?: React.ReactNode;
}

const IconCircle = React.forwardRef<HTMLDivElement, IconCircleProps>(
  ({ className, variant, size, hover, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconCircleVariants({ variant, size, hover, className }))}
        {...props}
      >
        {icon || children}
      </div>
    );
  }
);

IconCircle.displayName = 'IconCircle';

export { IconCircle, iconCircleVariants };
