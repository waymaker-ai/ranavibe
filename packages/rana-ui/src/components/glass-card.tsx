import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const glassCardVariants = cva(
  'backdrop-blur-xl border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-800/50',
        frosted: 'bg-white/60 dark:bg-gray-900/60 border-white/20 dark:border-gray-700/20',
        tinted: 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-orange-50/80 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-purple-200/30',
        translucent: 'bg-white/40 dark:bg-gray-900/40 border-white/10 dark:border-gray-700/10',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        full: 'rounded-3xl',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20',
        xl: 'shadow-xl shadow-purple-500/20 dark:shadow-purple-500/30',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-2xl',
        glow: 'hover:shadow-2xl hover:shadow-purple-500/30',
        scale: 'hover:scale-[1.02]',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      rounded: 'lg',
      shadow: 'md',
      hover: 'none',
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, rounded, shadow, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, padding, rounded, shadow, hover, className }))}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent',
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
    {...props}
  />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};
