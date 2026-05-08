/**
 * Architectural move 5: Sensitivity declarations + guard enforcement.
 *
 * Every skill declares its data class. At invocation time, we apply the
 * right guard policies from @waymakerai/aicofounder-policies before the
 * skill runs and check the output before it's surfaced to the user.
 *
 * This module is the contract / lookup layer. The actual policy engine
 * lives in @waymakerai/aicofounder-policies; this module decides which
 * presets to load based on the skill's sensitivity declaration.
 */

import type { SkillSensitivity } from "./types.js";

/**
 * Map a skill's sensitivity to the policy preset names that should be
 * loaded by @waymakerai/aicofounder-policies for its execution.
 */
export function presetsForSensitivity(
  sensitivity: SkillSensitivity,
  options: { activeFrameworks?: string[] } = {},
): string[] {
  const presets = new Set<string>();

  // Always-on baselines.
  presets.add("safety");

  if (sensitivity.mayTouchPII) {
    // Caller specifies which compliance frameworks apply (HIPAA / GDPR / etc.).
    // If unspecified, default to GDPR + safety which catch most generic PII.
    const fws = options.activeFrameworks?.length ? options.activeFrameworks : ["gdpr"];
    for (const fw of fws) presets.add(fw);
  }

  if (sensitivity.runsShell) {
    presets.add("shell-safety");
  }

  if (sensitivity.network) {
    presets.add("network-egress");
  }

  return Array.from(presets);
}

/**
 * Pre-flight check. Given a skill's sensitivity and the host's allowance
 * policy, decide whether the skill is allowed to run at all.
 */
export interface HostPolicy {
  allowPII?: boolean;
  allowShell?: boolean;
  allowCodeWrites?: boolean;
  allowNetwork?: boolean;
}

export interface PreflightResult {
  allowed: boolean;
  reasons: string[];
  presetsRequired: string[];
}

export function preflight(
  sensitivity: SkillSensitivity,
  host: HostPolicy = {},
  options: { activeFrameworks?: string[] } = {},
): PreflightResult {
  const reasons: string[] = [];
  if (sensitivity.mayTouchPII && host.allowPII === false) {
    reasons.push("Skill may touch PII but host policy disallows it.");
  }
  if (sensitivity.runsShell && host.allowShell === false) {
    reasons.push("Skill runs shell commands but host policy disallows it.");
  }
  if (sensitivity.writesCode && host.allowCodeWrites === false) {
    reasons.push("Skill writes code but host policy disallows it.");
  }
  if (sensitivity.network && host.allowNetwork === false) {
    reasons.push("Skill makes network calls but host policy disallows it.");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
    presetsRequired: presetsForSensitivity(sensitivity, options),
  };
}
