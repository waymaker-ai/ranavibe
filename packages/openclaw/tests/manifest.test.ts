import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const skillPath = join(__dirname, '..', 'skill-cofounder', 'SKILL.md');

describe('cofounder-cofounder SKILL.md', () => {
  it('exists', () => {
    expect(existsSync(skillPath)).toBe(true);
  });

  it('has valid frontmatter with required fields', () => {
    const content = readFileSync(skillPath, 'utf8');
    const { data } = matter(content);
    expect(data.name).toBe('cofounder-cofounder');
    expect(data.description).toMatch(/Cameron.*Brain context/);
    expect(data.version).toBe('1.0.0');
    expect(data.metadata.openclaw.primaryEnv).toBe('WAYMAKER_PRODUCT_ID');
    expect(data.metadata.openclaw.pairs_with).toBe('cofounder-guardrails');
  });
});
