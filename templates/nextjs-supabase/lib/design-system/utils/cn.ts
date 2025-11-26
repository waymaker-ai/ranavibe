/**
 * LUKA Design System - Utility Functions
 * Class name merger with tailwind-merge and clsx
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names intelligently
 * Handles Tailwind conflicts properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Installation required:
 * npm install clsx tailwind-merge class-variance-authority
 */
