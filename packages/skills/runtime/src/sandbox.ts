/**
 * Architectural move 7: Sandbox preview for destructive skills.
 *
 * Skills with `sensitivity.runsShell: true` or `sensitivity.writesCode: true`
 * are eligible for sandbox preview before their effects are applied to the
 * real workspace. This module is the integration layer with
 * @waymakerai/aicofounder-sandbox.
 */

import type { SkillSensitivity } from "./types.js";

export interface SandboxPreviewRequest {
  skillId: string;
  sensitivity: SkillSensitivity;
  /** Commands or code the skill is about to execute. */
  operations: Array<{
    kind: "shell" | "fs.write" | "fs.delete" | "network";
    target: string;
    content?: string;
  }>;
  /** Expected outcome the user should verify against the preview. */
  expectedOutcome?: string;
}

export interface SandboxPreviewResult {
  outcome: "safe-to-run" | "needs-review" | "blocked";
  diff: {
    filesCreated: string[];
    filesModified: string[];
    filesDeleted: string[];
    networkAttempted: string[];
  };
  violations: string[];
  flags: string[];
  durationMs: number;
}

/**
 * Decide whether a skill should be routed through the sandbox preview.
 * Read-only skills skip; writing/shell skills go through.
 */
export function requiresSandboxPreview(sensitivity: SkillSensitivity): boolean {
  return Boolean(sensitivity.runsShell || sensitivity.writesCode);
}

/**
 * Pick a sandbox policy by inspecting the operations the skill plans.
 *
 * Returned values match policy presets exposed by
 * @waymakerai/aicofounder-sandbox: restrictedAgent | openAgent | ciRunner |
 * sandboxed | defaultPolicy.
 *
 * The default is `restrictedAgent` (most conservative). We only escalate to
 * `ciRunner` when the operation explicitly needs to run shell or write files,
 * and we never auto-pick `openAgent` — that's a deliberate user decision.
 */
export type SandboxPolicyName =
  | "restrictedAgent"
  | "openAgent"
  | "ciRunner"
  | "sandboxed"
  | "defaultPolicy";

export function pickSandboxPolicy(req: SandboxPreviewRequest): SandboxPolicyName {
  const kinds = new Set(req.operations.map((o) => o.kind));
  if (kinds.has("shell") || kinds.has("fs.write") || kinds.has("fs.delete")) {
    return "ciRunner";
  }
  if (kinds.has("network")) return "restrictedAgent";
  return "restrictedAgent";
}

/**
 * Adapter contract — the actual sandbox lives in
 * @waymakerai/aicofounder-sandbox. The adapter is injected so this runtime
 * doesn't take a hard dependency on the sandbox package.
 */
export interface SandboxAdapter {
  preview(req: SandboxPreviewRequest, policy: SandboxPolicyName): Promise<SandboxPreviewResult>;
}

/**
 * High-level helper. Call this from a skill that's about to do something
 * destructive. Returns the preview result; the caller decides whether to
 * surface it to the user or proceed.
 */
export async function previewBeforeRun(
  adapter: SandboxAdapter,
  req: SandboxPreviewRequest,
): Promise<SandboxPreviewResult> {
  if (!requiresSandboxPreview(req.sensitivity)) {
    return {
      outcome: "safe-to-run",
      diff: { filesCreated: [], filesModified: [], filesDeleted: [], networkAttempted: [] },
      violations: [],
      flags: ["skill-is-read-only-no-preview-needed"],
      durationMs: 0,
    };
  }
  const policy = pickSandboxPolicy(req);
  return adapter.preview(req, policy);
}
