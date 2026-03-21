/**
 * Process guard — intercepts child_process operations and enforces policy rules.
 * Checks commands against allow/deny lists, enforces max concurrent processes.
 */

import type { ProcessRule, Violation } from '../types.js';

export interface ProcessGuardState {
  violations: Violation[];
  activeProcesses: number;
  totalSpawned: number;
}

/**
 * Extract the base command from a command string.
 * "npm install foo" → "npm"
 * "/usr/bin/node script.js" → "node"
 */
function extractCommand(cmd: string): string {
  const trimmed = cmd.trim();
  const firstSpace = trimmed.indexOf(' ');
  const fullCmd = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
  // Get basename (strip path)
  const lastSlash = fullCmd.lastIndexOf('/');
  return lastSlash === -1 ? fullCmd : fullCmd.slice(lastSlash + 1);
}

/**
 * Check if a command matches any entry in a list.
 * Supports exact match and wildcard "*".
 */
function commandMatches(cmd: string, fullCmd: string, list: string[]): boolean {
  for (const entry of list) {
    if (entry === '*') return true;
    if (entry === cmd) return true;
    // Check if the full command starts with a denied pattern (e.g., "rm -rf /")
    if (fullCmd.startsWith(entry)) return true;
  }
  return false;
}

export function createProcessGuard(rules: ProcessRule): {
  checkCommand: (command: string) => boolean;
  onProcessStart: () => boolean;
  onProcessEnd: () => void;
  state: ProcessGuardState;
} {
  const state: ProcessGuardState = {
    violations: [],
    activeProcesses: 0,
    totalSpawned: 0,
  };

  function checkCommand(command: string): boolean {
    const baseCmd = extractCommand(command);

    // Check deny list first
    if (commandMatches(baseCmd, command, rules.deny)) {
      // Check if also in allow list (allow overrides deny for specific commands)
      if (!commandMatches(baseCmd, command, rules.allow)) {
        state.violations.push({
          type: 'process',
          rule: `deny command "${baseCmd}"`,
          details: `Execution of "${command}" blocked — command "${baseCmd}" is denied`,
          timestamp: Date.now(),
        });
        return false;
      }
    }

    // If there's an allow list, command must be in it
    if (rules.allow.length > 0 && !rules.allow.includes('*')) {
      if (!commandMatches(baseCmd, command, rules.allow)) {
        state.violations.push({
          type: 'process',
          rule: `command "${baseCmd}" not in allow list`,
          details: `Execution of "${command}" blocked — command "${baseCmd}" is not in the allow list`,
          timestamp: Date.now(),
        });
        return false;
      }
    }

    return true;
  }

  function onProcessStart(): boolean {
    if (state.activeProcesses >= rules.maxConcurrent) {
      state.violations.push({
        type: 'process',
        rule: `maxConcurrent (${rules.maxConcurrent})`,
        details: `Process spawn blocked — ${state.activeProcesses} active processes already at limit of ${rules.maxConcurrent}`,
        timestamp: Date.now(),
      });
      return false;
    }
    state.activeProcesses++;
    state.totalSpawned++;
    return true;
  }

  function onProcessEnd(): void {
    state.activeProcesses = Math.max(0, state.activeProcesses - 1);
  }

  return { checkCommand, onProcessStart, onProcessEnd, state };
}
