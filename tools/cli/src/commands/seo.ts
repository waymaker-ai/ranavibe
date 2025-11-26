import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface SEOIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  fix?: string;
}

interface SEOScore {
  total: number;
  categories: {
    metaTags: number;
    structuredData: number;
    performance: number;
    images: number;
    sitemap: number;
  };
}

/**
 * SEO Check Command
 * Validates SEO setup and provides recommendations
 */
export async function seoCheck(options: { fix?: boolean; verbose?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🔍 RANA SEO Check\n'));

  const issues: SEOIssue[] = [];

  // Check 1: Meta tags
  console.log(chalk.gray('Checking meta tags...'));
  issues.push(...await checkMetaTags());

  // Check 2: Structured data
  console.log(chalk.gray('Checking structured data...'));
  issues.push(...await checkStructuredData());

  // Check 3: Sitemap
  console.log(chalk.gray('Checking sitemap...'));
  issues.push(...checkSitemap());

  // Check 4: Robots.txt
  console.log(chalk.gray('Checking robots.txt...'));
  issues.push(...checkRobotsTxt());

  // Check 5: Images
  console.log(chalk.gray('Checking image optimization...'));
  issues.push(...await checkImages());

  // Check 6: Performance
  console.log(chalk.gray('Checking performance...'));
  issues.push(...await checkPerformance());

  // Check 7: Open Graph
  console.log(chalk.gray('Checking Open Graph tags...'));
  issues.push(...await checkOpenGraph());

  // Calculate score
  const score = calculateSEOScore(issues);

  // Report results
  console.log();
  reportSEOIssues(issues, score, options.verbose);

  // Auto-fix if requested
  if (options.fix && issues.some((i) => i.fix)) {
    const { autoFix } = await prompts({
      type: 'confirm',
      name: 'autoFix',
      message: 'Apply automatic fixes?',
      initial: true,
    });

    if (autoFix) {
      await applySEOFixes(issues);
    }
  }
}

/**
 * SEO Generate Command
 * Generates sitemap, robots.txt, and other SEO files
 */
export async function seoGenerate(options: { all?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🚀 RANA SEO Generator\n'));

  let selections = ['sitemap', 'robots', 'manifest'];

  if (!options.all) {
    const { selected } = await prompts({
      type: 'multiselect',
      name: 'selected',
      message: 'What would you like to generate?',
      choices: [
        { title: 'Sitemap (sitemap.xml)', value: 'sitemap', selected: true },
        { title: 'Robots.txt', value: 'robots', selected: true },
        { title: 'Web Manifest', value: 'manifest', selected: true },
        { title: 'SEO Component', value: 'seo-component' },
        { title: 'Structured Data Templates', value: 'structured-data' },
      ],
    });

    if (!selected || selected.length === 0) {
      console.log(chalk.gray('Generation cancelled.\n'));
      return;
    }

    selections = selected;
  }

  console.log(chalk.cyan('\nGenerating files...\n'));

  for (const selection of selections) {
    switch (selection) {
      case 'sitemap':
        await generateSitemap();
        break;
      case 'robots':
        await generateRobotsTxt();
        break;
      case 'manifest':
        await generateManifest();
        break;
      case 'seo-component':
        await generateSEOComponent();
        break;
      case 'structured-data':
        await generateStructuredData();
        break;
    }
  }

  console.log(chalk.green('\n✅ SEO files generated!\n'));
}

/**
 * SEO Analyze Command
 * Analyzes pages and provides detailed SEO report
 */
export async function seoAnalyze() {
  console.log(chalk.bold.cyan('\n📊 RANA SEO Analysis\n'));

  // Find all pages
  const pages = await findPages();

  console.log(chalk.gray(`Analyzing ${pages.length} pages...\n`));

  const pageAnalysis = [];

  for (const page of pages) {
    const analysis = await analyzePage(page);
    pageAnalysis.push(analysis);
  }

  // Report
  console.log(chalk.bold('Page Analysis:\n'));

  pageAnalysis.forEach((analysis) => {
    const scoreColor = analysis.score >= 90 ? chalk.green : analysis.score >= 70 ? chalk.yellow : chalk.red;
    console.log(`${analysis.path}`);
    console.log(`  Score: ${scoreColor(`${analysis.score}/100`)}`);
    console.log(`  Title: ${analysis.title ? chalk.green('✓') : chalk.red('✗')} ${analysis.title || 'Missing'}`);
    console.log(`  Description: ${analysis.description ? chalk.green('✓') : chalk.red('✗')} ${analysis.description ? `${analysis.description.slice(0, 50)}...` : 'Missing'}`);
    console.log(`  OG Image: ${analysis.ogImage ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`  Structured Data: ${analysis.structuredData ? chalk.green('✓') : chalk.red('✗')}\n`);
  });

  const avgScore = Math.round(pageAnalysis.reduce((sum, p) => sum + p.score, 0) / pageAnalysis.length);
  const avgScoreColor = avgScore >= 90 ? chalk.green : avgScore >= 70 ? chalk.yellow : chalk.red;

  console.log(chalk.bold(`Average Score: ${avgScoreColor(`${avgScore}/100`)}\n`));
}

/**
 * SEO Setup Command
 */
export async function seoSetup() {
  console.log(chalk.bold.cyan('\n🔍 RANA SEO Setup\n'));

  const config = await prompts([
    {
      type: 'text',
      name: 'siteName',
      message: 'Site name:',
    },
    {
      type: 'text',
      name: 'siteUrl',
      message: 'Site URL (e.g., https://example.com):',
      validate: (value) => value.startsWith('http') || 'Must be a valid URL',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Default site description:',
    },
    {
      type: 'text',
      name: 'ogImage',
      message: 'Default OG image URL:',
    },
  ]);

  if (!config) {
    console.log(chalk.gray('Setup cancelled.\n'));
    return;
  }

  // Generate all SEO files
  await seoGenerate({ all: true });

  console.log(chalk.green('\n✅ SEO setup complete!\n'));
}

/**
 * Check meta tags
 */
async function checkMetaTags(): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  const pages = await findPages();

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf-8');

    // Check for title tag
    if (!content.includes('<title>') && !content.includes('title:')) {
      issues.push({
        severity: 'error',
        category: 'Meta Tags',
        message: 'Missing page title',
        file: page,
        fix: 'add-title',
      });
    }

    // Check for description
    if (!content.includes('description') && !content.includes('meta name="description"')) {
      issues.push({
        severity: 'error',
        category: 'Meta Tags',
        message: 'Missing meta description',
        file: page,
        fix: 'add-description',
      });
    }

    // Check for viewport
    if (!content.includes('viewport')) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        message: 'Missing viewport meta tag',
        file: page,
      });
    }
  }

  return issues;
}

/**
 * Check structured data
 */
async function checkStructuredData(): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  const pages = await findPages();

  let hasStructuredData = false;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf-8');

    if (content.includes('application/ld+json') || content.includes('@type')) {
      hasStructuredData = true;
    }
  }

  if (!hasStructuredData) {
    issues.push({
      severity: 'warning',
      category: 'Structured Data',
      message: 'No structured data found',
      fix: 'generate-structured-data',
    });
  }

  return issues;
}

/**
 * Check sitemap
 */
function checkSitemap(): SEOIssue[] {
  const issues: SEOIssue[] = [];

  const hasSitemap = fs.existsSync('public/sitemap.xml') || fs.existsSync('app/sitemap.ts');

  if (!hasSitemap) {
    issues.push({
      severity: 'error',
      category: 'Sitemap',
      message: 'No sitemap found',
      fix: 'generate-sitemap',
    });
  }

  return issues;
}

/**
 * Check robots.txt
 */
function checkRobotsTxt(): SEOIssue[] {
  const issues: SEOIssue[] = [];

  const hasRobots = fs.existsSync('public/robots.txt') || fs.existsSync('app/robots.ts');

  if (!hasRobots) {
    issues.push({
      severity: 'warning',
      category: 'Robots.txt',
      message: 'No robots.txt found',
      fix: 'generate-robots',
    });
  }

  return issues;
}

/**
 * Check images
 */
async function checkImages(): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  const images = await glob('public/**/*.{jpg,jpeg,png,gif}');

  let unoptimizedCount = 0;

  for (const image of images) {
    const stats = fs.statSync(image);
    const sizeKB = stats.size / 1024;

    // Check if image is too large (> 500KB)
    if (sizeKB > 500) {
      unoptimizedCount++;
    }
  }

  if (unoptimizedCount > 0) {
    issues.push({
      severity: 'warning',
      category: 'Images',
      message: `${unoptimizedCount} images are larger than 500KB`,
      fix: 'optimize-images',
    });
  }

  return issues;
}

/**
 * Check performance
 */
async function checkPerformance(): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  // Check for Next.js Image component usage
  const components = await glob('**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', '.next/**'],
  });

  let hasUnoptimizedImages = false;

  for (const file of components) {
    const content = fs.readFileSync(file, 'utf-8');

    if (content.includes('<img') && !content.includes('next/image')) {
      hasUnoptimizedImages = true;
      break;
    }
  }

  if (hasUnoptimizedImages) {
    issues.push({
      severity: 'warning',
      category: 'Performance',
      message: 'Using <img> tags instead of Next.js Image component',
      fix: 'use-next-image',
    });
  }

  return issues;
}

/**
 * Check Open Graph tags
 */
async function checkOpenGraph(): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  const pages = await findPages();

  let hasOG = false;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf-8');

    if (content.includes('og:title') || content.includes('openGraph')) {
      hasOG = true;
      break;
    }
  }

  if (!hasOG) {
    issues.push({
      severity: 'warning',
      category: 'Open Graph',
      message: 'No Open Graph tags found',
      fix: 'add-og-tags',
    });
  }

  return issues;
}

/**
 * Calculate SEO score
 */
function calculateSEOScore(issues: SEOIssue[]): SEOScore {
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const total = Math.max(0, 100 - (errorCount * 15 + warningCount * 5));

  return {
    total,
    categories: {
      metaTags: 100 - (issues.filter((i) => i.category === 'Meta Tags').length * 10),
      structuredData: 100 - (issues.filter((i) => i.category === 'Structured Data').length * 10),
      performance: 100 - (issues.filter((i) => i.category === 'Performance').length * 10),
      images: 100 - (issues.filter((i) => i.category === 'Images').length * 10),
      sitemap: 100 - (issues.filter((i) => i.category === 'Sitemap').length * 10),
    },
  };
}

/**
 * Report SEO issues
 */
function reportSEOIssues(issues: SEOIssue[], score: SEOScore, verbose = false) {
  console.log(chalk.bold('SEO Check Results:\n'));

  if (issues.length === 0) {
    console.log(chalk.green('✅ No SEO issues found!\n'));
    return;
  }

  // Summary
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  console.log(chalk.bold('Summary:'));
  if (errorCount > 0) console.log(`  ${chalk.red('●')} Errors: ${errorCount}`);
  if (warningCount > 0) console.log(`  ${chalk.yellow('●')} Warnings: ${warningCount}`);
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
        console.log(chalk.gray(`  File: ${issue.file}`));
      }
      if (issue.fix) {
        console.log(chalk.cyan(`  Fix: ${issue.fix}`));
      }
      console.log();
    });
  }

  // Score
  const scoreColor = score.total >= 90 ? chalk.green : score.total >= 70 ? chalk.yellow : chalk.red;
  console.log(chalk.bold(`SEO Score: ${scoreColor(score.total)}/100\n`));

  // Category scores
  console.log(chalk.bold('Category Scores:'));
  console.log(`  Meta Tags: ${score.categories.metaTags}/100`);
  console.log(`  Structured Data: ${score.categories.structuredData}/100`);
  console.log(`  Performance: ${score.categories.performance}/100`);
  console.log(`  Images: ${score.categories.images}/100`);
  console.log(`  Sitemap: ${score.categories.sitemap}/100\n`);
}

/**
 * Apply SEO fixes
 */
async function applySEOFixes(issues: SEOIssue[]) {
  console.log(chalk.cyan('\nApplying fixes...\n'));

  for (const issue of issues) {
    if (!issue.fix) continue;

    switch (issue.fix) {
      case 'generate-sitemap':
        await generateSitemap();
        console.log(chalk.green('✓ Generated sitemap.xml'));
        break;
      case 'generate-robots':
        await generateRobotsTxt();
        console.log(chalk.green('✓ Generated robots.txt'));
        break;
      case 'generate-structured-data':
        await generateStructuredData();
        console.log(chalk.green('✓ Generated structured data templates'));
        break;
    }
  }
}

/**
 * Generate sitemap
 */
async function generateSitemap() {
  const sitemapCode = `import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: \`\${baseUrl}/about\`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: \`\${baseUrl}/blog\`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
`;

  fs.mkdirSync('app', { recursive: true });
  fs.writeFileSync('app/sitemap.ts', sitemapCode);
}

/**
 * Generate robots.txt
 */
async function generateRobotsTxt() {
  const robotsCode = `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: \`\${baseUrl}/sitemap.xml\`,
  };
}
`;

  fs.mkdirSync('app', { recursive: true });
  fs.writeFileSync('app/robots.ts', robotsCode);
}

/**
 * Generate web manifest
 */
async function generateManifest() {
  const manifestCode = `import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your App Name',
    short_name: 'App',
    description: 'Your app description',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
`;

  fs.mkdirSync('app', { recursive: true });
  fs.writeFileSync('app/manifest.ts', manifestCode);
}

/**
 * Generate SEO component
 */
async function generateSEOComponent() {
  const seoCode = `import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEO({ title, description, canonical, ogImage, ogType = 'website' }: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const fullTitle = \`\${title} | Your Site Name\`;
  const fullOgImage = ogImage || \`\${siteUrl}/og-image.png\`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical || siteUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:url" content={canonical || siteUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </Head>
  );
}
`;

  fs.mkdirSync('components', { recursive: true });
  fs.writeFileSync('components/SEO.tsx', seoCode);
}

/**
 * Generate structured data templates
 */
async function generateStructuredData() {
  const structuredDataCode = `export function ArticleStructuredData(props: {
  headline: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
  image?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.headline,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      '@type': 'Person',
      name: props.author.name,
      url: props.author.url,
    },
    image: props.image,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationStructuredData(props: {
  name: string;
  url: string;
  logo: string;
  contactPoint?: { telephone: string; contactType: string };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    logo: props.logo,
    contactPoint: props.contactPoint,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
`;

  fs.mkdirSync('components', { recursive: true });
  fs.writeFileSync('components/StructuredData.tsx', structuredDataCode);
}

/**
 * Find pages in the project
 */
async function findPages(): Promise<string[]> {
  const pages = await glob('**/{page,pages}/**/*.{tsx,jsx,ts,js}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**'],
  });

  return pages;
}

/**
 * Analyze a single page
 */
async function analyzePage(pagePath: string) {
  const content = fs.readFileSync(pagePath, 'utf-8');

  const analysis = {
    path: pagePath,
    title: content.match(/<title>(.*?)<\/title>/)?.[1] || content.match(/title:\s*['"](.+?)['"]/)?.[1],
    description: content.match(/description.*?content=["'](.+?)["']/)?.[1],
    ogImage: content.includes('og:image'),
    structuredData: content.includes('application/ld+json'),
    score: 0,
  };

  // Calculate score
  let score = 100;
  if (!analysis.title) score -= 30;
  if (!analysis.description) score -= 30;
  if (!analysis.ogImage) score -= 20;
  if (!analysis.structuredData) score -= 20;

  analysis.score = Math.max(0, score);

  return analysis;
}
