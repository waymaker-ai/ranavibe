import type { Finding, ScanConfig } from '../types.js';

/**
 * Keywords that indicate LLM/prompt context in template literals.
 */
const LLM_KEYWORDS = [
  'prompt',
  'system',
  'assistant',
  'user',
  'instruction',
  'completion',
  'chat',
  'message',
  'gpt',
  'claude',
  'gemini',
  'llm',
  'ai',
  'model',
  'generate',
  'inference',
  'embedding',
  'token',
  'context',
  'role',
];

const LLM_KEYWORD_REGEX = new RegExp(`\\b(${LLM_KEYWORDS.join('|')})\\b`, 'i');

/** Detect template literal starts */
const TEMPLATE_LITERAL_START = /`[^`]*$/;
const TEMPLATE_LITERAL_END = /^[^`]*`/;
const SINGLE_LINE_TEMPLATE = /`[^`]*`/g;

/** Python triple-quoted strings */
const PYTHON_TRIPLE_START = /(?:f?)("""|''')[^]*$/;
const PYTHON_TRIPLE_END = /^[^]*?("""|''')/;

interface PromptTemplate {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  hasInterpolation: boolean;
}

/**
 * Detect prompt templates in source code by finding template literals
 * and multi-line strings that contain LLM-related keywords.
 */
export function detectPromptTemplates(
  filePath: string,
  content: string,
  _config: ScanConfig,
): PromptTemplate[] {
  const templates: PromptTemplate[] = [];
  const lines = content.split('\n');

  let inTemplateLiteral = false;
  let templateStart = 0;
  let templateContent = '';

  let inPythonTriple = false;
  let pythonTripleStart = 0;
  let pythonTripleContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle JS/TS template literals
    if (!inTemplateLiteral) {
      // Check for single-line template literals with LLM keywords
      SINGLE_LINE_TEMPLATE.lastIndex = 0;
      let singleMatch: RegExpExecArray | null;
      while ((singleMatch = SINGLE_LINE_TEMPLATE.exec(line)) !== null) {
        const tplContent = singleMatch[0];
        if (LLM_KEYWORD_REGEX.test(tplContent)) {
          templates.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            content: tplContent,
            hasInterpolation: tplContent.includes('${'),
          });
        }
      }

      // Check for multi-line template literal start
      if (TEMPLATE_LITERAL_START.test(line)) {
        // Count unescaped backticks to determine state
        const backticks = (line.match(/(?<!\\)`/g) || []).length;
        if (backticks % 2 !== 0) {
          inTemplateLiteral = true;
          templateStart = i;
          templateContent = line;
        }
      }
    } else {
      templateContent += '\n' + line;
      if (TEMPLATE_LITERAL_END.test(line)) {
        const backticks = (line.match(/(?<!\\)`/g) || []).length;
        if (backticks % 2 !== 0) {
          inTemplateLiteral = false;
          if (LLM_KEYWORD_REGEX.test(templateContent)) {
            templates.push({
              file: filePath,
              startLine: templateStart + 1,
              endLine: i + 1,
              content: templateContent,
              hasInterpolation: templateContent.includes('${'),
            });
          }
          templateContent = '';
        }
      }
    }

    // Handle Python triple-quoted strings
    if (!inPythonTriple) {
      if (PYTHON_TRIPLE_START.test(line)) {
        const tripleQuotes = (line.match(/"""|'''/g) || []).length;
        if (tripleQuotes === 1) {
          inPythonTriple = true;
          pythonTripleStart = i;
          pythonTripleContent = line;
        } else if (tripleQuotes >= 2) {
          // Single line triple-quoted
          if (LLM_KEYWORD_REGEX.test(line)) {
            templates.push({
              file: filePath,
              startLine: i + 1,
              endLine: i + 1,
              content: line,
              hasInterpolation: line.includes('{') && line.startsWith('f'),
            });
          }
        }
      }
    } else {
      pythonTripleContent += '\n' + line;
      if (PYTHON_TRIPLE_END.test(line)) {
        inPythonTriple = false;
        if (LLM_KEYWORD_REGEX.test(pythonTripleContent)) {
          templates.push({
            file: filePath,
            startLine: pythonTripleStart + 1,
            endLine: i + 1,
            content: pythonTripleContent,
            hasInterpolation: pythonTripleContent.includes('{') &&
              /f["']/.test(pythonTripleContent),
          });
        }
        pythonTripleContent = '';
      }
    }
  }

  return templates;
}

/**
 * Scan for prompt templates and return findings for templates
 * with user input interpolation.
 */
export function scanPromptTemplates(
  filePath: string,
  content: string,
  config: ScanConfig,
): Finding[] {
  const templates = detectPromptTemplates(filePath, content, config);
  const findings: Finding[] = [];

  for (const template of templates) {
    if (template.hasInterpolation) {
      findings.push({
        file: template.file,
        line: template.startLine,
        column: 1,
        rule: 'prompt-template',
        severity: 'info',
        message: `Prompt template with interpolation detected (lines ${template.startLine}-${template.endLine}).`,
        suggestion: 'Ensure interpolated values are validated and sanitized before being included in prompts.',
        source: template.content.split('\n')[0].trim(),
      });
    }
  }

  return findings;
}
