/**
 * Classifies written content as taint-worthy: secrets (kept in sync with
 * hooks/lib/secret-scan.sh's embedded fallback set — extend both together)
 * plus a deliberately narrow PII set (email, US SSN only for v1 — phone
 * and credit-card patterns have a much higher false-positive rate and are
 * a scoped-out follow-up, not silently included).
 *
 * Unlike the blocking secret-scan check, a match here does NOT prevent the
 * write — it's not a Tier-1 guardrail, it's what feeds the taint tracker
 * so a *later* action (an exfil-shaped shell command) can be checked
 * against it. A debugging session that legitimately needs to write PII to
 * a local diagnostic file should be allowed to — the risk is what happens
 * to that file next.
 */
const PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  { reason: 'secret:stripe-live-key', pattern: /sk_live_[A-Za-z0-9]{10,}/ },
  { reason: 'secret:anthropic-key', pattern: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { reason: 'secret:openai-key', pattern: /(^|[^A-Za-z0-9_-])sk-(ant-|proj-)?[A-Za-z0-9]{20,}/ },
  { reason: 'secret:aws-access-key', pattern: /AKIA[0-9A-Z]{16}/ },
  { reason: 'secret:github-token', pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { reason: 'secret:google-api-key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { reason: 'secret:slack-token', pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { reason: 'secret:private-key', pattern: /-----BEGIN[A-Z ]*PRIVATE KEY-----/ },
  { reason: 'pii:email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { reason: 'pii:ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
];

/** Returns every distinct reason this content is taint-worthy (may be
 * more than one — e.g. a file with both an email and an API key). */
export function classifySensitiveContent(content: string): string[] {
  const reasons: string[] = [];
  for (const { reason, pattern } of PATTERNS) {
    if (pattern.test(content)) reasons.push(reason);
  }
  return reasons;
}
