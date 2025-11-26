import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

/**
 * Security Audit Command
 * Scans codebase for security vulnerabilities
 */
export async function securityAudit(options: { fix?: boolean; verbose?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🔒 RANA Security Audit\n'));

  const issues: SecurityIssue[] = [];

  // Check 1: Environment variables
  console.log(chalk.gray('Checking environment variables...'));
  issues.push(...checkEnvSecurity());

  // Check 2: Authentication setup
  console.log(chalk.gray('Checking authentication...'));
  issues.push(...checkAuthSecurity());

  // Check 3: API routes security
  console.log(chalk.gray('Checking API routes...'));
  issues.push(...await checkApiSecurity());

  // Check 4: Dependencies
  console.log(chalk.gray('Checking dependencies...'));
  issues.push(...await checkDependencySecurity());

  // Check 5: CORS configuration
  console.log(chalk.gray('Checking CORS configuration...'));
  issues.push(...checkCORSSecurity());

  // Check 6: Rate limiting
  console.log(chalk.gray('Checking rate limiting...'));
  issues.push(...checkRateLimiting());

  // Check 7: Input validation
  console.log(chalk.gray('Checking input validation...'));
  issues.push(...await checkInputValidation());

  // Check 8: Secrets in code
  console.log(chalk.gray('Scanning for hardcoded secrets...'));
  issues.push(...await checkHardcodedSecrets());

  // Report results
  console.log();
  reportSecurityIssues(issues, options.verbose);

  // Auto-fix if requested
  if (options.fix && issues.some((i) => i.fix)) {
    const { autoFix } = await prompts({
      type: 'confirm',
      name: 'autoFix',
      message: 'Apply automatic fixes?',
      initial: true,
    });

    if (autoFix) {
      applySecurityFixes(issues);
    }
  }

  // Exit code based on critical issues
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  if (criticalCount > 0) {
    process.exit(1);
  }
}

/**
 * Security Setup Command
 * Interactive wizard for security setup
 */
export async function securitySetup() {
  console.log(chalk.bold.cyan('\n🔒 RANA Security Setup\n'));

  // Authentication provider selection
  const { authProvider } = await prompts({
    type: 'select',
    name: 'authProvider',
    message: 'Select authentication provider:',
    choices: [
      { title: 'Supabase Auth (Recommended)', value: 'supabase' },
      { title: 'NextAuth.js', value: 'nextauth' },
      { title: 'Clerk', value: 'clerk' },
      { title: 'Auth0', value: 'auth0' },
      { title: 'Custom', value: 'custom' },
    ],
  });

  if (!authProvider) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  // Setup based on provider
  switch (authProvider) {
    case 'supabase':
      await setupSupabaseAuth();
      break;
    case 'nextauth':
      await setupNextAuth();
      break;
    case 'clerk':
      await setupClerk();
      break;
    case 'auth0':
      await setupAuth0();
      break;
    case 'custom':
      console.log(chalk.yellow('Custom auth setup - see docs/SECURITY_FRAMEWORK_GUIDE.md'));
      break;
  }

  // Rate limiting setup
  const { rateLimiting } = await prompts({
    type: 'confirm',
    name: 'rateLimiting',
    message: 'Setup rate limiting?',
    initial: true,
  });

  if (rateLimiting) {
    await setupRateLimiting();
  }

  // Security headers
  const { securityHeaders } = await prompts({
    type: 'confirm',
    name: 'securityHeaders',
    message: 'Add security headers?',
    initial: true,
  });

  if (securityHeaders) {
    await setupSecurityHeaders();
  }

  console.log(chalk.green('\n✅ Security setup complete!\n'));
}

/**
 * Check environment variable security
 */
function checkEnvSecurity(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check if .env is in .gitignore
  const gitignorePath = '.gitignore';
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.env')) {
      issues.push({
        severity: 'critical',
        category: 'Environment',
        message: '.env file is not in .gitignore',
        file: '.gitignore',
        fix: 'add-to-gitignore',
      });
    }
  }

  // Check for .env.example
  if (!fs.existsSync('.env.example')) {
    issues.push({
      severity: 'low',
      category: 'Environment',
      message: 'Missing .env.example file',
      fix: 'create-env-example',
    });
  }

  // Check for exposed secrets in .env
  if (fs.existsSync('.env')) {
    const env = fs.readFileSync('.env', 'utf-8');
    const lines = env.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('SECRET') || line.includes('KEY')) {
        if (line.includes('=') && !line.includes('your-') && !line.includes('xxx')) {
          const value = line.split('=')[1]?.trim();
          if (value && value.length < 20) {
            issues.push({
              severity: 'high',
              category: 'Environment',
              message: 'Potentially weak secret key',
              file: '.env',
              line: index + 1,
            });
          }
        }
      }
    });
  }

  return issues;
}

/**
 * Check authentication security
 */
function checkAuthSecurity(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for auth service
  const hasSupabaseAuth = fs.existsSync('lib/supabase.ts') || fs.existsSync('lib/supabase.js');
  const hasNextAuth = fs.existsSync('pages/api/auth/[...nextauth].ts') || fs.existsSync('app/api/auth/[...nextauth]/route.ts');

  if (!hasSupabaseAuth && !hasNextAuth) {
    issues.push({
      severity: 'high',
      category: 'Authentication',
      message: 'No authentication system detected',
      fix: 'setup-auth',
    });
  }

  return issues;
}

/**
 * Check API security
 */
async function checkApiSecurity(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  // Find API routes
  const apiFiles = await glob('**/{api,app}/**/*.{ts,js}', {
    ignore: ['node_modules/**', '.next/**'],
  });

  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for missing auth
    if (!content.includes('auth') && !content.includes('Auth')) {
      issues.push({
        severity: 'medium',
        category: 'API Security',
        message: 'API route missing authentication check',
        file,
      });
    }

    // Check for SQL injection vulnerability
    if (content.match(/`.*\$\{.*\}`/) && content.includes('query')) {
      issues.push({
        severity: 'critical',
        category: 'API Security',
        message: 'Potential SQL injection vulnerability',
        file,
      });
    }

    // Check for XSS vulnerability
    if (content.includes('dangerouslySetInnerHTML') && !content.includes('sanitize')) {
      issues.push({
        severity: 'high',
        category: 'API Security',
        message: 'Potential XSS vulnerability',
        file,
      });
    }
  }

  return issues;
}

/**
 * Check dependency security
 */
async function checkDependencySecurity(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  // Check package.json for known vulnerable packages
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Check for outdated or vulnerable packages
    const vulnerablePackages = [
      'node-fetch@2.0.0',
      'axios@0.21.0',
      'lodash@4.17.20',
    ];

    Object.entries(allDeps).forEach(([name, version]) => {
      const pkgVersion = `${name}@${version}`;
      if (vulnerablePackages.some((v) => pkgVersion.includes(v))) {
        issues.push({
          severity: 'high',
          category: 'Dependencies',
          message: `Vulnerable package detected: ${name}@${version}`,
          fix: 'update-dependencies',
        });
      }
    });
  }

  return issues;
}

/**
 * Check CORS configuration
 */
function checkCORSSecurity(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for CORS in Next.js config
  if (fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs')) {
    const configFile = fs.existsSync('next.config.js') ? 'next.config.js' : 'next.config.mjs';
    const config = fs.readFileSync(configFile, 'utf-8');

    if (config.includes('Access-Control-Allow-Origin: *')) {
      issues.push({
        severity: 'high',
        category: 'CORS',
        message: 'Wildcard CORS detected - this is insecure for production',
        file: configFile,
      });
    }
  }

  return issues;
}

/**
 * Check rate limiting
 */
function checkRateLimiting(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for rate limiting implementation
  const hasRateLimit = fs.existsSync('lib/rate-limit.ts') || fs.existsSync('lib/ratelimit.ts');

  if (!hasRateLimit) {
    issues.push({
      severity: 'medium',
      category: 'Rate Limiting',
      message: 'No rate limiting implementation found',
      fix: 'setup-rate-limit',
    });
  }

  return issues;
}

/**
 * Check input validation
 */
async function checkInputValidation(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  const apiFiles = await glob('**/{api,app}/**/*.{ts,js}', {
    ignore: ['node_modules/**', '.next/**'],
  });

  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for Zod or other validation
    if (!content.includes('zod') && !content.includes('yup') && !content.includes('joi')) {
      if (content.includes('req.body') || content.includes('request.body')) {
        issues.push({
          severity: 'medium',
          category: 'Input Validation',
          message: 'API route missing input validation',
          file,
        });
      }
    }
  }

  return issues;
}

/**
 * Check for hardcoded secrets
 */
async function checkHardcodedSecrets(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  const codeFiles = await glob('**/*.{ts,js,tsx,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**'],
  });

  const secretPatterns = [
    /api[_-]?key\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
    /secret\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
    /password\s*=\s*['"][^'"]+['"]/i,
    /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
  ];

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      secretPatterns.forEach((pattern) => {
        if (pattern.test(line) && !line.includes('process.env')) {
          issues.push({
            severity: 'critical',
            category: 'Secrets',
            message: 'Hardcoded secret detected',
            file,
            line: index + 1,
          });
        }
      });
    });
  }

  return issues;
}

/**
 * Report security issues
 */
function reportSecurityIssues(issues: SecurityIssue[], verbose = false) {
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  console.log(chalk.bold('Security Audit Results:\n'));

  if (issues.length === 0) {
    console.log(chalk.green('✅ No security issues found!\n'));
    return;
  }

  // Summary
  console.log(chalk.bold('Summary:'));
  if (criticalCount > 0) console.log(`  ${chalk.red('●')} Critical: ${criticalCount}`);
  if (highCount > 0) console.log(`  ${chalk.yellow('●')} High: ${highCount}`);
  if (mediumCount > 0) console.log(`  ${chalk.blue('●')} Medium: ${mediumCount}`);
  if (lowCount > 0) console.log(`  ${chalk.gray('●')} Low: ${lowCount}`);

  console.log();

  // Details
  if (verbose || criticalCount > 0 || highCount > 0) {
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const sortedIssues = issues.sort((a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    );

    sortedIssues.forEach((issue) => {
      const severityColor = {
        critical: chalk.red,
        high: chalk.yellow,
        medium: chalk.blue,
        low: chalk.gray,
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

  // Security score
  const score = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));
  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  console.log(chalk.bold(`Security Score: ${scoreColor(score)}/100\n`));
}

/**
 * Apply automatic fixes
 */
function applySecurityFixes(issues: SecurityIssue[]) {
  console.log(chalk.cyan('\nApplying fixes...\n'));

  issues.forEach((issue) => {
    if (!issue.fix) return;

    switch (issue.fix) {
      case 'add-to-gitignore':
        const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf-8') : '';
        fs.writeFileSync('.gitignore', gitignore + '\n.env\n.env.local\n');
        console.log(chalk.green('✓ Added .env to .gitignore'));
        break;

      case 'create-env-example':
        if (fs.existsSync('.env')) {
          const env = fs.readFileSync('.env', 'utf-8');
          const example = env.replace(/=.*/g, '=your-value-here');
          fs.writeFileSync('.env.example', example);
          console.log(chalk.green('✓ Created .env.example'));
        }
        break;
    }
  });
}

/**
 * Setup Supabase Auth
 */
async function setupSupabaseAuth() {
  console.log(chalk.cyan('\n📦 Setting up Supabase Auth...\n'));
  console.log(chalk.gray('Supabase auth is configured via lib/supabase.ts'));
  console.log(chalk.gray('See: docs/SECURITY_FRAMEWORK_GUIDE.md\n'));
}

/**
 * Setup NextAuth
 */
async function setupNextAuth() {
  console.log(chalk.cyan('\n📦 Setting up NextAuth.js...\n'));
  console.log(chalk.gray('See: docs/SECURITY_FRAMEWORK_GUIDE.md\n'));
}

/**
 * Setup Clerk
 */
async function setupClerk() {
  console.log(chalk.cyan('\n📦 Setting up Clerk...\n'));
  console.log(chalk.gray('See: docs/SECURITY_FRAMEWORK_GUIDE.md\n'));
}

/**
 * Setup Auth0
 */
async function setupAuth0() {
  console.log(chalk.cyan('\n📦 Setting up Auth0...\n'));
  console.log(chalk.gray('See: docs/SECURITY_FRAMEWORK_GUIDE.md\n'));
}

/**
 * Setup rate limiting
 */
async function setupRateLimiting() {
  console.log(chalk.cyan('\n⏱️  Setting up rate limiting...\n'));

  const rateLimitCode = `import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimits = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  }),
};
`;

  const libDir = 'lib';
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  fs.writeFileSync(path.join(libDir, 'rate-limit.ts'), rateLimitCode);

  console.log(chalk.green('✓ Created lib/rate-limit.ts'));
  console.log(chalk.gray('\nAdd to .env:'));
  console.log(chalk.gray('  UPSTASH_REDIS_REST_URL=your-url'));
  console.log(chalk.gray('  UPSTASH_REDIS_REST_TOKEN=your-token\n'));
}

/**
 * Setup security headers
 */
async function setupSecurityHeaders() {
  console.log(chalk.cyan('\n🔐 Setting up security headers...\n'));

  const nextConfig = `const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
`;

  fs.writeFileSync('next.config.js', nextConfig);
  console.log(chalk.green('✓ Added security headers to next.config.js\n'));
}
