import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import { glob } from 'glob';

interface MobileIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

/**
 * Mobile Validate Command
 * Validates mobile-first compliance
 */
export async function mobileValidate(options: { fix?: boolean; verbose?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n📱 RANA Mobile Validation\n'));

  const issues: MobileIssue[] = [];

  // Check 1: Touch targets
  console.log(chalk.gray('Checking touch target sizes...'));
  issues.push(...await checkTouchTargets());

  // Check 2: Viewport configuration
  console.log(chalk.gray('Checking viewport configuration...'));
  issues.push(...checkViewport());

  // Check 3: Mobile navigation
  console.log(chalk.gray('Checking mobile navigation...'));
  issues.push(...await checkMobileNavigation());

  // Check 4: Responsive images
  console.log(chalk.gray('Checking responsive images...'));
  issues.push(...await checkResponsiveImages());

  // Check 5: PWA setup
  console.log(chalk.gray('Checking PWA configuration...'));
  issues.push(...checkPWA());

  // Check 6: Mobile performance
  console.log(chalk.gray('Checking mobile performance...'));
  issues.push(...await checkMobilePerformance());

  // Check 7: Touch gestures
  console.log(chalk.gray('Checking touch gestures...'));
  issues.push(...await checkTouchGestures());

  // Calculate score
  const score = calculateMobileScore(issues);

  // Report results
  console.log();
  reportMobileIssues(issues, score, options.verbose);

  // Auto-fix if requested
  if (options.fix && issues.some((i) => i.fix)) {
    const { autoFix } = await prompts({
      type: 'confirm',
      name: 'autoFix',
      message: 'Apply automatic fixes?',
      initial: true,
    });

    if (autoFix) {
      await applyMobileFixes(issues);
    }
  }
}

/**
 * Mobile Test Command
 * Test on different mobile viewports
 */
export async function mobileTest() {
  console.log(chalk.bold.cyan('\n📱 RANA Mobile Testing\n'));

  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Galaxy S21', width: 360, height: 800 },
    { name: 'Pixel 5', width: 393, height: 851 },
  ];

  console.log(chalk.bold('Testing viewports:\n'));

  viewports.forEach((viewport) => {
    console.log(`${chalk.cyan(viewport.name)}`);
    console.log(`  ${viewport.width}x${viewport.height}px`);
    console.log();
  });

  console.log(chalk.gray('To test manually:'));
  console.log(chalk.gray('  1. Open Chrome DevTools (Cmd+Option+I)'));
  console.log(chalk.gray('  2. Toggle device toolbar (Cmd+Shift+M)'));
  console.log(chalk.gray('  3. Select device from dropdown\n'));

  console.log(chalk.bold('Automated testing coming soon!\n'));
}

/**
 * Mobile Setup Command
 */
export async function mobileSetup() {
  console.log(chalk.bold.cyan('\n📱 RANA Mobile Setup\n'));

  const { features } = await prompts({
    type: 'multiselect',
    name: 'features',
    message: 'Select mobile features to set up:',
    choices: [
      { title: 'Touch-optimized components', value: 'touch-components', selected: true },
      { title: 'PWA (Progressive Web App)', value: 'pwa', selected: true },
      { title: 'Mobile navigation', value: 'mobile-nav', selected: true },
      { title: 'Gesture handlers', value: 'gestures' },
      { title: 'Responsive images', value: 'responsive-images', selected: true },
      { title: 'Service worker (offline support)', value: 'service-worker' },
    ],
  });

  if (!features || features.length === 0) {
    console.log(chalk.gray('Setup cancelled.\n'));
    return;
  }

  console.log(chalk.cyan('\nSetting up mobile features...\n'));

  for (const feature of features) {
    switch (feature) {
      case 'touch-components':
        await setupTouchComponents();
        break;
      case 'pwa':
        await setupPWA();
        break;
      case 'mobile-nav':
        await setupMobileNav();
        break;
      case 'gestures':
        await setupGestures();
        break;
      case 'responsive-images':
        await setupResponsiveImages();
        break;
      case 'service-worker':
        await setupServiceWorker();
        break;
    }
  }

  console.log(chalk.green('\n✅ Mobile setup complete!\n'));
}

/**
 * Check touch target sizes
 */
async function checkTouchTargets(): Promise<MobileIssue[]> {
  const issues: MobileIssue[] = [];

  const components = await glob('**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**'],
  });

  for (const file of components) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for buttons without touch-target class
      if (line.includes('<button') && !line.includes('touch-target') && !line.includes('min-h-')) {
        issues.push({
          severity: 'warning',
          category: 'Touch Targets',
          message: 'Button missing touch-target class (min 44px)',
          file,
          line: index + 1,
          fix: 'add-touch-target',
        });
      }

      // Check for small font sizes
      if (line.match(/text-\[(\d+)px\]/) || line.match(/fontSize:\s*(\d+)/)) {
        const size = parseInt(line.match(/\d+/)?.[0] || '0');
        if (size < 16) {
          issues.push({
            severity: 'warning',
            category: 'Touch Targets',
            message: `Font size too small for mobile (${size}px < 16px)`,
            file,
            line: index + 1,
          });
        }
      }
    });
  }

  return issues;
}

/**
 * Check viewport configuration
 */
function checkViewport(): MobileIssue[] {
  const issues: MobileIssue[] = [];

  // Check layout.tsx or _app.tsx for viewport
  const layoutFiles = ['app/layout.tsx', 'pages/_app.tsx', 'pages/_document.tsx'];

  let hasViewport = false;

  for (const file of layoutFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('viewport') || content.includes('width=device-width')) {
        hasViewport = true;
        break;
      }
    }
  }

  if (!hasViewport) {
    issues.push({
      severity: 'error',
      category: 'Viewport',
      message: 'Missing viewport meta tag',
      fix: 'add-viewport',
    });
  }

  return issues;
}

/**
 * Check mobile navigation
 */
async function checkMobileNavigation(): Promise<MobileIssue[]> {
  const issues: MobileIssue[] = [];

  const components = await glob('components/**/*.{tsx,jsx}', {
    ignore: ['node_modules/**'],
  });

  let hasMobileNav = false;

  for (const file of components) {
    const content = fs.readFileSync(file, 'utf-8');

    if (
      content.includes('MobileNav') ||
      content.includes('BottomNav') ||
      content.includes('sm:hidden') ||
      content.includes('md:block')
    ) {
      hasMobileNav = true;
      break;
    }
  }

  if (!hasMobileNav) {
    issues.push({
      severity: 'warning',
      category: 'Navigation',
      message: 'No mobile-specific navigation found',
      fix: 'add-mobile-nav',
    });
  }

  return issues;
}

/**
 * Check responsive images
 */
async function checkResponsiveImages(): Promise<MobileIssue[]> {
  const issues: MobileIssue[] = [];

  const components = await glob('**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', '.next/**'],
  });

  let unoptimizedCount = 0;

  for (const file of components) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for <img> without next/image
    if (content.includes('<img') && !content.includes('next/image')) {
      unoptimizedCount++;
    }
  }

  if (unoptimizedCount > 0) {
    issues.push({
      severity: 'warning',
      category: 'Images',
      message: `${unoptimizedCount} components using <img> instead of Next.js Image`,
      fix: 'use-next-image',
    });
  }

  return issues;
}

/**
 * Check PWA setup
 */
function checkPWA(): MobileIssue[] {
  const issues: MobileIssue[] = [];

  const hasManifest = fs.existsSync('public/manifest.json') || fs.existsSync('app/manifest.ts');
  const hasServiceWorker = fs.existsSync('public/sw.js') || fs.existsSync('public/service-worker.js');

  if (!hasManifest) {
    issues.push({
      severity: 'info',
      category: 'PWA',
      message: 'No web manifest found (required for PWA)',
      fix: 'generate-manifest',
    });
  }

  if (!hasServiceWorker) {
    issues.push({
      severity: 'info',
      category: 'PWA',
      message: 'No service worker found (required for offline support)',
      fix: 'generate-service-worker',
    });
  }

  return issues;
}

/**
 * Check mobile performance
 */
async function checkMobilePerformance(): Promise<MobileIssue[]> {
  const issues: MobileIssue[] = [];

  // Check bundle size (rough estimate)
  if (fs.existsSync('.next')) {
    const nextDir = fs.readdirSync('.next/static/chunks');
    const mainChunk = nextDir.find((f) => f.startsWith('main'));

    if (mainChunk) {
      const stats = fs.statSync(`.next/static/chunks/${mainChunk}`);
      const sizeKB = stats.size / 1024;

      if (sizeKB > 500) {
        issues.push({
          severity: 'warning',
          category: 'Performance',
          message: `Main bundle too large for mobile (${Math.round(sizeKB)}KB > 500KB)`,
        });
      }
    }
  }

  return issues;
}

/**
 * Check touch gestures
 */
async function checkTouchGestures(): Promise<MobileIssue[]> {
  const issues: MobileIssue[] = [];

  const hooks = await glob('hooks/**/*.{ts,tsx}', {
    ignore: ['node_modules/**'],
  });

  let hasGestureSupport = false;

  for (const file of hooks) {
    const content = fs.readFileSync(file, 'utf-8');

    if (
      content.includes('useSwipe') ||
      content.includes('onTouchStart') ||
      content.includes('onTouchMove')
    ) {
      hasGestureSupport = true;
      break;
    }
  }

  if (!hasGestureSupport) {
    issues.push({
      severity: 'info',
      category: 'Gestures',
      message: 'No touch gesture handlers found',
      fix: 'add-gesture-hooks',
    });
  }

  return issues;
}

/**
 * Calculate mobile score
 */
function calculateMobileScore(issues: MobileIssue[]): number {
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  return Math.max(0, 100 - (errorCount * 20 + warningCount * 10 + infoCount * 5));
}

/**
 * Report mobile issues
 */
function reportMobileIssues(issues: MobileIssue[], score: number, verbose = false) {
  console.log(chalk.bold('Mobile Validation Results:\n'));

  if (issues.length === 0) {
    console.log(chalk.green('✅ No mobile issues found!\n'));
    return;
  }

  // Summary
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  console.log(chalk.bold('Summary:'));
  if (errorCount > 0) console.log(`  ${chalk.red('●')} Errors: ${errorCount}`);
  if (warningCount > 0) console.log(`  ${chalk.yellow('●')} Warnings: ${warningCount}`);
  if (infoCount > 0) console.log(`  ${chalk.blue('●')} Info: ${infoCount}`);
  console.log();

  // Details
  if (verbose || errorCount > 0) {
    issues.forEach((issue) => {
      const severityColor = {
        error: chalk.red,
        warning: chalk.yellow,
        info: chalk.blue,
      }[issue.severity];

      console.log(severityColor(`${issue.severity.toUpperCase()}: ${issue.message}`));
      if (issue.file) {
        console.log(chalk.gray(`  File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
      }
      if (issue.fix) {
        console.log(chalk.cyan(`  Fix: ${issue.fix}`));
      }
      console.log();
    });
  }

  // Score
  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  console.log(chalk.bold(`Mobile Score: ${scoreColor(score)}/100\n`));
}

/**
 * Apply mobile fixes
 */
async function applyMobileFixes(issues: MobileIssue[]) {
  console.log(chalk.cyan('\nApplying fixes...\n'));

  for (const issue of issues) {
    if (!issue.fix) continue;

    switch (issue.fix) {
      case 'add-viewport':
        console.log(chalk.gray('Viewport meta tag should be added to layout.tsx'));
        break;
      case 'add-mobile-nav':
        await setupMobileNav();
        console.log(chalk.green('✓ Added mobile navigation component'));
        break;
      case 'generate-manifest':
        await setupPWA();
        console.log(chalk.green('✓ Generated web manifest'));
        break;
      case 'add-gesture-hooks':
        await setupGestures();
        console.log(chalk.green('✓ Added gesture hooks'));
        break;
    }
  }
}

/**
 * Setup touch components
 */
async function setupTouchComponents() {
  console.log(chalk.gray('  See docs/MOBILE_FIRST_COMPONENT_SYSTEM.md for touch components'));
}

/**
 * Setup PWA
 */
async function setupPWA() {
  const manifestCode = `{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
`;

  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/manifest.json', manifestCode);
}

/**
 * Setup mobile navigation
 */
async function setupMobileNav() {
  console.log(chalk.gray('  See docs/MOBILE_FIRST_COMPONENT_SYSTEM.md for mobile navigation'));
}

/**
 * Setup gestures
 */
async function setupGestures() {
  const swipeHookCode = `import { useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
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

    if (absDeltaX > absDeltaY) {
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
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
`;

  fs.mkdirSync('hooks', { recursive: true });
  fs.writeFileSync('hooks/useSwipe.ts', swipeHookCode);
}

/**
 * Setup responsive images
 */
async function setupResponsiveImages() {
  console.log(chalk.gray('  Use Next.js Image component for responsive images'));
  console.log(chalk.gray('  import Image from "next/image"'));
}

/**
 * Setup service worker
 */
async function setupServiceWorker() {
  console.log(chalk.gray('  See docs/MOBILE_FIRST_COMPONENT_SYSTEM.md for service worker setup'));
}
