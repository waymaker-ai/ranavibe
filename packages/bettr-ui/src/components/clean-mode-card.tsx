import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const cleanModeCardVariants = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        minimal: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
        clean: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50',
        zen: 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
        focus: 'bg-white dark:bg-gray-900 border-l-4 border-l-purple-600 shadow-sm',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
      },
      hover: {
        none: '',
        subtle: 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        lift: 'hover:-translate-y-1 hover:shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'clean',
      padding: 'md',
      rounded: 'md',
      hover: 'none',
    },
  }
);

export interface CleanModeCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cleanModeCardVariants> {
  showAccent?: boolean;
  accentColor?: 'purple' | 'blue' | 'green' | 'orange';
}

const CleanModeCard = React.forwardRef<HTMLDivElement, CleanModeCardProps>(
  ({ className, variant, padding, rounded, hover, showAccent, accentColor = 'purple', children, ...props }, ref) => {
    const accentColors = {
      purple: 'before:bg-gradient-to-r before:from-purple-600 before:to-pink-600',
      blue: 'before:bg-gradient-to-r before:from-blue-600 before:to-cyan-600',
      green: 'before:bg-gradient-to-r before:from-green-600 before:to-emerald-600',
      orange: 'before:bg-gradient-to-r before:from-orange-600 before:to-pink-600',
    };

    return (
      <div
        ref={ref}
        className={cn(
          cleanModeCardVariants({ variant, padding, rounded, hover, className }),
          showAccent && [
            'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
            accentColors[accentColor],
          ]
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CleanModeCard.displayName = 'CleanModeCard';

const CleanModeCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 pb-4', className)}
    {...props}
  />
));
CleanModeCardHeader.displayName = 'CleanModeCardHeader';

const CleanModeCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold text-gray-900 dark:text-gray-100',
      className
    )}
    {...props}
  />
));
CleanModeCardTitle.displayName = 'CleanModeCardTitle';

const CleanModeCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
    {...props}
  />
));
CleanModeCardDescription.displayName = 'CleanModeCardDescription';

const CleanModeCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CleanModeCardContent.displayName = 'CleanModeCardContent';

export {
  CleanModeCard,
  CleanModeCardHeader,
  CleanModeCardTitle,
  CleanModeCardDescription,
  CleanModeCardContent,
  cleanModeCardVariants,
};
