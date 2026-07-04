/**
 * Public types for the CoFounder Skill Library runtime.
 *
 * Skills are markdown files with YAML frontmatter. The CoFounder extensions
 * are additive — a skill without them works as a plain Anthropic Agent Skill,
 * it just doesn't get telemetry, model routing, sandbox preview, or chaining.
 */

export type ModelClass = "light" | "mid" | "heavy";

export interface SkillSensitivity {
  /** Skill output may include or process PII / PHI. Triggers @waymakerai/aicofounder-policies guards. */
  mayTouchPII?: boolean;
  /** Skill output may modify the repo. Eligible for sandbox preview. */
  writesCode?: boolean;
  /** Skill executes shell. Auto-routed through @waymakerai/aicofounder-sandbox. */
  runsShell?: boolean;
  /** Skill makes network calls outside the LLM. */
  network?: boolean;
}

export interface SkillFrontmatter {
  /** Required. Slug used to invoke the skill. */
  name: string;
  /** Required. Plain-language hint for when to invoke the skill. */
  description: string;

  // CoFounder extensions — all optional.
  sensitivity?: SkillSensitivity;
  modelClass?: ModelClass;
  /** Skill ID to suggest after this one finishes. */
  nextSkill?: string;
  /** Skill IDs that must complete before this skill runs. */
  requires?: string[];
  /** Telemetry event names this skill emits. */
  emits?: string[];
  /** Tools the skill is allowed to call (Anthropic Agent Skills standard). */
  tools?: string[];
}

export interface SkillRecord {
  /** Skill ID (matches frontmatter.name). */
  id: string;
  /** Absolute path to the SKILL.md file. */
  path: string;
  /** Repo-relative path. */
  relativePath: string;
  /** Category — derived from the parent directory under src/. */
  category: string;
  frontmatter: SkillFrontmatter;
  /** SKILL.md body (markdown after frontmatter). */
  body: string;
  /** Path to the fixtures directory if present. */
  fixturesDir?: string;
}

export interface SkillManifest {
  apiVersion: "cofounder.cx/skills/v1";
  generatedAt: string;
  skillCount: number;
  skills: Array<{
    id: string;
    path: string;
    category: string;
    description: string;
    sensitivity: SkillSensitivity;
    modelClass: ModelClass;
    nextSkill?: string;
    requires: string[];
    emits: string[];
    hasFixtures: boolean;
  }>;
}

export interface SkillFixture {
  /** Identifier for the fixture (filename minus .json). */
  id: string;
  /** What the user said / the inputs to the skill. */
  input: {
    userMessage?: string;
    files?: Record<string, string>;
    args?: Record<string, unknown>;
  };
  /** What the skill SHOULD do — assertions over the output. */
  expect: {
    /** Substring that must appear in the agent's response. */
    contains?: string[];
    /** Substring that must NOT appear in the agent's response. */
    notContains?: string[];
    /** File paths the skill should write to. */
    writesFiles?: string[];
    /** File paths the skill must NOT write to. */
    refusesToWriteFiles?: string[];
    /** Must complete in ≤ this many seconds (0 = no limit). */
    maxLatencySeconds?: number;
  };
}

export interface FixtureRunResult {
  fixtureId: string;
  skillId: string;
  passed: boolean;
  failures: string[];
  durationMs: number;
}

export interface SkillTelemetryEvent {
  skillId: string;
  event: string;
  timestamp: string;
  durationMs?: number;
  costUsd?: number;
  modelUsed?: string;
  outcome?: "ok" | "warn" | "fail";
  metadata?: Record<string, unknown>;
}
