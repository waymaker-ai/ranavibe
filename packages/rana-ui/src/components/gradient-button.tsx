import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const gradientButtonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        purple: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 focus-visible:ring-purple-500',
        orange: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/60 focus-visible:ring-orange-500',
        blue: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 focus-visible:ring-blue-500',
        green: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 focus-visible:ring-green-500',
        outline: 'border-2 border-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-border hover:from-purple-700 hover:to-pink-700 [&>span]:bg-white [&>span]:dark:bg-gray-900 [&>span]:bg-clip-text [&>span]:text-transparent',
        ghost: 'bg-transparent hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 text-purple-600 dark:text-purple-400',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
        icon: 'h-11 w-11',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        bounce: 'hover:animate-bounce',
        glow: 'relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-600 before:to-pink-600 before:blur-xl before:opacity-0 hover:before:opacity-30 before:transition-opacity',
      },
    },
    defaultVariants: {
      variant: 'purple',
      size: 'md',
      animation: 'none',
    },
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, animation, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(gradientButtonVariants({ variant, size, animation, className }))}
        {...props}
      >
        {variant === 'outline' ? <span>{children}</span> : children}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';

export { GradientButton, gradientButtonVariants };
