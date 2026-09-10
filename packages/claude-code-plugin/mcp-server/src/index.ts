#!/usr/bin/env node
/**
 * CoFounder MCP Server
 *
 * Exposes CoFounder capabilities (spec loading, guardrail checks, VibeSpec
 * validation) as Model Context Protocol tools so any MCP-capable agent
 * (Claude Code, Cursor, Cline, Claude Desktop, Windsurf) can call them.
 *
 * Portable by design — the same server serves every host. IDE-specific
 * adapters (skills, commands, hooks) are thin wrappers over these tools.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { findVibeSpecs, matchesGlob } from "./scope.js";

const VERSION = "0.2.0";
const PROTO_VERSION = "cofounder.cx/v1";

// Resolve the skills MANIFEST.json — packaged alongside @waymakerai/aicofounder-skills.
// Search order: env override → workspace path (dev) → bundled fallback.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findSkillsManifest(): string | null {
  const envPath = process.env.COFOUNDER_SKILLS_MANIFEST;
  if (envPath && existsSync(envPath)) return envPath;

  // Walk up from __dirname looking for a sibling `packages/skills/MANIFEST.json`
  // or a direct `skills/MANIFEST.json`. Works for both dev (tsx) and dist runs.
  let cur = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidates = [
      resolve(cur, "skills", "MANIFEST.json"),
      resolve(cur, "packages", "skills", "MANIFEST.json"),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

interface ManifestSkill {
  id: string;
  path: string;
  category: string;
  description: string;
  sensitivity: { mayTouchPII: boolean; writesCode: boolean; runsShell: boolean; network: boolean };
  modelClass: "light" | "mid" | "heavy";
  nextSkill?: string;
  requires: string[];
  emits: string[];
  hasFixtures: boolean;
}

interface SkillsManifest {
  apiVersion: string;
  generatedAt: string;
  skillCount: number;
  skills: ManifestSkill[];
}

function loadSkillsManifest(): SkillsManifest | null {
  const path = findSkillsManifest();
  if (!path) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as SkillsManifest;
  } catch {
    return null;
  }
}

function repoRoot(hint?: string): string {
  return resolve(hint ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
}

function readFile(path: string): string {
  return readFileSync(path, "utf8");
}

function loadYamlFile(path: string): unknown {
  return parseYaml(readFile(path));
}

function findFeatureSpecs(root: string): string[] {
  const dir = join(root, "specs");
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".spec.yml") || f.endsWith(".spec.yaml")) {
      out.push(join(dir, f));
    }
  }
  return out;
}

// --- Tool implementations ---

async function tool_listVibeSpecs(args: { repoRoot?: string }) {
  const root = repoRoot(args.repoRoot);
  const specs = findVibeSpecs(root).map((p) => {
    const doc = loadYamlFile(p) as { id?: string; name?: string; description?: string };
    return {
      path: relative(root, p),
      id: doc.id,
      name: doc.name,
      description: doc.description,
    };
  });
  return { specs, count: specs.length };
}

async function tool_getFeatureSpec(args: { path: string; repoRoot?: string }) {
  const root = repoRoot(args.repoRoot);
  const full = resolve(root, args.path);
  if (!full.startsWith(root)) {
    throw new Error("Path escapes repo root");
  }
  if (!existsSync(full)) {
    throw new Error(`Spec not found: ${args.path}`);
  }
  return {
    path: relative(root, full),
    content: loadYamlFile(full),
  };
}

async function tool_validateAgainstVibe(args: {
  vibeId?: string;
  vibePath?: string;
  changedFiles: string[];
  diff?: string;
  repoRoot?: string;
}) {
  const root = repoRoot(args.repoRoot);
  let vibePath = args.vibePath;

  if (!vibePath && args.vibeId) {
    const all = findVibeSpecs(root);
    for (const p of all) {
      const doc = loadYamlFile(p) as { id?: string };
      if (doc.id === args.vibeId) {
        vibePath = p;
        break;
      }
    }
  }
  if (!vibePath) {
    throw new Error("Provide vibeId or vibePath");
  }
  const vibe = loadYamlFile(resolve(root, vibePath)) as {
    id?: string;
    vibe?: {
      scopeRules?: {
        allowedPaths?: string[];
        forbiddenPaths?: string[];
      };
      dataRules?: {
        forbidMockInProd?: boolean;
        forbidHardcodedCredentials?: boolean;
      };
      designSystem?: {
        forbidRawColors?: boolean;
      };
    };
  };

  const findings: Array<{
    severity: "tier1" | "tier2" | "tier3";
    check: string;
    file?: string;
    message: string;
  }> = [];

  const scope = vibe.vibe?.scopeRules;
  if (scope?.allowedPaths) {
    for (const f of args.changedFiles) {
      const allowed = scope.allowedPaths.some((pat) => matchesGlob(f, pat));
      const forbidden = (scope.forbiddenPaths ?? []).some((pat) => matchesGlob(f, pat));
      if (!allowed || forbidden) {
        findings.push({
          severity: "tier2",
          check: "scope-respect",
          file: f,
          message: `File ${f} is outside allowedPaths or under forbiddenPaths for vibe ${vibe.id}`,
        });
      }
    }
  }

  // Diff-based checks (only run if diff provided)
  if (args.diff) {
    const rawSecret = /sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}/;
    if (rawSecret.test(args.diff)) {
      findings.push({
        severity: "tier1",
        check: "no-secrets",
        message: "High-confidence secret pattern detected in diff",
      });
    }
    if (vibe.vibe?.dataRules?.forbidMockInProd) {
      if (/\b(mockUsers|fakeUsers|MOCK_USERS|fakeCustomer)\b/.test(args.diff)) {
        findings.push({
          severity: "tier2",
          check: "no-mock-data",
          message: "Mock-data identifier detected in diff",
        });
      }
    }
    if (vibe.vibe?.designSystem?.forbidRawColors) {
      const hexRe = /#[0-9a-fA-F]{3,6}\b/g;
      const hits = args.diff.match(hexRe);
      if (hits && hits.length > 0) {
        findings.push({
          severity: "tier2",
          check: "design-system-compliance",
          message: `Raw hex color(s) detected: ${Array.from(new Set(hits)).slice(0, 5).join(", ")}`,
        });
      }
    }
  }

  return {
    vibeId: vibe.id,
    vibePath: relative(root, resolve(root, vibePath)),
    filesChecked: args.changedFiles.length,
    findings,
    pass: findings.filter((f) => f.severity === "tier1").length === 0,
  };
}

async function tool_checkChangeset(args: {
  changedFiles: string[];
  diff?: string;
  repoRoot?: string;
}) {
  // A lighter-weight check that runs without a specific vibe.
  // Uses repo defaults if .aicofounder.yml is present.
  const root = repoRoot(args.repoRoot);
  const configPath = join(root, ".aicofounder.yml");
  const config = existsSync(configPath) ? (loadYamlFile(configPath) as Record<string, unknown>) : {};

  const findings: Array<{ severity: string; check: string; file?: string; message: string }> = [];

  if (args.diff) {
    const rawSecret = /sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|sk-ant-[A-Za-z0-9\-_]{20,}/;
    if (rawSecret.test(args.diff)) {
      findings.push({ severity: "tier1", check: "no-secrets", message: "Secret pattern in diff" });
    }
  }

  for (const f of args.changedFiles) {
    if (/(^|\/)\.env($|\..*)/.test(f) && !/\.env\.example$/.test(f)) {
      findings.push({
        severity: "tier1",
        check: "no-env-writes",
        file: f,
        message: `Writing to ${f} — env files should not be edited by agents`,
      });
    }
  }

  return {
    config: Object.keys(config).length > 0 ? "loaded" : "missing",
    filesChecked: args.changedFiles.length,
    findings,
    pass: findings.filter((f) => f.severity === "tier1").length === 0,
  };
}

// --- Server bootstrap ---

const server = new Server(
  {
    name: "cofounder",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Build skill tools from the manifest at startup so non-Claude-Code clients
// (Cursor, Cline, Windsurf, Claude Desktop) can invoke the same skills.
const skillsManifest = loadSkillsManifest();

function buildSkillTools(manifest: SkillsManifest | null) {
  if (!manifest) return [] as Array<{ name: string; description: string; inputSchema: unknown }>;
  return manifest.skills.map((s) => ({
    name: `cofounder.skill.${s.id.replace(/^cofounder-/, "")}`,
    description:
      s.description.length > 380 ? s.description.slice(0, 377) + "..." : s.description,
    inputSchema: {
      type: "object",
      required: ["task"],
      properties: {
        task: {
          type: "string",
          description: "Natural-language request the skill should fulfill.",
        },
        repoRoot: {
          type: "string",
          description: "Optional repo root. Defaults to CLAUDE_PROJECT_DIR or cwd.",
        },
      },
    },
  }));
}

async function tool_runSkill(args: { task: string; repoRoot?: string; skillId: string }) {
  if (!skillsManifest) {
    throw new Error("Skills manifest not found. Install @waymakerai/aicofounder-skills.");
  }
  const skill = skillsManifest.skills.find((s) => s.id === args.skillId);
  if (!skill) throw new Error(`Unknown skill: ${args.skillId}`);

  // Locate the SKILL.md so the calling agent can load instructions.
  const root = repoRoot(args.repoRoot);
  const manifestPath = findSkillsManifest()!;
  const skillBodyPath = resolve(dirname(manifestPath), skill.path);

  return {
    skillId: skill.id,
    category: skill.category,
    sensitivity: skill.sensitivity,
    modelClass: skill.modelClass,
    nextSkill: skill.nextSkill ?? null,
    instructions: existsSync(skillBodyPath) ? readFileSync(skillBodyPath, "utf8") : null,
    instructionsPath: relative(root, skillBodyPath),
    task: args.task,
    note: "Load `instructions` as the system prompt and execute against `task` using a model from the declared modelClass. Honor sensitivity declarations.",
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    ...buildSkillTools(skillsManifest),
    {
      name: "cofounder.listSkills",
      description:
        "List all skills exposed by the CoFounder Skill Library. Returns id, category, description, sensitivity, modelClass, and any chained next-skill.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "cofounder.listVibeSpecs",
      description:
        "List all VibeSpec files in the current repo (searches specs/vibes/, config/vibes/, .cofounder/vibes/). Returns path, id, name, description for each.",
      inputSchema: {
        type: "object",
        properties: {
          repoRoot: { type: "string", description: "Optional repo root. Defaults to CLAUDE_PROJECT_DIR or cwd." },
        },
      },
    },
    {
      name: "cofounder.getFeatureSpec",
      description:
        "Load and parse a feature spec file (specs/*.spec.yml). Returns the full YAML content as structured JSON.",
      inputSchema: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", description: "Relative path to the spec file" },
          repoRoot: { type: "string" },
        },
      },
    },
    {
      name: "cofounder.validateAgainstVibe",
      description:
        "Validate a changeset against a VibeSpec's rules (scope, secrets, mock data, design system). Returns a findings list grouped by severity tier.",
      inputSchema: {
        type: "object",
        required: ["changedFiles"],
        properties: {
          vibeId: { type: "string", description: "VibeSpec id (preferred)" },
          vibePath: { type: "string", description: "Path to VibeSpec file (alternative to vibeId)" },
          changedFiles: {
            type: "array",
            items: { type: "string" },
            description: "Repo-relative paths of files in the changeset",
          },
          diff: { type: "string", description: "Optional unified diff text for content-level checks" },
          repoRoot: { type: "string" },
        },
      },
    },
    {
      name: "cofounder.checkChangeset",
      description:
        "Lightweight changeset validation without a specific VibeSpec. Catches secrets and env-file writes. Use when no VibeSpec is active.",
      inputSchema: {
        type: "object",
        required: ["changedFiles"],
        properties: {
          changedFiles: { type: "array", items: { type: "string" } },
          diff: { type: "string" },
          repoRoot: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;
  let result: unknown;

  // Skill-tool dispatch: every cofounder.skill.<id> routes through tool_runSkill.
  if (name.startsWith("cofounder.skill.")) {
    const shortId = name.slice("cofounder.skill.".length);
    const fullId = `cofounder-${shortId}`;
    result = await tool_runSkill({
      task: String(a.task ?? ""),
      repoRoot: a.repoRoot as string | undefined,
      skillId: fullId,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  switch (name) {
    case "cofounder.listSkills":
      result = {
        manifestFound: skillsManifest != null,
        skillCount: skillsManifest?.skillCount ?? 0,
        skills: skillsManifest?.skills ?? [],
      };
      break;
    case "cofounder.listVibeSpecs":
      result = await tool_listVibeSpecs(a as { repoRoot?: string });
      break;
    case "cofounder.getFeatureSpec":
      result = await tool_getFeatureSpec(a as { path: string; repoRoot?: string });
      break;
    case "cofounder.validateAgainstVibe":
      result = await tool_validateAgainstVibe(a as Parameters<typeof tool_validateAgainstVibe>[0]);
      break;
    case "cofounder.checkChangeset":
      result = await tool_checkChangeset(a as Parameters<typeof tool_checkChangeset>[0]);
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

// Log to stderr so stdio protocol stream stays clean
process.stderr.write(`cofounder MCP server ${VERSION} (${PROTO_VERSION}) running\n`);
