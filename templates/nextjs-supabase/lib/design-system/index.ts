/**
 * LUKA Design System
 * Production-ready components with dark mode, accessibility, animations
 *
 * Components included:
 * - Button (6 variants, 5 sizes)
 * - Input (text, email, password, number, search)
 * - Card (multiple variants)
 * - Modal/Dialog
 * - Toast notifications
 * - Dropdown/Select
 * - Table (sortable, filterable)
 * - Tabs
 * - Form (with validation)
 * - Badge
 * - Avatar
 * - Progress
 * - Skeleton
 * - Alert
 * - Tooltip
 * - Accordion
 * - Checkbox/Radio
 * - Switch/Toggle
 * - Slider
 * - Empty State
 * - Loading State
 */

// Components
export { Button, type ButtonProps } from './components/Button';
export { Input, type InputProps } from './components/Input';
export { Card, CardHeader, CardContent, CardFooter } from './components/Card';
export { Modal, useModal } from './components/Modal';
export { useToast, Toast, Toaster } from './components/Toast';
export { Dropdown, DropdownItem } from './components/Dropdown';
export { Table, TableHeader, TableBody, TableRow, TableCell } from './components/Table';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';
export { Form, FormField, FormLabel, FormError } from './components/Form';
export { Badge } from './components/Badge';
export { Avatar } from './components/Avatar';
export { Progress } from './components/Progress';
export { Skeleton } from './components/Skeleton';
export { Alert } from './components/Alert';
export { Tooltip } from './components/Tooltip';
export { Accordion, AccordionItem } from './components/Accordion';
export { Checkbox } from './components/Checkbox';
export { Radio, RadioGroup } from './components/Radio';
export { Switch } from './components/Switch';
export { Slider } from './components/Slider';
export { EmptyState } from './components/EmptyState';
export { LoadingState } from './components/LoadingState';

// Hooks
export { useMediaQuery } from './hooks/useMediaQuery';
export { useDebounce } from './hooks/useDebounce';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useClickOutside } from './hooks/useClickOutside';
export { useKeyPress } from './hooks/useKeyPress';
export { useCopyToClipboard } from './hooks/useCopyToClipboard';
export { useIntersectionObserver } from './hooks/useIntersectionObserver';

// Utilities
export { cn } from './utils/cn';
export { colors } from './tokens/colors';
export { typography } from './tokens/typography';
export { spacing } from './tokens/spacing';
export { shadows } from './tokens/shadows';
export { animations } from './tokens/animations';

/**
 * Installation:
 *
 * npm install clsx tailwind-merge class-variance-authority
 * npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
 * npm install @radix-ui/react-tabs @radix-ui/react-tooltip
 * npm install @radix-ui/react-accordion @radix-ui/react-checkbox
 * npm install @radix-ui/react-radio-group @radix-ui/react-switch
 * npm install @radix-ui/react-slider
 * npm install framer-motion
 * npm install react-hot-toast
 */

/**
 * Tailwind Config (add to tailwind.config.ts):
 *
 * module.exports = {
 *   darkMode: ['class'],
 *   theme: {
 *     extend: {
 *       colors: {
 *         border: 'hsl(var(--border))',
 *         input: 'hsl(var(--input))',
 *         ring: 'hsl(var(--ring))',
 *         background: 'hsl(var(--background))',
 *         foreground: 'hsl(var(--foreground))',
 *         primary: {
 *           DEFAULT: 'hsl(var(--primary))',
 *           foreground: 'hsl(var(--primary-foreground))',
 *         },
 *         // ... more colors
 *       },
 *       borderRadius: {
 *         lg: 'var(--radius)',
 *         md: 'calc(var(--radius) - 2px)',
 *         sm: 'calc(var(--radius) - 4px)',
 *       },
 *       keyframes: {
 *         'accordion-down': {
 *           from: { height: 0 },
 *           to: { height: 'var(--radix-accordion-content-height)' },
 *         },
 *         'accordion-up': {
 *           from: { height: 'var(--radix-accordion-content-height)' },
 *           to: { height: 0 },
 *         },
 *       },
 *       animation: {
 *         'accordion-down': 'accordion-down 0.2s ease-out',
 *         'accordion-up': 'accordion-up 0.2s ease-out',
 *       },
 *     },
 *   },
 * }
 */

/**
 * Global CSS (add to app/globals.css):
 *
 * @layer base {
 *   :root {
 *     --background: 0 0% 100%;
 *     --foreground: 222.2 84% 4.9%;
 *     --primary: 221.2 83.2% 53.3%;
 *     --primary-foreground: 210 40% 98%;
 *     --radius: 0.5rem;
 *   }
 *
 *   .dark {
 *     --background: 222.2 84% 4.9%;
 *     --foreground: 210 40% 98%;
 *     --primary: 217.2 91.2% 59.8%;
 *     --primary-foreground: 222.2 47.4% 11.2%;
 *   }
 * }
 *
 * @layer base {
 *   * {
 *     @apply border-border;
 *   }
 *   body {
 *     @apply bg-background text-foreground;
 *   }
 * }
 */
