/**
 * Legacy Code Analysis Command
 * AI-powered legacy code modernization analysis
 * Competes with HatchWorks' legacy modernization offerings
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TechDebtItem {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line?: number;
  description: string;
  effort: string;
  impact: string;
  recommendation: string;
}

interface LegacyPattern {
  name: string;
  pattern: RegExp;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  modernAlternative: string;
  effort: string;
}

interface LegacyReport {
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    healthScore: number;
    techDebtHours: number;
    techDebtCost: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  techDebt: TechDebtItem[];
  modernizationPlan: ModernizationStep[];
  frameworks: FrameworkAnalysis;
  recommendations: string[];
}

interface ModernizationStep {
  phase: number;
  name: string;
  description: string;
  effort: string;
  impact: string;
  dependencies: string[];
  tasks: string[];
}

interface FrameworkAnalysis {
  detected: string[];
  outdated: { name: string; current: string; latest: string; severity: string }[];
  recommendations: string[];
}

// Legacy patterns to detect
const LEGACY_PATTERNS: LegacyPattern[] = [
  // JavaScript/TypeScript patterns
  {
    name: 'var keyword',
    pattern: /\bvar\s+\w+\s*=/g,
    category: 'JavaScript',
    severity: 'low',
    description: 'Using var instead of let/const',
    modernAlternative: 'Use const for constants, let for variables',
    effort: '5min',
  },
  {
    name: 'callback hell',
    pattern: /function\s*\([^)]*\)\s*\{[^}]*function\s*\([^)]*\)\s*\{/g,
    category: 'JavaScript',
    severity: 'medium',
    description: 'Nested callbacks (callback hell)',
    modernAlternative: 'Use async/await or Promises',
    effort: '30min',
  },
  {
    name: 'jQuery',
    pattern: /\$\s*\(['"]/g,
    category: 'JavaScript',
    severity: 'high',
    description: 'jQuery usage detected',
    modernAlternative: 'Use native DOM APIs or React/Vue',
    effort: '4-8hrs',
  },
  {
    name: 'document.write',
    pattern: /document\.write\s*\(/g,
    category: 'JavaScript',
    severity: 'critical',
    description: 'document.write usage (blocks rendering)',
    modernAlternative: 'Use DOM manipulation methods',
    effort: '1hr',
  },
  {
    name: 'eval',
    pattern: /\beval\s*\(/g,
    category: 'Security',
    severity: 'critical',
    description: 'eval() usage (security vulnerability)',
    modernAlternative: 'Avoid eval; use safe alternatives',
    effort: '2hrs',
  },
  {
    name: 'any type',
    pattern: /:\s*any\b/g,
    category: 'TypeScript',
    severity: 'medium',
    description: 'Using any type defeats TypeScript benefits',
    modernAlternative: 'Use proper type definitions',
    effort: '15min',
  },
  {
    name: 'class components',
    pattern: /class\s+\w+\s+extends\s+(React\.)?Component/g,
    category: 'React',
    severity: 'medium',
    description: 'Class components instead of functional',
    modernAlternative: 'Convert to functional components with hooks',
    effort: '1-2hrs',
  },
  {
    name: 'componentWillMount',
    pattern: /componentWillMount\s*\(/g,
    category: 'React',
    severity: 'high',
    description: 'Deprecated lifecycle method',
    modernAlternative: 'Use useEffect hook',
    effort: '30min',
  },
  {
    name: 'componentWillReceiveProps',
    pattern: /componentWillReceiveProps\s*\(/g,
    category: 'React',
    severity: 'high',
    description: 'Deprecated lifecycle method',
    modernAlternative: 'Use useEffect with dependencies',
    effort: '30min',
  },
  // CSS patterns
  {
    name: 'inline styles',
    pattern: /style\s*=\s*["']\{/g,
    category: 'CSS',
    severity: 'low',
    description: 'Inline styles (hard to maintain)',
    modernAlternative: 'Use Tailwind CSS or CSS modules',
    effort: '15min',
  },
  {
    name: 'float layout',
    pattern: /float\s*:\s*(left|right)/g,
    category: 'CSS',
    severity: 'medium',
    description: 'Float-based layouts',
    modernAlternative: 'Use Flexbox or CSS Grid',
    effort: '1hr',
  },
  // API patterns
  {
    name: 'XMLHttpRequest',
    pattern: /new\s+XMLHttpRequest/g,
    category: 'API',
    severity: 'medium',
    description: 'XMLHttpRequest instead of fetch',
    modernAlternative: 'Use fetch API or axios',
    effort: '30min',
  },
  {
    name: 'synchronous requests',
    pattern: /\.open\s*\([^,]+,\s*[^,]+,\s*false\)/g,
    category: 'API',
    severity: 'critical',
    description: 'Synchronous AJAX requests (blocks UI)',
    modernAlternative: 'Use async requests',
    effort: '1hr',
  },
  // Security patterns
  {
    name: 'innerHTML',
    pattern: /\.innerHTML\s*=/g,
    category: 'Security',
    severity: 'high',
    description: 'innerHTML assignment (XSS risk)',
    modernAlternative: 'Use textContent or sanitize HTML',
    effort: '30min',
  },
  {
    name: 'hardcoded secrets',
    pattern: /(api[_-]?key|password|secret|token)\s*[=:]\s*['"][^'"]{8,}/gi,
    category: 'Security',
    severity: 'critical',
    description: 'Hardcoded secrets in code',
    modernAlternative: 'Use environment variables',
    effort: '15min',
  },
];

export async function legacyAnalyze(options: {
  path?: string;
  detailed?: boolean;
  fix?: boolean;
  export?: string;
} = {}) {
  const targetPath = options.path || process.cwd();

  console.log(chalk.bold.cyan('\n🔍 RANA Legacy Code Analysis\n'));
  console.log(chalk.gray(`Analyzing ${targetPath} for legacy patterns...\n`));

  const report = await generateLegacyReport(targetPath);

  displaySummary(report);
  displayTechDebt(report, options.detailed);
  displayFrameworks(report);
  displayModernizationPlan(report);
  displayRecommendations(report);

  if (options.export) {
    exportReport(report, options.export);
  }

  if (options.fix) {
    console.log(chalk.yellow('\n⚠️ Auto-fix not yet implemented. Use report to guide manual fixes.\n'));
  }
}

async function generateLegacyReport(targetPath: string): Promise<LegacyReport> {
  const files = await collectFiles(targetPath);
  const techDebt = await analyzeTechDebt(files, targetPath);
  const frameworks = await analyzeFrameworks(targetPath);
  const modernizationPlan = generateModernizationPlan(techDebt, frameworks);

  const criticalIssues = techDebt.filter(t => t.type === 'critical').length;
  const highIssues = techDebt.filter(t => t.type === 'high').length;
  const mediumIssues = techDebt.filter(t => t.type === 'medium').length;
  const lowIssues = techDebt.filter(t => t.type === 'low').length;

  // Calculate tech debt hours (rough estimate)
  const techDebtHours = techDebt.reduce((sum, item) => {
    const hours = parseEffortToHours(item.effort);
    return sum + hours;
  }, 0);

  // Calculate health score (0-100)
  const healthScore = calculateHealthScore(techDebt, files.length);

  // Calculate cost at $150/hour
  const techDebtCost = techDebtHours * 150;

  return {
    summary: {
      totalFiles: files.length,
      analyzedFiles: files.length,
      healthScore,
      techDebtHours,
      techDebtCost,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
    },
    techDebt,
    modernizationPlan,
    frameworks,
    recommendations: generateRecommendations(techDebt, frameworks),
  };
}

async function collectFiles(targetPath: string): Promise<string[]> {
  const files: string[] = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

  function walkDir(dir: string) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, dist, build
          if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(item)) {
            walkDir(fullPath);
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  walkDir(targetPath);
  return files;
}

async function analyzeTechDebt(files: string[], basePath: string): Promise<TechDebtItem[]> {
  const techDebt: TechDebtItem[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(basePath, file);

      for (const pattern of LEGACY_PATTERNS) {
        const matches = content.match(pattern.pattern);
        if (matches && matches.length > 0) {
          techDebt.push({
            type: pattern.severity,
            category: pattern.category,
            file: relativePath,
            description: `${pattern.name} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
            effort: pattern.effort,
            impact: pattern.severity === 'critical' ? 'Blocking'
              : pattern.severity === 'high' ? 'Significant'
              : pattern.severity === 'medium' ? 'Moderate'
              : 'Minor',
            recommendation: pattern.modernAlternative,
          });
        }
      }
    } catch (e) {
      // Skip unreadable files
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  techDebt.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  return techDebt;
}

async function analyzeFrameworks(targetPath: string): Promise<FrameworkAnalysis> {
  const detected: string[] = [];
  const outdated: { name: string; current: string; latest: string; severity: string }[] = [];
  const recommendations: string[] = [];

  // Check package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Detect frameworks
      if (deps.react) detected.push(`React ${deps.react}`);
      if (deps.next) detected.push(`Next.js ${deps.next}`);
      if (deps.vue) detected.push(`Vue ${deps.vue}`);
      if (deps.angular) detected.push(`Angular ${deps.angular}`);
      if (deps.express) detected.push(`Express ${deps.express}`);
      if (deps.typescript) detected.push(`TypeScript ${deps.typescript}`);

      // Check for outdated patterns
      if (deps.jquery) {
        outdated.push({
          name: 'jQuery',
          current: deps.jquery,
          latest: 'Remove',
          severity: 'high',
        });
        recommendations.push('Consider removing jQuery and using modern DOM APIs');
      }

      if (deps['create-react-class']) {
        outdated.push({
          name: 'create-react-class',
          current: deps['create-react-class'],
          latest: 'Remove',
          severity: 'high',
        });
        recommendations.push('Migrate from create-react-class to functional components');
      }

      if (deps.moment) {
        outdated.push({
          name: 'moment.js',
          current: deps.moment,
          latest: 'date-fns or dayjs',
          severity: 'medium',
        });
        recommendations.push('Consider replacing moment.js with date-fns (smaller bundle)');
      }

      if (deps.lodash && !deps['lodash-es']) {
        outdated.push({
          name: 'lodash',
          current: deps.lodash,
          latest: 'lodash-es or native',
          severity: 'low',
        });
        recommendations.push('Use lodash-es for tree-shaking or native array methods');
      }

      // Check React version
      if (deps.react) {
        const version = parseInt(deps.react.replace(/[^0-9]/g, '').slice(0, 2));
        if (version < 18) {
          outdated.push({
            name: 'React',
            current: deps.react,
            latest: '18.x',
            severity: 'medium',
          });
          recommendations.push('Upgrade to React 18 for concurrent features');
        }
      }

      // Check Next.js version
      if (deps.next) {
        const version = parseInt(deps.next.replace(/[^0-9]/g, '').slice(0, 2));
        if (version < 14) {
          outdated.push({
            name: 'Next.js',
            current: deps.next,
            latest: '14.x',
            severity: 'medium',
          });
          recommendations.push('Upgrade to Next.js 14 for App Router and Server Components');
        }
      }
    } catch (e) {
      // Invalid package.json
    }
  }

  return { detected, outdated, recommendations };
}

function generateModernizationPlan(techDebt: TechDebtItem[], frameworks: FrameworkAnalysis): ModernizationStep[] {
  const plan: ModernizationStep[] = [];

  // Phase 1: Critical security fixes
  const criticalItems = techDebt.filter(t => t.type === 'critical');
  if (criticalItems.length > 0) {
    plan.push({
      phase: 1,
      name: 'Critical Security Fixes',
      description: 'Address critical security vulnerabilities immediately',
      effort: calculateTotalEffort(criticalItems),
      impact: 'Blocking issues resolved',
      dependencies: [],
      tasks: criticalItems.map(t => `Fix ${t.description} in ${t.file}`),
    });
  }

  // Phase 2: Framework upgrades
  if (frameworks.outdated.length > 0) {
    plan.push({
      phase: 2,
      name: 'Framework Upgrades',
      description: 'Update outdated dependencies to latest versions',
      effort: `${frameworks.outdated.length * 2}-${frameworks.outdated.length * 4} hours`,
      impact: 'Access to modern features, security patches',
      dependencies: ['Phase 1'],
      tasks: frameworks.outdated.map(f => `Upgrade ${f.name} from ${f.current} to ${f.latest}`),
    });
  }

  // Phase 3: High priority refactoring
  const highItems = techDebt.filter(t => t.type === 'high');
  if (highItems.length > 0) {
    plan.push({
      phase: 3,
      name: 'High Priority Refactoring',
      description: 'Refactor high-impact legacy patterns',
      effort: calculateTotalEffort(highItems),
      impact: 'Significant code quality improvement',
      dependencies: ['Phase 2'],
      tasks: highItems.slice(0, 10).map(t => `Modernize ${t.description}`),
    });
  }

  // Phase 4: Medium priority improvements
  const mediumItems = techDebt.filter(t => t.type === 'medium');
  if (mediumItems.length > 0) {
    plan.push({
      phase: 4,
      name: 'Code Quality Improvements',
      description: 'Address medium-priority technical debt',
      effort: calculateTotalEffort(mediumItems),
      impact: 'Better maintainability and performance',
      dependencies: ['Phase 3'],
      tasks: mediumItems.slice(0, 10).map(t => `Improve ${t.description}`),
    });
  }

  // Phase 5: Polish
  const lowItems = techDebt.filter(t => t.type === 'low');
  if (lowItems.length > 0) {
    plan.push({
      phase: 5,
      name: 'Code Polish',
      description: 'Clean up remaining minor issues',
      effort: calculateTotalEffort(lowItems),
      impact: 'Cleaner, more consistent codebase',
      dependencies: ['Phase 4'],
      tasks: ['Apply consistent coding standards', 'Remove deprecated patterns', 'Update documentation'],
    });
  }

  return plan;
}

function generateRecommendations(techDebt: TechDebtItem[], frameworks: FrameworkAnalysis): string[] {
  const recommendations: string[] = [];

  // Based on tech debt
  const categories = [...new Set(techDebt.map(t => t.category))];
  categories.forEach(cat => {
    const count = techDebt.filter(t => t.category === cat).length;
    if (count > 5) {
      recommendations.push(`Focus on ${cat} modernization (${count} issues found)`);
    }
  });

  // Based on frameworks
  recommendations.push(...frameworks.recommendations);

  // General recommendations
  if (techDebt.filter(t => t.type === 'critical').length > 0) {
    recommendations.unshift('🚨 Address critical issues before deploying to production');
  }

  if (techDebt.length > 50) {
    recommendations.push('Consider incremental modernization approach to manage scope');
  }

  if (!frameworks.detected.includes('TypeScript')) {
    recommendations.push('Add TypeScript for better type safety and developer experience');
  }

  return recommendations;
}

function displaySummary(report: LegacyReport) {
  const { summary } = report;

  console.log(chalk.bold('📊 Analysis Summary'));
  console.log(chalk.gray('─'.repeat(60)));

  // Health score with color
  const scoreColor = summary.healthScore >= 80 ? chalk.green
    : summary.healthScore >= 60 ? chalk.yellow
    : chalk.red;

  console.log(`  ${chalk.white('Health Score:')}        ${scoreColor(summary.healthScore + '/100')}`);
  console.log(`  ${chalk.white('Files Analyzed:')}      ${chalk.cyan(summary.analyzedFiles)}`);
  console.log();
  console.log(`  ${chalk.white('Technical Debt:')}      ${chalk.yellow(summary.techDebtHours.toFixed(1))} hours (~$${summary.techDebtCost.toLocaleString()})`);
  console.log();
  console.log(`  ${chalk.red('Critical Issues:')}     ${summary.criticalIssues}`);
  console.log(`  ${chalk.yellow('High Issues:')}         ${summary.highIssues}`);
  console.log(`  ${chalk.blue('Medium Issues:')}       ${summary.mediumIssues}`);
  console.log(`  ${chalk.gray('Low Issues:')}          ${summary.lowIssues}`);
  console.log();
}

function displayTechDebt(report: LegacyReport, detailed: boolean = false) {
  const { techDebt } = report;

  console.log(chalk.bold('🔧 Technical Debt'));
  console.log(chalk.gray('─'.repeat(60)));

  // Group by category
  const grouped = techDebt.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TechDebtItem[]>);

  Object.entries(grouped).forEach(([category, items]) => {
    console.log(chalk.bold(`\n  ${category}:`));

    const displayItems = detailed ? items : items.slice(0, 5);
    displayItems.forEach(item => {
      const icon = item.type === 'critical' ? chalk.red('✗')
        : item.type === 'high' ? chalk.yellow('⚠')
        : item.type === 'medium' ? chalk.blue('●')
        : chalk.gray('○');

      console.log(`    ${icon} ${item.description}`);
      console.log(chalk.gray(`      ${item.file} | Effort: ${item.effort}`));
      if (detailed) {
        console.log(chalk.green(`      → ${item.recommendation}`));
      }
    });

    if (!detailed && items.length > 5) {
      console.log(chalk.gray(`    ... and ${items.length - 5} more`));
    }
  });

  console.log();
}

function displayFrameworks(report: LegacyReport) {
  const { frameworks } = report;

  console.log(chalk.bold('📦 Framework Analysis'));
  console.log(chalk.gray('─'.repeat(60)));

  if (frameworks.detected.length > 0) {
    console.log(chalk.white('  Detected:'));
    frameworks.detected.forEach(f => {
      console.log(chalk.green(`    ✓ ${f}`));
    });
  }

  if (frameworks.outdated.length > 0) {
    console.log(chalk.white('\n  Outdated:'));
    frameworks.outdated.forEach(f => {
      const color = f.severity === 'high' ? chalk.red
        : f.severity === 'medium' ? chalk.yellow
        : chalk.gray;
      console.log(color(`    ⚠ ${f.name}: ${f.current} → ${f.latest}`));
    });
  }

  console.log();
}

function displayModernizationPlan(report: LegacyReport) {
  const { modernizationPlan } = report;

  if (modernizationPlan.length === 0) {
    console.log(chalk.green('\n✓ No significant modernization needed!\n'));
    return;
  }

  console.log(chalk.bold('📋 Modernization Plan'));
  console.log(chalk.gray('─'.repeat(60)));

  modernizationPlan.forEach(step => {
    console.log(chalk.bold(`\n  Phase ${step.phase}: ${step.name}`));
    console.log(chalk.gray(`  ${step.description}`));
    console.log(chalk.white(`  Effort: ${step.effort} | Impact: ${step.impact}`));

    if (step.dependencies.length > 0) {
      console.log(chalk.gray(`  Dependencies: ${step.dependencies.join(', ')}`));
    }

    console.log(chalk.white('  Tasks:'));
    step.tasks.slice(0, 5).forEach(task => {
      console.log(chalk.gray(`    • ${task}`));
    });
    if (step.tasks.length > 5) {
      console.log(chalk.gray(`    ... and ${step.tasks.length - 5} more`));
    }
  });

  console.log();
}

function displayRecommendations(report: LegacyReport) {
  if (report.recommendations.length === 0) return;

  console.log(chalk.bold('💡 Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));

  report.recommendations.forEach(rec => {
    console.log(`  → ${chalk.white(rec)}`);
  });

  console.log();
}

function calculateHealthScore(techDebt: TechDebtItem[], fileCount: number): number {
  if (fileCount === 0) return 100;

  // Weight by severity
  const weights = { critical: 10, high: 5, medium: 2, low: 1 };
  const totalWeight = techDebt.reduce((sum, item) => sum + weights[item.type], 0);

  // Score decreases with more issues relative to file count
  const issueRatio = totalWeight / fileCount;
  const score = Math.max(0, 100 - (issueRatio * 10));

  return Math.round(score);
}

function parseEffortToHours(effort: string): number {
  const match = effort.match(/(\d+(?:\.\d+)?)\s*(min|hr|hour|day|week)/i);
  if (!match) return 0.5; // Default 30 min

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'min': return value / 60;
    case 'hr':
    case 'hour':
    case 'hrs':
    case 'hours': return value;
    case 'day':
    case 'days': return value * 8;
    case 'week':
    case 'weeks': return value * 40;
    default: return value;
  }
}

function calculateTotalEffort(items: TechDebtItem[]): string {
  const totalHours = items.reduce((sum, item) => sum + parseEffortToHours(item.effort), 0);

  if (totalHours < 1) return `${Math.round(totalHours * 60)} minutes`;
  if (totalHours < 8) return `${totalHours.toFixed(1)} hours`;
  if (totalHours < 40) return `${(totalHours / 8).toFixed(1)} days`;
  return `${(totalHours / 40).toFixed(1)} weeks`;
}

function exportReport(report: LegacyReport, format: string) {
  const filename = `rana-legacy-report-${new Date().toISOString().split('T')[0]}`;

  if (format === 'json') {
    fs.writeFileSync(`${filename}.json`, JSON.stringify(report, null, 2));
    console.log(chalk.green(`✓ Report exported to ${filename}.json\n`));
  } else if (format === 'md' || format === 'markdown') {
    const md = generateMarkdownReport(report);
    fs.writeFileSync(`${filename}.md`, md);
    console.log(chalk.green(`✓ Report exported to ${filename}.md\n`));
  }
}

function generateMarkdownReport(report: LegacyReport): string {
  const { summary, techDebt, modernizationPlan, frameworks, recommendations } = report;

  let md = `# RANA Legacy Code Analysis Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Health Score | ${summary.healthScore}/100 |
| Files Analyzed | ${summary.analyzedFiles} |
| Technical Debt | ${summary.techDebtHours.toFixed(1)} hours (~$${summary.techDebtCost.toLocaleString()}) |
| Critical Issues | ${summary.criticalIssues} |
| High Issues | ${summary.highIssues} |
| Medium Issues | ${summary.mediumIssues} |
| Low Issues | ${summary.lowIssues} |

## Technical Debt

`;

  // Group by severity
  ['critical', 'high', 'medium', 'low'].forEach(severity => {
    const items = techDebt.filter(t => t.type === severity);
    if (items.length > 0) {
      md += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${items.length})\n\n`;
      items.slice(0, 10).forEach(item => {
        md += `- **${item.description}** - ${item.file}\n`;
        md += `  - Effort: ${item.effort}\n`;
        md += `  - Recommendation: ${item.recommendation}\n\n`;
      });
    }
  });

  md += `## Modernization Plan\n\n`;
  modernizationPlan.forEach(step => {
    md += `### Phase ${step.phase}: ${step.name}\n\n`;
    md += `${step.description}\n\n`;
    md += `- **Effort:** ${step.effort}\n`;
    md += `- **Impact:** ${step.impact}\n\n`;
    md += `Tasks:\n`;
    step.tasks.forEach(task => {
      md += `- ${task}\n`;
    });
    md += '\n';
  });

  md += `## Recommendations\n\n`;
  recommendations.forEach(rec => {
    md += `- ${rec}\n`;
  });

  md += `\n---\n*Generated by RANA CLI*\n`;

  return md;
}
