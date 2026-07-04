/**
 * Architectural move 1: FlowSpec skill chaining.
 *
 * Skills declare `nextSkill` (suggested follow-up) and `requires` (hard
 * prerequisites). This module computes the topologically-sorted chain for a
 * starting skill, detects cycles, and surfaces what's missing.
 */

import type { SkillManifest } from "./types.js";

export interface ChainStep {
  id: string;
  reason: "required" | "starting" | "suggested-next";
  description: string;
}

export interface ChainPlan {
  startSkill: string;
  steps: ChainStep[];
  missingPrerequisites: string[];
  cycle?: string[];
}

export function planChain(manifest: SkillManifest, startSkillId: string): ChainPlan {
  const byId = new Map(manifest.skills.map((s) => [s.id, s]));
  const start = byId.get(startSkillId);
  if (!start) {
    return {
      startSkill: startSkillId,
      steps: [],
      missingPrerequisites: [startSkillId],
    };
  }

  const steps: ChainStep[] = [];
  const visited = new Set<string>();
  const missing: string[] = [];

  // 1. Walk requires DAG (depth-first); detect cycles.
  const inProgress = new Set<string>();
  const stack: string[] = [];

  function walkRequires(id: string): string[] | null {
    if (visited.has(id)) return null;
    if (inProgress.has(id)) {
      // cycle
      const cycleStart = stack.indexOf(id);
      return stack.slice(cycleStart).concat(id);
    }
    inProgress.add(id);
    stack.push(id);
    const node = byId.get(id);
    if (!node) {
      missing.push(id);
      inProgress.delete(id);
      stack.pop();
      return null;
    }
    for (const req of node.requires ?? []) {
      const cyc = walkRequires(req);
      if (cyc) return cyc;
    }
    visited.add(id);
    if (id !== startSkillId) {
      steps.push({
        id,
        reason: "required",
        description: node.description,
      });
    }
    inProgress.delete(id);
    stack.pop();
    return null;
  }

  const cycle = walkRequires(startSkillId);
  if (cycle) {
    return { startSkill: startSkillId, steps: [], missingPrerequisites: [], cycle };
  }

  // 2. The starting skill itself.
  steps.push({
    id: start.id,
    reason: "starting",
    description: start.description,
  });

  // 3. Follow nextSkill chain (no requires re-walking).
  let cur = start;
  const seenInChain = new Set([cur.id]);
  while (cur.nextSkill) {
    if (seenInChain.has(cur.nextSkill)) break;
    const next = byId.get(cur.nextSkill);
    if (!next) {
      missing.push(cur.nextSkill);
      break;
    }
    seenInChain.add(next.id);
    steps.push({
      id: next.id,
      reason: "suggested-next",
      description: next.description,
    });
    cur = next;
  }

  return {
    startSkill: startSkillId,
    steps,
    missingPrerequisites: missing,
  };
}

/**
 * Render a chain plan as a numbered plain-text report. Useful for
 * surfacing the chain to the user before execution.
 */
export function renderChain(plan: ChainPlan): string {
  if (plan.cycle) {
    return `# Chain ERROR: cycle detected\n\nCycle: ${plan.cycle.join(" → ")}\n`;
  }
  const lines: string[] = [];
  lines.push(`# Chain plan starting at \`${plan.startSkill}\`\n`);
  plan.steps.forEach((s, i) => {
    const tag = s.reason === "required" ? "[prereq]" : s.reason === "starting" ? "[start]" : "[next]";
    lines.push(`${i + 1}. ${tag} \`${s.id}\` — ${s.description.split(/\.|\n/)[0].trim()}`);
  });
  if (plan.missingPrerequisites.length > 0) {
    lines.push("");
    lines.push(`> Missing skills referenced but not found: ${plan.missingPrerequisites.join(", ")}`);
  }
  return lines.join("\n");
}
