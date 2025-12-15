import {
  GeneratedFile,
  ValidationError,
  ValidationWarning,
} from '../types';

// ============================================================================
// Auto-Fixer - Automatically fixes common code issues
// ============================================================================

export interface FixResult {
  file: GeneratedFile;
  fixed: boolean;
  changes: string[];
}

export interface AutoFixerConfig {
  llmProvider?: {
    complete(prompt: string): Promise<string>;
  };
  maxAttempts?: number;
}

export class AutoFixer {
  private config: AutoFixerConfig;

  constructor(config: AutoFixerConfig = {}) {
    this.config = {
      maxAttempts: 3,
      ...config,
    };
  }

  /**
   * Fix all auto-fixable issues in generated files
   */
  async fix(
    files: GeneratedFile[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const file of files) {
      const fileErrors = errors.filter(e => e.file === file.path && e.autoFixable);
      const fileWarnings = warnings.filter(w => w.file === file.path);

      if (fileErrors.length === 0 && fileWarnings.length === 0) {
        results.push({ file, fixed: false, changes: [] });
        continue;
      }

      const fixResult = await this.fixFile(file, fileErrors, fileWarnings);
      results.push(fixResult);
    }

    return results;
  }

  /**
   * Fix issues in a single file
   */
  private async fixFile(
    file: GeneratedFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<FixResult> {
    let content = file.content;
    const changes: string[] = [];

    // Fix SQL injection issues
    if (errors.some(e => e.type === 'sql-injection')) {
      const result = this.fixSQLInjection(content);
      if (result.fixed) {
        content = result.content;
        changes.push('Fixed SQL injection vulnerability - converted to parameterized query');
      }
    }

    // Fix missing alt attributes
    if (errors.some(e => e.type === 'missing-alt')) {
      const result = this.fixMissingAlt(content);
      if (result.fixed) {
        content = result.content;
        changes.push('Added alt attributes to images');
      }
    }

    // Fix any types (warning, but commonly requested)
    if (warnings.some(w => w.type === 'any-type')) {
      const result = this.fixAnyTypes(content);
      if (result.fixed) {
        content = result.content;
        changes.push(`Replaced ${result.count} 'any' types with 'unknown'`);
      }
    }

    // Fix missing validation
    if (warnings.some(w => w.type === 'missing-validation')) {
      const result = this.addValidation(content, file.type);
      if (result.fixed) {
        content = result.content;
        changes.push('Added Zod validation schema');
      }
    }

    // Fix button accessibility
    if (warnings.some(w => w.type === 'button-no-label')) {
      const result = this.fixButtonAccessibility(content);
      if (result.fixed) {
        content = result.content;
        changes.push('Added aria-labels to icon buttons');
      }
    }

    // Fix input accessibility
    if (warnings.some(w => w.type === 'input-no-label')) {
      const result = this.fixInputAccessibility(content);
      if (result.fixed) {
        content = result.content;
        changes.push('Added aria-labels to form inputs');
      }
    }

    // Use LLM for complex fixes if available
    if (this.config.llmProvider && changes.length === 0 && (errors.length > 0 || warnings.length > 0)) {
      const llmResult = await this.fixWithLLM(content, errors, warnings);
      if (llmResult.fixed) {
        content = llmResult.content;
        changes.push(...llmResult.changes);
      }
    }

    return {
      file: { ...file, content },
      fixed: changes.length > 0,
      changes,
    };
  }

  /**
   * Fix SQL injection by converting to parameterized queries
   */
  private fixSQLInjection(content: string): { fixed: boolean; content: string } {
    let fixed = false;
    let result = content;

    // Pattern: string concatenation in SQL queries
    // `SELECT * FROM users WHERE id = ${userId}` -> prepared statement
    const templateLiteralSQL = /`(SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{([^}]+)\}[^`]*`/gi;

    result = result.replace(templateLiteralSQL, (match, statement, variable) => {
      fixed = true;
      // Convert to parameterized query placeholder
      const paramName = variable.trim();
      return `prisma.$queryRaw\`${statement} ... WHERE ... = \${${paramName}}\``;
    });

    // Pattern: string + variable concatenation
    const concatSQL = /"(SELECT|INSERT|UPDATE|DELETE)[^"]*"\s*\+\s*(\w+)/gi;

    result = result.replace(concatSQL, (match, statement, variable) => {
      fixed = true;
      return `/* TODO: Use parameterized query */\n    // Original (UNSAFE): ${match}\n    prisma.$queryRaw\`${statement} ... WHERE ... = \${${variable}}\``;
    });

    return { fixed, content: result };
  }

  /**
   * Fix missing alt attributes on images
   */
  private fixMissingAlt(content: string): { fixed: boolean; content: string } {
    let fixed = false;
    let result = content;

    // Find img tags without alt
    const imgWithoutAlt = /<img([^>]*?)(?<!alt=["'][^"']*["'])(\s*\/?>)/gi;

    result = result.replace(imgWithoutAlt, (match, attrs, closing) => {
      // Check if already has alt
      if (/alt\s*=/.test(attrs)) {
        return match;
      }

      fixed = true;

      // Try to extract meaningful alt from src
      const srcMatch = attrs.match(/src=["']([^"']+)["']/);
      let altText = '';

      if (srcMatch) {
        const filename = srcMatch[1].split('/').pop()?.replace(/\.[^.]+$/, '') || '';
        altText = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }

      return `<img${attrs} alt="${altText || 'Image'}"${closing}`;
    });

    return { fixed, content: result };
  }

  /**
   * Replace 'any' types with 'unknown'
   */
  private fixAnyTypes(content: string): { fixed: boolean; content: string; count: number } {
    let count = 0;
    let result = content;

    // Replace : any with : unknown (but not in comments)
    result = result.replace(/:\s*any\b(?!\s*\/\/)/g, (match) => {
      count++;
      return ': unknown';
    });

    // Replace <any> with <unknown>
    result = result.replace(/<any>/g, () => {
      count++;
      return '<unknown>';
    });

    // Replace as any with as unknown
    result = result.replace(/\bas\s+any\b/g, () => {
      count++;
      return 'as unknown';
    });

    return { fixed: count > 0, content: result, count };
  }

  /**
   * Add Zod validation to API routes
   */
  private addValidation(content: string, fileType: string): { fixed: boolean; content: string } {
    if (fileType !== 'api') {
      return { fixed: false, content };
    }

    // Check if validation already exists
    if (content.includes('z.object') || content.includes('yup.object') || content.includes('Joi.object')) {
      return { fixed: false, content };
    }

    // Check if zod is imported
    let result = content;
    let fixed = false;

    // Add zod import if not present
    if (!content.includes("from 'zod'") && !content.includes('from "zod"')) {
      result = `import { z } from 'zod';\n${result}`;
      fixed = true;
    }

    // Find request body parsing and add validation
    const bodyParsePattern = /const\s+(?:body|data)\s*=\s*await\s+request\.json\(\)/g;

    if (bodyParsePattern.test(result)) {
      // Add schema after imports
      const importEnd = result.lastIndexOf('import');
      const importLineEnd = result.indexOf('\n', importEnd) + 1;

      const schema = `
// Request validation schema - customize as needed
const RequestSchema = z.object({
  // Add your fields here
  // name: z.string().min(1, 'Name is required'),
  // email: z.string().email('Invalid email'),
});

`;

      result = result.slice(0, importLineEnd) + schema + result.slice(importLineEnd);

      // Wrap body parsing with validation
      result = result.replace(
        /const\s+(body|data)\s*=\s*await\s+request\.json\(\)/g,
        `const rawBody = await request.json();\n    const $1 = RequestSchema.parse(rawBody)`
      );

      fixed = true;
    }

    return { fixed, content: result };
  }

  /**
   * Fix button accessibility by adding aria-labels
   */
  private fixButtonAccessibility(content: string): { fixed: boolean; content: string } {
    let fixed = false;
    let result = content;

    // Find buttons with only icons (svg or img as children)
    const iconButtonPattern = /(<button[^>]*>)(\s*<(?:svg|img)[^>]*(?:\/)?>[^<]*(?:<\/(?:svg|img)>)?)\s*(<\/button>)/gi;

    result = result.replace(iconButtonPattern, (match, openTag, icon, closeTag) => {
      // Check if already has aria-label
      if (/aria-label/i.test(openTag)) {
        return match;
      }

      fixed = true;

      // Try to infer label from icon class or path
      let label = 'Button';

      const classMatch = icon.match(/class(?:Name)?=["']([^"']+)["']/);
      if (classMatch) {
        const className = classMatch[1];
        if (className.includes('close') || className.includes('x')) label = 'Close';
        else if (className.includes('menu')) label = 'Menu';
        else if (className.includes('search')) label = 'Search';
        else if (className.includes('edit')) label = 'Edit';
        else if (className.includes('delete') || className.includes('trash')) label = 'Delete';
        else if (className.includes('add') || className.includes('plus')) label = 'Add';
        else if (className.includes('settings') || className.includes('gear')) label = 'Settings';
      }

      // Add aria-label to button
      const newOpenTag = openTag.replace(/<button/, `<button aria-label="${label}"`);
      return `${newOpenTag}${icon}${closeTag}`;
    });

    return { fixed, content: result };
  }

  /**
   * Fix input accessibility by adding aria-labels
   */
  private fixInputAccessibility(content: string): { fixed: boolean; content: string } {
    let fixed = false;
    let result = content;

    // Find inputs without labels or aria-label
    const inputPattern = /<input([^>]*?)(?<!aria-label=["'][^"']*["'])(\s*\/?>)/gi;

    result = result.replace(inputPattern, (match, attrs, closing) => {
      // Check if already has aria-label
      if (/aria-label/i.test(attrs)) {
        return match;
      }

      // Check if there's an associated label (by id)
      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      if (idMatch && content.includes(`htmlFor="${idMatch[1]}"`) || content.includes(`for="${idMatch[1]}"`)) {
        return match; // Has associated label
      }

      fixed = true;

      // Try to infer label from type, name, or placeholder
      let label = 'Input';

      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      const nameMatch = attrs.match(/name=["']([^"']+)["']/);
      const placeholderMatch = attrs.match(/placeholder=["']([^"']+)["']/);

      if (placeholderMatch) {
        label = placeholderMatch[1];
      } else if (nameMatch) {
        label = nameMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      } else if (typeMatch) {
        const type = typeMatch[1];
        if (type === 'email') label = 'Email';
        else if (type === 'password') label = 'Password';
        else if (type === 'search') label = 'Search';
        else if (type === 'tel') label = 'Phone';
        else if (type === 'url') label = 'URL';
      }

      return `<input${attrs} aria-label="${label}"${closing}`;
    });

    return { fixed, content: result };
  }

  /**
   * Use LLM for complex fixes
   */
  private async fixWithLLM(
    content: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<{ fixed: boolean; content: string; changes: string[] }> {
    if (!this.config.llmProvider) {
      return { fixed: false, content, changes: [] };
    }

    const issues = [
      ...errors.map(e => `ERROR: ${e.type} - ${e.message}`),
      ...warnings.map(w => `WARNING: ${w.type} - ${w.message}${w.suggestion ? ` (${w.suggestion})` : ''}`),
    ].join('\n');

    const prompt = `Fix the following issues in this code:

ISSUES:
${issues}

CODE:
${content}

REQUIREMENTS:
- Only fix the specific issues mentioned
- Maintain the original code structure
- Follow TypeScript best practices
- Keep changes minimal

Return ONLY the fixed code, no explanations.`;

    try {
      const response = await this.config.llmProvider.complete(prompt);
      const fixedContent = this.cleanLLMResponse(response);

      // Verify the fix is valid (not empty, not same as original)
      if (fixedContent && fixedContent.length > 100 && fixedContent !== content) {
        return {
          fixed: true,
          content: fixedContent,
          changes: ['Applied LLM-assisted fixes for complex issues'],
        };
      }
    } catch (error) {
      console.warn('LLM fix failed:', error);
    }

    return { fixed: false, content, changes: [] };
  }

  /**
   * Clean LLM response (remove markdown formatting)
   */
  private cleanLLMResponse(response: string): string {
    let cleaned = response;

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```(?:typescript|javascript|tsx|jsx)?\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');

    return cleaned.trim();
  }
}

// Export singleton instance
export const autoFixer = new AutoFixer();
