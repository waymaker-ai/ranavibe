/**
 * Manifest builder. Walks src/ and produces a single MANIFEST.json that
 * downstream consumers (claude-code-plugin, mcp-server, ci) read instead of
 * re-parsing markdown every time.
 */

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import type {
  SkillFrontmatter,
  SkillManifest,
  SkillRecord,
  SkillSensitivity,
  ModelClass,
} from "./types.js";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseSkillFile(path: string): { frontmatter: SkillFrontmatter; body: string } {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(FRONTMATTER_RE);
  if (!m) {
    throw new Error(`SKILL.md at ${path} has no YAML frontmatter`);
  }
  const fm = parseYaml(m[1]) as SkillFrontmatter;
  if (!fm.name || !fm.description) {
    throw new Error(`SKILL.md at ${path} is missing required fields (name, description)`);
  }
  return { frontmatter: fm, body: m[2] };
}

function walkSkills(srcDir: string): string[] {
  const out: string[] = [];
  function visit(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        visit(full);
      } else if (basename(full) === "SKILL.md") {
        out.push(full);
      }
    }
  }
  visit(srcDir);
  return out.sort();
}

export function loadAllSkills(srcDir: string, repoRoot: string): SkillRecord[] {
  const files = walkSkills(srcDir);
  const records: SkillRecord[] = [];
  for (const path of files) {
    const { frontmatter, body } = parseSkillFile(path);
    const dir = dirname(path);
    const fixturesDir = join(dir, "fixtures");
    const category = relative(srcDir, dirname(dir)).split(/[\\/]/)[0] || "uncategorized";
    records.push({
      id: frontmatter.name,
      path,
      relativePath: relative(repoRoot, path),
      category,
      frontmatter,
      body,
      fixturesDir: existsSync(fixturesDir) ? fixturesDir : undefined,
    });
  }
  return records;
}

function defaults(fm: SkillFrontmatter): {
  sensitivity: Required<SkillSensitivity>;
  modelClass: ModelClass;
  requires: string[];
  emits: string[];
} {
  return {
    sensitivity: {
      mayTouchPII: fm.sensitivity?.mayTouchPII ?? false,
      writesCode: fm.sensitivity?.writesCode ?? false,
      runsShell: fm.sensitivity?.runsShell ?? false,
      network: fm.sensitivity?.network ?? false,
    },
    modelClass: fm.modelClass ?? "mid",
    requires: fm.requires ?? [],
    emits: fm.emits ?? ["skill.run"],
  };
}

export function buildManifest(records: SkillRecord[]): SkillManifest {
  return {
    apiVersion: "cofounder.cx/skills/v1",
    generatedAt: new Date().toISOString(),
    skillCount: records.length,
    skills: records.map((r) => {
      const d = defaults(r.frontmatter);
      return {
        id: r.id,
        path: r.relativePath,
        category: r.category,
        description: r.frontmatter.description,
        sensitivity: d.sensitivity,
        modelClass: d.modelClass,
        nextSkill: r.frontmatter.nextSkill,
        requires: d.requires,
        emits: d.emits,
        hasFixtures: r.fixturesDir != null,
      };
    }),
  };
}

export function writeManifest(manifest: SkillManifest, outPath: string): void {
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}
