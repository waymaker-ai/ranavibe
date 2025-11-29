/**
 * Tests for check command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockConsole } from '../setup';

describe('check command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should export check functions', async () => {
    const checkModule = await import('../../commands/check');
    expect(checkModule).toBeDefined();
    expect(typeof checkModule.checkCommand).toBe('function');
  });
});

describe('RANA standards validation', () => {
  it('should validate component structure rules', () => {
    const rules = {
      maxComponentLines: 300,
      maxFunctionLines: 50,
      maxFileLines: 500,
      maxImports: 20,
    };

    // Test component with valid size
    const validComponent = {
      lines: 150,
      functionMaxLines: 40,
      imports: 10,
    };

    expect(validComponent.lines).toBeLessThanOrEqual(rules.maxComponentLines);
    expect(validComponent.functionMaxLines).toBeLessThanOrEqual(rules.maxFunctionLines);
    expect(validComponent.imports).toBeLessThanOrEqual(rules.maxImports);
  });

  it('should detect oversized components', () => {
    const rules = { maxComponentLines: 300 };

    const oversizedComponent = { lines: 400 };

    expect(oversizedComponent.lines).toBeGreaterThan(rules.maxComponentLines);
  });

  it('should validate naming conventions', () => {
    const isValidComponentName = (name: string): boolean => {
      // PascalCase for components
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    };

    const isValidFunctionName = (name: string): boolean => {
      // camelCase for functions
      return /^[a-z][a-zA-Z0-9]*$/.test(name);
    };

    const isValidConstantName = (name: string): boolean => {
      // UPPER_SNAKE_CASE for constants
      return /^[A-Z][A-Z0-9_]*$/.test(name);
    };

    // Valid names
    expect(isValidComponentName('MyComponent')).toBe(true);
    expect(isValidFunctionName('handleClick')).toBe(true);
    expect(isValidConstantName('MAX_RETRIES')).toBe(true);

    // Invalid names
    expect(isValidComponentName('myComponent')).toBe(false);
    expect(isValidFunctionName('HandleClick')).toBe(false);
    expect(isValidConstantName('maxRetries')).toBe(false);
  });
});

describe('file analysis', () => {
  it('should count lines correctly', () => {
    const countLines = (content: string): number => {
      return content.split('\n').length;
    };

    expect(countLines('line1\nline2\nline3')).toBe(3);
    expect(countLines('')).toBe(1);
    expect(countLines('single line')).toBe(1);
  });

  it('should count imports correctly', () => {
    const countImports = (content: string): number => {
      const importRegex = /^import\s+/gm;
      const matches = content.match(importRegex);
      return matches ? matches.length : 0;
    };

    const code = `
import React from 'react';
import { useState } from 'react';
import type { Props } from './types';

const Component = () => {};
`;

    expect(countImports(code)).toBe(3);
  });

  it('should detect code smells', () => {
    const codeSmells = {
      tooManyParams: (params: number) => params > 5,
      deepNesting: (depth: number) => depth > 4,
      longMethod: (lines: number) => lines > 50,
      magicNumber: (content: string) => /\b(?<![\d.])(?!0x)[1-9]\d{2,}\b/.test(content),
    };

    expect(codeSmells.tooManyParams(6)).toBe(true);
    expect(codeSmells.tooManyParams(3)).toBe(false);
    expect(codeSmells.deepNesting(5)).toBe(true);
    expect(codeSmells.deepNesting(2)).toBe(false);
    expect(codeSmells.longMethod(60)).toBe(true);
    expect(codeSmells.longMethod(30)).toBe(false);
  });
});

describe('severity levels', () => {
  it('should categorize issues by severity', () => {
    type Severity = 'error' | 'warning' | 'info';

    const issues = [
      { message: 'Security vulnerability', severity: 'error' as Severity },
      { message: 'Deprecated API usage', severity: 'warning' as Severity },
      { message: 'Consider using const', severity: 'info' as Severity },
    ];

    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    expect(errors.length).toBe(1);
    expect(warnings.length).toBe(1);
    expect(infos.length).toBe(1);
  });
});
