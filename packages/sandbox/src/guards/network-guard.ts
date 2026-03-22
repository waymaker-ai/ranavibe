/**
 * Network guard — intercepts network operations and enforces policy rules.
 * Wraps net.connect, http.request, https.request with domain/port checks.
 */

import type { NetworkPolicy, NetworkRule, Violation } from '../types.js';

export interface NetworkGuardState {
  violations: Violation[];
  bytesTransferred: number;
}

/**
 * Match a domain against a pattern.
 * Supports:
 *   "*" — matches everything
 *   "*.example.com" — matches subdomains
 *   "api.example.com" — exact match
 */
function domainMatch(pattern: string, domain: string): boolean {
  if (pattern === '*') return true;
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // ".example.com"
    return domain.endsWith(suffix) || domain === pattern.slice(2);
  }
  return pattern === domain;
}

function checkPort(rule: NetworkRule, port: number): boolean {
  if (!rule.ports || rule.ports.length === 0) return true;
  return rule.ports.includes(port);
}

export function createNetworkGuard(policy: NetworkPolicy): {
  checkConnection: (domain: string, port: number) => boolean;
  trackBytes: (bytes: number) => void;
  state: NetworkGuardState;
} {
  const state: NetworkGuardState = {
    violations: [],
    bytesTransferred: 0,
  };

  function checkConnection(domain: string, port: number): boolean {
    // Check deny rules first
    for (const rule of policy.deny) {
      if (domainMatch(rule.domain, domain) && checkPort(rule, port)) {
        // Check if there's a more specific allow rule
        let allowed = false;
        for (const allowRule of policy.allow) {
          if (domainMatch(allowRule.domain, domain) && checkPort(allowRule, port)) {
            allowed = true;
            break;
          }
        }
        if (!allowed) {
          state.violations.push({
            type: 'network',
            rule: `deny ${rule.domain}:${rule.ports?.join(',') ?? '*'}`,
            details: `Connection to ${domain}:${port} blocked by deny rule`,
            timestamp: Date.now(),
          });
          return false;
        }
      }
    }

    // If there are allow rules, connection must match at least one
    if (policy.allow.length > 0) {
      for (const rule of policy.allow) {
        if (domainMatch(rule.domain, domain) && checkPort(rule, port)) {
          return true;
        }
      }
      // No allow rule matched
      state.violations.push({
        type: 'network',
        rule: 'no matching allow rule',
        details: `Connection to ${domain}:${port} blocked — no allow rule matched`,
        timestamp: Date.now(),
      });
      return false;
    }

    // No allow rules and no deny rules matched — allow by default
    return true;
  }

  function trackBytes(bytes: number): void {
    state.bytesTransferred += bytes;
  }

  return { checkConnection, trackBytes, state };
}

/**
 * Create a guarded version of http/https request options.
 * Returns null if the connection should be blocked.
 */
export function validateRequestOptions(
  options: { hostname?: string; host?: string; port?: number | string; protocol?: string },
  guard: ReturnType<typeof createNetworkGuard>,
): boolean {
  const domain = options.hostname || options.host || 'localhost';
  let port = typeof options.port === 'string' ? parseInt(options.port, 10) : (options.port || 0);
  if (!port) {
    port = options.protocol === 'https:' ? 443 : 80;
  }
  return guard.checkConnection(domain, port);
}
