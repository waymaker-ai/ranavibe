/**
 * Tests for create-aicofounder-app scaffolding tool.
 *
 * Tests cover: project generation, template content, package.json structure,
 * tsconfig generation, config files, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

vi.mock('commander', () => {
  class Command {
    name() { return this; }
    version() { return this; }
    description() { return this; }
    argument() { return this; }
    option() { return this; }
    action() { return this; }
    parse() { return this; }
  }
  return { Command };
});

vi.mock('prompts', () => ({ default: vi.fn() }));

import {
  scaffoldProject,
  generatePackageJson,
  generateTsconfig,
  generateCoFounderConfig,
  generateGitignore,
  generateEnvExample,
  generateReadme,
  generateChatbotSource,
  generateAgentSource,
  generateApiGuardSource,
  generateFullStackFiles,
  mkdirp,
  TEMPLATES,
} from '../index.js';
import type { CreateOptions, Template } from '../index.js';

// ---- Test helpers ----

let tmpDir: string;

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-aicofounder-app-test-'));
}

function makeOptions(overrides: Partial<CreateOptions> = {}): CreateOptions {
  return {
    projectName: 'test-project',
    template: 'chatbot',
    packageManager: 'npm',
    skipInstall: true,
    skipGit: true,
    ...overrides,
  };
}

beforeEach(() => {
  tmpDir = createTmpDir();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---- Template registry ----

describe('Template Registry', () => {
  it('should have four templates defined', () => {
    expect(Object.keys(TEMPLATES)).toHaveLength(4);
  });

  it('should include chatbot template', () => {
    expect(TEMPLATES.chatbot).toBeDefined();
    expect(TEMPLATES.chatbot.name).toBe('Chatbot');
  });

  it('should include agent template', () => {
    expect(TEMPLATES.agent).toBeDefined();
    expect(TEMPLATES.agent.name).toBe('Agent');
  });

  it('should include api-guard template', () => {
    expect(TEMPLATES['api-guard']).toBeDefined();
    expect(TEMPLATES['api-guard'].name).toBe('API Guard');
  });

  it('should include full-stack template', () => {
    expect(TEMPLATES['full-stack']).toBeDefined();
    expect(TEMPLATES['full-stack'].name).toBe('Full-Stack');
  });
});

// ---- Package.json generation ----

describe('generatePackageJson', () => {
  it('should produce valid JSON', () => {
    const json = generatePackageJson('my-app', 'chatbot');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should set the project name', () => {
    const pkg = JSON.parse(generatePackageJson('my-cool-app', 'chatbot'));
    expect(pkg.name).toBe('my-cool-app');
  });

  it('should mark package as private', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'chatbot'));
    expect(pkg.private).toBe(true);
  });

  it('should use ESM module type', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'chatbot'));
    expect(pkg.type).toBe('module');
  });

  it('should include core dependency for all templates', () => {
    for (const template of Object.keys(TEMPLATES) as Template[]) {
      const pkg = JSON.parse(generatePackageJson('test', template));
      expect(pkg.dependencies['@waymakerai/aicofounder-core']).toBeDefined();
    }
  });

  it('should include guard dependency for all templates', () => {
    for (const template of Object.keys(TEMPLATES) as Template[]) {
      const pkg = JSON.parse(generatePackageJson('test', template));
      expect(pkg.dependencies['@waymakerai/aicofounder-guard']).toBeDefined();
    }
  });

  it('should include express for api-guard template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'api-guard'));
    expect(pkg.dependencies['express']).toBeDefined();
    expect(pkg.devDependencies['@types/express']).toBeDefined();
  });

  it('should include anthropic SDK for agent template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'agent'));
    expect(pkg.dependencies['@anthropic-ai/sdk']).toBeDefined();
  });

  it('should include next and react for full-stack template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'full-stack'));
    expect(pkg.dependencies['next']).toBeDefined();
    expect(pkg.dependencies['react']).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
  });

  it('should include react package for full-stack template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'full-stack'));
    expect(pkg.dependencies['@waymakerai/aicofounder-react']).toBeDefined();
  });

  it('should have dev script for chatbot template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'chatbot'));
    expect(pkg.scripts.dev).toContain('tsx');
  });

  it('should have next dev script for full-stack template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'full-stack'));
    expect(pkg.scripts.dev).toBe('next dev');
  });

  it('should include streaming dep for chatbot template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'chatbot'));
    expect(pkg.dependencies['@waymakerai/aicofounder-streaming']).toBeDefined();
  });

  it('should include agents dep for agent template', () => {
    const pkg = JSON.parse(generatePackageJson('test', 'agent'));
    expect(pkg.dependencies['@waymakerai/aicofounder-agents']).toBeDefined();
  });
});

// ---- tsconfig generation ----

describe('generateTsconfig', () => {
  it('should produce valid JSON', () => {
    const json = generateTsconfig('chatbot');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should enable strict mode', () => {
    const config = JSON.parse(generateTsconfig('chatbot'));
    expect(config.compilerOptions.strict).toBe(true);
  });

  it('should use ESNext module for all templates', () => {
    for (const template of ['chatbot', 'agent', 'api-guard'] as Template[]) {
      const config = JSON.parse(generateTsconfig(template));
      expect(config.compilerOptions.module).toBe('ESNext');
    }
  });

  it('should set outDir to dist for non-nextjs templates', () => {
    const config = JSON.parse(generateTsconfig('chatbot'));
    expect(config.compilerOptions.outDir).toBe('dist');
  });

  it('should include jsx preserve for full-stack template', () => {
    const config = JSON.parse(generateTsconfig('full-stack'));
    expect(config.compilerOptions.jsx).toBe('preserve');
  });

  it('should include DOM lib for full-stack template', () => {
    const config = JSON.parse(generateTsconfig('full-stack'));
    expect(config.compilerOptions.lib).toContain('DOM');
  });

  it('should not have outDir for full-stack template', () => {
    const config = JSON.parse(generateTsconfig('full-stack'));
    expect(config.compilerOptions.outDir).toBeUndefined();
  });
});

// ---- CoFounder config ----

describe('generateCoFounderConfig', () => {
  it('should contain guard rules', () => {
    const config = generateCoFounderConfig('chatbot');
    expect(config).toContain('no-pii-in-prompts');
    expect(config).toContain('no-injection-vuln');
    expect(config).toContain('no-hardcoded-keys');
    expect(config).toContain('approved-models');
  });

  it('should contain approved models list', () => {
    const config = generateCoFounderConfig('chatbot');
    expect(config).toContain('gpt-4o');
    expect(config).toContain('claude-3-5-sonnet');
  });

  it('should set fail-on to high', () => {
    const config = generateCoFounderConfig('chatbot');
    expect(config).toContain('fail-on: high');
  });

  it('should include budget configuration', () => {
    const config = generateCoFounderConfig('agent');
    expect(config).toContain('monthly:');
    expect(config).toContain('per-call:');
  });
});

// ---- Gitignore ----

describe('generateGitignore', () => {
  it('should ignore node_modules', () => {
    expect(generateGitignore()).toContain('node_modules/');
  });

  it('should ignore .env files', () => {
    const gitignore = generateGitignore();
    expect(gitignore).toContain('.env');
    expect(gitignore).toContain('.env.local');
  });

  it('should ignore dist directory', () => {
    expect(generateGitignore()).toContain('dist/');
  });

  it('should ignore .next directory', () => {
    expect(generateGitignore()).toContain('.next/');
  });
});

// ---- Env example ----

describe('generateEnvExample', () => {
  it('should include ANTHROPIC_API_KEY for agent template', () => {
    const env = generateEnvExample('agent');
    expect(env).toContain('ANTHROPIC_API_KEY');
  });

  it('should include OPENAI_API_KEY for chatbot template', () => {
    const env = generateEnvExample('chatbot');
    expect(env).toContain('OPENAI_API_KEY');
  });

  it('should include PORT for api-guard template', () => {
    const env = generateEnvExample('api-guard');
    expect(env).toContain('PORT');
  });

  it('should mention NEXT_PUBLIC_ for full-stack template', () => {
    const env = generateEnvExample('full-stack');
    expect(env).toContain('NEXT_PUBLIC_');
  });
});

// ---- README ----

describe('generateReadme', () => {
  it('should include project name', () => {
    const readme = generateReadme('my-cool-app', 'chatbot');
    expect(readme).toContain('# my-cool-app');
  });

  it('should include npm install instructions', () => {
    const readme = generateReadme('test', 'chatbot');
    expect(readme).toContain('npm install');
  });

  it('should mention guardrails', () => {
    const readme = generateReadme('test', 'chatbot');
    expect(readme).toContain('guardrails');
  });

  it('should include CI integration example', () => {
    const readme = generateReadme('test', 'chatbot');
    expect(readme).toContain('waymaker-ai/cofounder@main');
  });
});

// ---- Source file generators ----

describe('generateChatbotSource', () => {
  it('should import from aicofounder-core', () => {
    expect(generateChatbotSource()).toContain('@waymakerai/aicofounder-core');
  });

  it('should import from aicofounder-guard', () => {
    expect(generateChatbotSource()).toContain('@waymakerai/aicofounder-guard');
  });

  it('should include piiDetector', () => {
    expect(generateChatbotSource()).toContain('piiDetector');
  });

  it('should include injectionDetector', () => {
    expect(generateChatbotSource()).toContain('injectionDetector');
  });
});

describe('generateAgentSource', () => {
  it('should import Anthropic SDK', () => {
    expect(generateAgentSource()).toContain('@anthropic-ai/sdk');
  });

  it('should define tools', () => {
    expect(generateAgentSource()).toContain('tools: Anthropic.Tool[]');
  });

  it('should include guard check on input', () => {
    expect(generateAgentSource()).toContain('guard.check(userMessage)');
  });

  it('should use claude model', () => {
    expect(generateAgentSource()).toContain('claude-3-5-sonnet');
  });
});

describe('generateApiGuardSource', () => {
  it('should import express', () => {
    expect(generateApiGuardSource()).toContain("import express from 'express'");
  });

  it('should define guardrails middleware', () => {
    expect(generateApiGuardSource()).toContain('guardrailsMiddleware');
  });

  it('should have /api/chat endpoint', () => {
    expect(generateApiGuardSource()).toContain("'/api/chat'");
  });

  it('should have /health endpoint', () => {
    expect(generateApiGuardSource()).toContain("'/health'");
  });

  it('should have guard status endpoint', () => {
    expect(generateApiGuardSource()).toContain("'/api/guard/status'");
  });
});

// ---- Full scaffold integration ----

describe('scaffoldProject', () => {
  it('should create project directory structure for chatbot', () => {
    const projectPath = path.join(tmpDir, 'chatbot-app');
    scaffoldProject(projectPath, makeOptions({ template: 'chatbot' }));

    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.cofounder.yml'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'src', 'index.ts'))).toBe(true);
  });

  it('should create project for agent template', () => {
    const projectPath = path.join(tmpDir, 'agent-app');
    scaffoldProject(projectPath, makeOptions({ projectName: 'agent-app', template: 'agent' }));

    expect(fs.existsSync(path.join(projectPath, 'src', 'index.ts'))).toBe(true);
    const source = fs.readFileSync(path.join(projectPath, 'src', 'index.ts'), 'utf-8');
    expect(source).toContain('@anthropic-ai/sdk');
  });

  it('should create project for api-guard template', () => {
    const projectPath = path.join(tmpDir, 'api-app');
    scaffoldProject(projectPath, makeOptions({ projectName: 'api-app', template: 'api-guard' }));

    expect(fs.existsSync(path.join(projectPath, 'src', 'index.ts'))).toBe(true);
    const source = fs.readFileSync(path.join(projectPath, 'src', 'index.ts'), 'utf-8');
    expect(source).toContain('express');
    expect(source).toContain('guardrailsMiddleware');
  });

  it('should create project for full-stack template', () => {
    const projectPath = path.join(tmpDir, 'fullstack-app');
    scaffoldProject(projectPath, makeOptions({ projectName: 'fullstack-app', template: 'full-stack' }));

    expect(fs.existsSync(path.join(projectPath, 'src', 'app', 'layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'src', 'app', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'src', 'app', 'api', 'chat', 'route.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'next.config.js'))).toBe(true);
  });

  it('should write correct package name in package.json', () => {
    const projectPath = path.join(tmpDir, 'named-app');
    scaffoldProject(projectPath, makeOptions({ projectName: 'my-special-app', template: 'chatbot' }));

    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('my-special-app');
  });

  it('should include guardrails in all template sources', () => {
    for (const template of ['chatbot', 'agent', 'api-guard'] as Template[]) {
      const projectPath = path.join(tmpDir, `guard-test-${template}`);
      scaffoldProject(projectPath, makeOptions({ template }));

      const source = fs.readFileSync(path.join(projectPath, 'src', 'index.ts'), 'utf-8');
      expect(source).toContain('guard');
    }
  });

  it('should create nested directories for full-stack template', () => {
    const projectPath = path.join(tmpDir, 'nested-test');
    scaffoldProject(projectPath, makeOptions({ template: 'full-stack' }));

    expect(fs.existsSync(path.join(projectPath, 'src', 'app', 'api', 'chat'))).toBe(true);
  });
});

// ---- Full-stack files ----

describe('generateFullStackFiles', () => {
  it('should create layout.tsx with CoFounderProvider', () => {
    const projectPath = path.join(tmpDir, 'fs-layout');
    mkdirp(projectPath);
    generateFullStackFiles(projectPath);

    const layout = fs.readFileSync(path.join(projectPath, 'src', 'app', 'layout.tsx'), 'utf-8');
    expect(layout).toContain('CoFounderProvider');
  });

  it('should create page.tsx with useCoFounder hook', () => {
    const projectPath = path.join(tmpDir, 'fs-page');
    mkdirp(projectPath);
    generateFullStackFiles(projectPath);

    const page = fs.readFileSync(path.join(projectPath, 'src', 'app', 'page.tsx'), 'utf-8');
    expect(page).toContain('useCoFounder');
  });

  it('should create API route with guard', () => {
    const projectPath = path.join(tmpDir, 'fs-api');
    mkdirp(projectPath);
    generateFullStackFiles(projectPath);

    const route = fs.readFileSync(path.join(projectPath, 'src', 'app', 'api', 'chat', 'route.ts'), 'utf-8');
    expect(route).toContain('guard.check');
    expect(route).toContain('NextResponse');
  });
});

// ---- Edge cases ----

describe('Edge Cases', () => {
  it('should handle project names with scope', () => {
    const json = generatePackageJson('@myorg/my-app', 'chatbot');
    const pkg = JSON.parse(json);
    expect(pkg.name).toBe('@myorg/my-app');
  });

  it('should create working JSON files without trailing content', () => {
    const projectPath = path.join(tmpDir, 'json-test');
    scaffoldProject(projectPath, makeOptions());

    const pkgRaw = fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8');
    expect(() => JSON.parse(pkgRaw)).not.toThrow();

    const tscRaw = fs.readFileSync(path.join(projectPath, 'tsconfig.json'), 'utf-8');
    expect(() => JSON.parse(tscRaw)).not.toThrow();
  });

  it('should not create src/index.ts for full-stack (uses app directory)', () => {
    const projectPath = path.join(tmpDir, 'fs-no-index');
    scaffoldProject(projectPath, makeOptions({ template: 'full-stack' }));

    expect(fs.existsSync(path.join(projectPath, 'src', 'index.ts'))).toBe(false);
    expect(fs.existsSync(path.join(projectPath, 'src', 'app', 'page.tsx'))).toBe(true);
  });
});
