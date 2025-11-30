/**
 * RANA Documentation Management
 *
 * Tools for managing project documentation, tracking status,
 * and ensuring document health.
 *
 * @example
 * ```bash
 * # Check document health
 * rana docs:check
 *
 * # List all documents with status
 * rana docs:list
 *
 * # Show project status summary
 * rana docs:status
 *
 * # Archive deprecated documents
 * rana docs:archive
 *
 * # Validate document frontmatter
 * rana docs:validate
 * ```
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentMeta {
  path: string;
  title: string;
  version?: string;
  lastUpdated?: string;
  status?: 'Active' | 'Deprecated' | 'Draft' | 'Review';
  supersededBy?: string;
  todoCount?: { open: number; closed: number };
  issues: string[];
}

/**
 * Check document health across the project
 */
export async function docsCheckCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n📚 RANA Documentation Health Check\n'));

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('Not in a RANA project directory.'));
    return;
  }

  const docs = await scanDocuments(projectRoot);
  const issues: string[] = [];
  let healthy = 0;
  let warnings = 0;
  let errors = 0;

  for (const doc of docs) {
    if (doc.issues.length === 0) {
      healthy++;
    } else {
      const hasError = doc.issues.some(i => i.startsWith('ERROR'));
      if (hasError) errors++;
      else warnings++;
    }
  }

  // Summary
  console.log(chalk.gray(`Scanned ${docs.length} documents\n`));
  console.log(chalk.green(`  ✓ ${healthy} healthy`));
  if (warnings > 0) console.log(chalk.yellow(`  ⚠ ${warnings} with warnings`));
  if (errors > 0) console.log(chalk.red(`  ✗ ${errors} with errors`));
  console.log('');

  // Show issues
  const docsWithIssues = docs.filter(d => d.issues.length > 0);
  if (docsWithIssues.length > 0) {
    console.log(chalk.bold('Issues Found:\n'));

    for (const doc of docsWithIssues) {
      const relativePath = path.relative(projectRoot, doc.path);
      console.log(chalk.white(`  ${relativePath}`));

      for (const issue of doc.issues) {
        const color = issue.startsWith('ERROR') ? chalk.red : chalk.yellow;
        console.log(color(`    - ${issue}`));
      }
      console.log('');
    }
  }

  // Open todos summary
  const totalOpen = docs.reduce((sum, d) => sum + (d.todoCount?.open || 0), 0);
  const totalClosed = docs.reduce((sum, d) => sum + (d.todoCount?.closed || 0), 0);

  if (totalOpen > 0 || totalClosed > 0) {
    console.log(chalk.bold('Todo Items:\n'));
    console.log(`  Open:   ${chalk.yellow(totalOpen.toString())}`);
    console.log(`  Closed: ${chalk.green(totalClosed.toString())}`);
    console.log(`  Total:  ${totalOpen + totalClosed}`);
    console.log('');
  }

  // Recommendations
  if (errors > 0 || warnings > 0) {
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('\nRecommendations:\n'));

    if (errors > 0) {
      console.log(chalk.white('1. Fix documents with missing frontmatter:'));
      console.log(chalk.cyan('   Add Version, Last Updated, and Status fields\n'));
    }

    const deprecated = docs.filter(d => d.status === 'Deprecated');
    if (deprecated.length > 0) {
      console.log(chalk.white('2. Archive deprecated documents:'));
      console.log(chalk.cyan('   rana docs:archive\n'));
    }

    const stale = docs.filter(d => isStale(d.lastUpdated));
    if (stale.length > 0) {
      console.log(chalk.white(`3. Review ${stale.length} stale documents (>30 days old)`));
      console.log(chalk.gray('   Consider updating or deprecating them\n'));
    }
  }
}

/**
 * List all documents with their status
 */
export async function docsListCommand(options: { all?: boolean }): Promise<void> {
  console.log(chalk.bold.cyan('\n📚 Project Documents\n'));

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('Not in a RANA project directory.'));
    return;
  }

  const docs = await scanDocuments(projectRoot);

  // Group by status
  const byStatus: Record<string, DocumentMeta[]> = {
    Active: [],
    Draft: [],
    Review: [],
    Deprecated: [],
    Unknown: [],
  };

  for (const doc of docs) {
    const status = doc.status || 'Unknown';
    byStatus[status] = byStatus[status] || [];
    byStatus[status].push(doc);
  }

  // Display
  const statusOrder = ['Active', 'Draft', 'Review', 'Unknown', 'Deprecated'];

  for (const status of statusOrder) {
    const statusDocs = byStatus[status];
    if (!statusDocs || statusDocs.length === 0) continue;

    if (status === 'Deprecated' && !options.all) {
      console.log(chalk.gray(`\n${status} (${statusDocs.length} hidden - use --all to show)`));
      continue;
    }

    const statusColor =
      status === 'Active' ? chalk.green :
      status === 'Deprecated' ? chalk.gray :
      status === 'Draft' ? chalk.blue :
      status === 'Review' ? chalk.yellow :
      chalk.white;

    console.log(statusColor(`\n${status} (${statusDocs.length})`));
    console.log(chalk.gray('─'.repeat(40)));

    for (const doc of statusDocs) {
      const relativePath = path.relative(projectRoot, doc.path);
      const updated = doc.lastUpdated || 'Unknown';
      const todos = doc.todoCount?.open ? chalk.yellow(` [${doc.todoCount.open} open]`) : '';

      console.log(`  ${chalk.white(relativePath)}${todos}`);
      console.log(chalk.gray(`    v${doc.version || '?'} | Updated: ${updated}`));
    }
  }

  console.log('');
}

/**
 * Show project status summary
 */
export async function docsStatusCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n📊 RANA Project Status\n'));

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('Not in a RANA project directory.'));
    return;
  }

  // Read STATUS.md if it exists
  const statusFile = path.join(projectRoot, '.ai', 'STATUS.md');
  if (fs.existsSync(statusFile)) {
    const content = fs.readFileSync(statusFile, 'utf-8');

    // Extract quick summary table
    const summaryMatch = content.match(/\| Metric \| Value \|[\s\S]*?\n\n/);
    if (summaryMatch) {
      console.log(chalk.bold('Quick Summary:'));
      const lines = summaryMatch[0].split('\n').filter(l => l.includes('|') && !l.includes('---'));
      for (const line of lines.slice(1)) { // Skip header
        const [, metric, value] = line.split('|').map(s => s.trim());
        if (metric && value) {
          console.log(`  ${chalk.gray(metric + ':')} ${chalk.white(value)}`);
        }
      }
      console.log('');
    }

    // Extract current priorities
    const prioritiesMatch = content.match(/### 🔴 High Priority[\s\S]*?(?=###|---)/);
    if (prioritiesMatch) {
      console.log(chalk.bold('Current Priorities:'));
      const items = prioritiesMatch[0].match(/\d\. \*\*[^*]+\*\*/g) || [];
      for (const item of items.slice(0, 3)) {
        const name = item.match(/\*\*([^*]+)\*\*/)?.[1];
        console.log(chalk.yellow(`  → ${name}`));
      }
      console.log('');
    }
  }

  // Count open items in ROADMAP
  const roadmapFile = path.join(projectRoot, 'ROADMAP.md');
  if (fs.existsSync(roadmapFile)) {
    const content = fs.readFileSync(roadmapFile, 'utf-8');
    const open = (content.match(/- \[ \]/g) || []).length;
    const closed = (content.match(/- \[x\]/g) || []).length;

    console.log(chalk.bold('Roadmap Progress:'));
    const percent = Math.round((closed / (open + closed)) * 100);
    const bar = createProgressBar(percent, 30);
    console.log(`  ${bar} ${percent}%`);
    console.log(chalk.gray(`  ${closed} complete, ${open} remaining\n`));
  }

  // Recent activity from git
  try {
    const { execSync } = await import('child_process');
    const log = execSync('git log --oneline -5', { cwd: projectRoot, encoding: 'utf-8' });

    console.log(chalk.bold('Recent Activity:'));
    for (const line of log.trim().split('\n')) {
      console.log(chalk.gray(`  ${line}`));
    }
    console.log('');
  } catch {
    // Git not available
  }

  console.log(chalk.gray('Full status: cat .ai/STATUS.md'));
  console.log(chalk.gray('Full roadmap: cat ROADMAP.md\n'));
}

/**
 * Archive deprecated documents
 */
export async function docsArchiveCommand(options: { dryRun?: boolean }): Promise<void> {
  console.log(chalk.bold.cyan('\n📦 Archive Deprecated Documents\n'));

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('Not in a RANA project directory.'));
    return;
  }

  const docs = await scanDocuments(projectRoot);
  const deprecated = docs.filter(d => d.status === 'Deprecated');

  if (deprecated.length === 0) {
    console.log(chalk.green('No deprecated documents to archive.\n'));
    return;
  }

  const archiveDir = path.join(projectRoot, '.archive');

  console.log(`Found ${deprecated.length} deprecated document(s):\n`);

  for (const doc of deprecated) {
    const relativePath = path.relative(projectRoot, doc.path);
    const archivePath = path.join(archiveDir, relativePath);

    console.log(chalk.gray(`  ${relativePath}`));
    console.log(chalk.gray(`    → ${path.relative(projectRoot, archivePath)}`));

    if (!options.dryRun) {
      // Create archive directory
      const archiveSubdir = path.dirname(archivePath);
      if (!fs.existsSync(archiveSubdir)) {
        fs.mkdirSync(archiveSubdir, { recursive: true });
      }

      // Move file
      fs.renameSync(doc.path, archivePath);
      console.log(chalk.green('    ✓ Archived'));
    } else {
      console.log(chalk.yellow('    (dry run - not moved)'));
    }
  }

  console.log('');

  if (options.dryRun) {
    console.log(chalk.gray('Run without --dry-run to archive files.\n'));
  } else {
    console.log(chalk.green(`✓ Archived ${deprecated.length} document(s)\n`));
  }
}

/**
 * Validate document frontmatter
 */
export async function docsValidateCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n✅ Validate Document Frontmatter\n'));

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('Not in a RANA project directory.'));
    return;
  }

  const docs = await scanDocuments(projectRoot);
  let valid = 0;
  let invalid = 0;

  for (const doc of docs) {
    const relativePath = path.relative(projectRoot, doc.path);
    const issues: string[] = [];

    if (!doc.version) issues.push('Missing Version');
    if (!doc.lastUpdated) issues.push('Missing Last Updated');
    if (!doc.status) issues.push('Missing Status');

    if (issues.length === 0) {
      valid++;
      console.log(chalk.green(`  ✓ ${relativePath}`));
    } else {
      invalid++;
      console.log(chalk.red(`  ✗ ${relativePath}`));
      for (const issue of issues) {
        console.log(chalk.gray(`    - ${issue}`));
      }
    }
  }

  console.log('');
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`${chalk.green(`Valid: ${valid}`)} | ${chalk.red(`Invalid: ${invalid}`)}`);
  console.log('');

  if (invalid > 0) {
    console.log(chalk.bold('Required Frontmatter:\n'));
    console.log(chalk.gray('  **Version:** X.Y.Z'));
    console.log(chalk.gray('  **Last Updated:** YYYY-MM-DD'));
    console.log(chalk.gray('  **Status:** Active | Deprecated | Draft | Review\n'));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find project root by looking for package.json or .rana.yml
 */
function findProjectRoot(): string | null {
  let dir = process.cwd();

  while (dir !== path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, '.rana.yml')) ||
      fs.existsSync(path.join(dir, 'ROADMAP.md'))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return null;
}

/**
 * Scan for markdown documents
 */
async function scanDocuments(projectRoot: string): Promise<DocumentMeta[]> {
  const docs: DocumentMeta[] = [];
  const ignoreDirs = ['node_modules', '.git', 'dist', '.next', '.archive'];

  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.name.endsWith('.md')) {
        const meta = parseDocumentMeta(fullPath);
        docs.push(meta);
      }
    }
  }

  scan(projectRoot);
  return docs;
}

/**
 * Parse document metadata from frontmatter
 */
function parseDocumentMeta(filePath: string): DocumentMeta {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] || path.basename(filePath, '.md');

  // Extract frontmatter fields
  const versionMatch = content.match(/\*\*Version:\*\*\s*(.+)/);
  const updatedMatch = content.match(/\*\*Last Updated:\*\*\s*(.+)/);
  const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
  const supersededMatch = content.match(/\*\*Superseded By:\*\*\s*\[([^\]]+)\]/);

  // Count todos
  const openTodos = (content.match(/- \[ \]/g) || []).length;
  const closedTodos = (content.match(/- \[x\]/g) || []).length;

  // Identify issues
  if (!versionMatch) issues.push('WARNING: Missing Version field');
  if (!updatedMatch) issues.push('WARNING: Missing Last Updated field');
  if (!statusMatch) issues.push('ERROR: Missing Status field');

  const status = statusMatch?.[1] as DocumentMeta['status'];
  if (status === 'Deprecated' && !supersededMatch) {
    issues.push('WARNING: Deprecated without Superseded By link');
  }

  if (updatedMatch && isStale(updatedMatch[1])) {
    issues.push('WARNING: Document may be stale (>30 days since update)');
  }

  return {
    path: filePath,
    title,
    version: versionMatch?.[1],
    lastUpdated: updatedMatch?.[1],
    status,
    supersededBy: supersededMatch?.[1],
    todoCount: { open: openTodos, closed: closedTodos },
    issues,
  };
}

/**
 * Check if a date is stale (>30 days old)
 */
function isStale(dateStr?: string): boolean {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date < thirtyDaysAgo;
  } catch {
    return false;
  }
}

/**
 * Create a visual progress bar
 */
function createProgressBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
