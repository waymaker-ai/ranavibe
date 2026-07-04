/**
 * Architectural move 2: Golden-fixture replay.
 *
 * Each skill can ship `fixtures/*.json` files. This module loads them,
 * runs them against an executor (provided by the caller), and produces a
 * structured pass/fail report. The CI scanner replays these on every PR.
 *
 * Fixtures are deliberately small — they assert *behavior*, not exact
 * tokens. Substring matches and refused-file lists are the primary signal.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SkillFixture, FixtureRunResult, SkillRecord } from "./types.js";

export type FixtureExecutor = (
  skill: SkillRecord,
  fixture: SkillFixture,
) => Promise<{
  output: string;
  filesWritten: string[];
}>;

export function loadFixtures(skill: SkillRecord): SkillFixture[] {
  if (!skill.fixturesDir) return [];
  if (!existsSync(skill.fixturesDir)) return [];
  const out: SkillFixture[] = [];
  for (const entry of readdirSync(skill.fixturesDir)) {
    if (!entry.endsWith(".json")) continue;
    const full = join(skill.fixturesDir, entry);
    if (!statSync(full).isFile()) continue;
    const data = JSON.parse(readFileSync(full, "utf8")) as SkillFixture;
    if (!data.id) data.id = entry.replace(/\.json$/, "");
    out.push(data);
  }
  return out;
}

export async function runFixture(
  skill: SkillRecord,
  fixture: SkillFixture,
  executor: FixtureExecutor,
): Promise<FixtureRunResult> {
  const start = Date.now();
  const failures: string[] = [];
  let output = "";
  let filesWritten: string[] = [];

  try {
    const r = await executor(skill, fixture);
    output = r.output;
    filesWritten = r.filesWritten;
  } catch (err) {
    failures.push(`executor threw: ${(err as Error).message}`);
  }

  const dur = Date.now() - start;

  // Assertions
  for (const must of fixture.expect.contains ?? []) {
    if (!output.includes(must)) {
      failures.push(`expected output to contain "${must}"`);
    }
  }
  for (const banned of fixture.expect.notContains ?? []) {
    if (output.includes(banned)) {
      failures.push(`expected output NOT to contain "${banned}"`);
    }
  }
  for (const f of fixture.expect.writesFiles ?? []) {
    if (!filesWritten.includes(f)) {
      failures.push(`expected file write: ${f}`);
    }
  }
  for (const f of fixture.expect.refusesToWriteFiles ?? []) {
    if (filesWritten.includes(f)) {
      failures.push(`skill wrote a file it should have refused: ${f}`);
    }
  }
  if (fixture.expect.maxLatencySeconds && dur > fixture.expect.maxLatencySeconds * 1000) {
    failures.push(`exceeded latency budget (${dur}ms > ${fixture.expect.maxLatencySeconds * 1000}ms)`);
  }

  return {
    fixtureId: fixture.id,
    skillId: skill.id,
    passed: failures.length === 0,
    failures,
    durationMs: dur,
  };
}

export async function runAllFixtures(
  skills: SkillRecord[],
  executor: FixtureExecutor,
): Promise<FixtureRunResult[]> {
  const results: FixtureRunResult[] = [];
  for (const skill of skills) {
    const fixtures = loadFixtures(skill);
    for (const fx of fixtures) {
      results.push(await runFixture(skill, fx, executor));
    }
  }
  return results;
}

export function summarizeResults(results: FixtureRunResult[]): {
  total: number;
  passed: number;
  failed: number;
  failures: FixtureRunResult[];
  asReport: string;
} {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const failures = results.filter((r) => !r.passed);

  const lines: string[] = [];
  lines.push(`# Skill Fixture Replay\n`);
  lines.push(`**Total:** ${total}  **Passed:** ${passed}  **Failed:** ${failed}\n`);
  if (failed > 0) {
    lines.push(`## Failures\n`);
    for (const f of failures) {
      lines.push(`- \`${f.skillId}\` / \`${f.fixtureId}\` (${f.durationMs}ms)`);
      for (const msg of f.failures) {
        lines.push(`    - ${msg}`);
      }
    }
  }
  return { total, passed, failed, failures, asReport: lines.join("\n") };
}
