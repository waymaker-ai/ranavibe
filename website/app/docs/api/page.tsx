'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

const apiSections = [
  {
    package: '@waymakerai/aicofounder-guard',
    description: 'PII detection, prompt injection blocking, toxicity filtering, budget enforcement, rate limiting, and model gating.',
    install: 'npm install @waymakerai/aicofounder-guard',
    exports: [
      {
        name: 'createGuard',
        signature: 'createGuard(options?: GuardOptions): Guard',
        description: 'Create a guard instance with configurable PII, injection, toxicity, budget, rate limit, and model gating. Returns an object with check(), wrap(), middleware(), report(), and resetBudget() methods.',
        options: [
          { name: 'pii', type: "'detect' | 'redact' | 'block' | false", default: "'detect'" },
          { name: 'injection', type: "'block' | 'warn' | false", default: "'block'" },
          { name: 'toxicity', type: "'block' | 'warn' | false", default: "'block'" },
          { name: 'budget', type: 'BudgetConfig | false', default: 'false' },
          { name: 'rateLimit', type: 'RateLimitConfig | false', default: 'false' },
          { name: 'models', type: '{ allowed?: string[]; blocked?: string[] } | false', default: 'false' },
          { name: 'reporter', type: "'console' | 'json' | { webhook: string } | false", default: 'false' },
        ],
        example: `const guard = createGuard({
  pii: 'redact',
  injection: 'block',
  toxicity: 'block',
  budget: { limit: 50, period: 'day', warningAt: 0.8, action: 'block' },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  reporter: 'console',
});`,
      },
      {
        name: 'guard.check',
        signature: 'check(text: string, opts?: { model?: string; direction?: "input" | "output" }): CheckResult',
        description: 'Run all configured guards on the input text. Returns a CheckResult with safe/blocked status, PII findings, injection findings, toxicity findings, redacted text, warnings, violations, cost estimate, and model name.',
        options: [
          { name: 'text', type: 'string', default: 'required' },
          { name: 'opts.model', type: 'string', default: 'undefined' },
          { name: 'opts.direction', type: "'input' | 'output'", default: 'undefined' },
        ],
        returnType: `interface CheckResult {
  safe: boolean;
  blocked: boolean;
  reason?: string;
  warnings: string[];
  piiFindings: PIIFinding[];
  injectionFindings: InjectionFinding[];
  toxicityFindings: ToxicityFinding[];
  redacted?: string;
  cost?: number;
  model?: string;
  violations: Violation[];
}`,
      },
      {
        name: 'guard.wrap',
        signature: 'wrap<T extends object>(client: T): T',
        description: 'Wrap an Anthropic, OpenAI, or Google client with automatic guarding. All API calls through the wrapped client are intercepted, checked, and guarded transparently.',
      },
      {
        name: 'guard.middleware',
        signature: 'middleware(): (req, res, next) => void',
        description: 'Returns an Express-compatible middleware function. POST requests with a body are checked; blocked requests receive a 403 response with violation details.',
      },
      {
        name: 'guard.report',
        signature: 'report(): GuardReport',
        description: 'Returns a summary report of all guard activity: total checks, blocked/warned/passed counts, PII redaction stats by type, injection attempts by category, toxicity stats, cost tracking, rate limit hits, and model denials.',
      },
      {
        name: 'detectPII',
        signature: 'detectPII(text: string): PIIFinding[]',
        description: 'Standalone PII detection. Returns an array of findings with type, value, redacted label, start/end positions, and confidence score. Detects email, SSN, credit card (with Luhn validation), phone, IP address (v4 and v6), date of birth, address, medical record number, passport, and driver\'s license.',
        options: [
          { name: 'text', type: 'string', default: 'required' },
        ],
      },
      {
        name: 'redactPII',
        signature: 'redactPII(text: string): { redacted: string; findings: PIIFinding[] }',
        description: 'Detect and replace all PII in the text with labeled placeholders (e.g., [REDACTED_EMAIL], [REDACTED_SSN]). Returns the redacted text and the list of findings.',
      },
      {
        name: 'detectInjection',
        signature: 'detectInjection(text: string, sensitivity?: "low" | "medium" | "high"): { score: number; findings: InjectionFinding[]; blocked: boolean }',
        description: 'Score text for prompt injection risk. Returns a 0-100 score, an array of matched patterns with category/severity/weight, and a blocked boolean based on the sensitivity threshold. Sensitivity thresholds: low=70, medium=45, high=25.',
        options: [
          { name: 'text', type: 'string', default: 'required' },
          { name: 'sensitivity', type: "'low' | 'medium' | 'high'", default: "'medium'" },
        ],
      },
      {
        name: 'detectToxicity',
        signature: 'detectToxicity(text: string): ToxicityFinding[]',
        description: 'Detect toxic content across 7 categories: profanity (low), hate_speech (critical), violence (high), self_harm (critical), sexual (high), harassment (high), and spam (low). Returns matched patterns with category, severity, matched text, and surrounding context.',
      },
      {
        name: 'hasPII / hasInjection / hasToxicity',
        signature: 'hasPII(text: string): boolean\nhasInjection(text: string, sensitivity?): boolean\nhasToxicity(text: string, minSeverity?): boolean',
        description: 'Boolean convenience functions. hasPII returns true if any PII is detected. hasInjection returns true if the injection score exceeds the threshold. hasToxicity returns true if any finding meets the minimum severity level.',
      },
      {
        name: 'BudgetEnforcer',
        signature: 'new BudgetEnforcer(config: BudgetConfig)',
        description: 'Standalone budget enforcement. Track spending against per-period limits. Methods: checkBudget(additionalCost?), isExceeded(), record(cost), reset().',
        options: [
          { name: 'limit', type: 'number', default: 'required' },
          { name: 'period', type: "'hour' | 'day' | 'week' | 'month'", default: 'required' },
          { name: 'warningAt', type: 'number (0-1)', default: '0.8' },
          { name: 'action', type: "'block' | 'warn'", default: "'block'" },
        ],
      },
      {
        name: 'RateLimiter',
        signature: 'new RateLimiter(config: RateLimitConfig)',
        description: 'Standalone rate limiter using a sliding window. Methods: check() returns { allowed, remaining, resetMs }, record() increments the counter.',
        options: [
          { name: 'maxRequests', type: 'number', default: 'required' },
          { name: 'windowMs', type: 'number', default: 'required' },
        ],
      },
      {
        name: 'ModelGate',
        signature: 'new ModelGate(config: { allowed?: string[]; blocked?: string[] })',
        description: 'Restrict which models can be used. check(model) returns { allowed: boolean, reason?: string }. Supports exact names and glob patterns (e.g., "*-preview").',
      },
    ],
  },
  {
    package: '@waymakerai/aicofounder-compliance',
    description: 'Enterprise compliance enforcement with 9 preset rules for HIPAA, SEC/FINRA, GDPR, CCPA, legal, safety, and security.',
    install: 'npm install @waymakerai/aicofounder-compliance',
    exports: [
      {
        name: 'ComplianceEnforcer',
        signature: 'new ComplianceEnforcer(config?: ComplianceEnforcerConfig)',
        description: 'Main compliance engine. Add rules, enforce them on AI input/output pairs, and track violation history.',
        options: [
          { name: 'rules', type: 'ComplianceRule[]', default: '[]' },
          { name: 'enableAllPresets', type: 'boolean', default: 'false' },
          { name: 'strictMode', type: 'boolean', default: 'false' },
          { name: 'logViolations', type: 'boolean', default: 'true' },
          { name: 'storeViolations', type: 'boolean', default: 'true' },
          { name: 'onViolation', type: '(violation) => void', default: 'no-op' },
          { name: 'onEnforcement', type: '(result) => void', default: 'no-op' },
        ],
        example: `const enforcer = new ComplianceEnforcer({
  rules: [
    PresetRules.hipaaNoMedicalAdvice(),
    PresetRules.secFinancialDisclaimer(),
    PresetRules.gdprPIIProtection(),
  ],
  strictMode: true,
});`,
      },
      {
        name: 'enforcer.enforce',
        signature: 'enforce(input: string, output: string, context?: ComplianceContext): Promise<ComplianceEnforcementResult>',
        description: 'Run all active rules against the AI output. Each rule can allow, block, redact, replace, or append content. Returns the final output, action taken, list of violations, and compliance status.',
        returnType: `interface ComplianceEnforcementResult {
  compliant: boolean;
  action: 'allow' | 'block' | 'redact' | 'replace' | 'append';
  finalOutput?: string;
  violations: ComplianceViolation[];
}`,
      },
      {
        name: 'enforcer.addRule / removeRule',
        signature: 'addRule(rule: ComplianceRule): void\nremoveRule(id: string): void',
        description: 'Dynamically add or remove compliance rules at runtime.',
      },
      {
        name: 'enforcer.getViolations',
        signature: 'getViolations(): ComplianceViolation[]',
        description: 'Returns the full violation history since the enforcer was created.',
      },
      {
        name: 'createComplianceEnforcer',
        signature: 'createComplianceEnforcer(config?: ComplianceEnforcerConfig): ComplianceEnforcer',
        description: 'Factory function that creates and returns a ComplianceEnforcer instance.',
      },
      {
        name: 'PresetRules',
        signature: 'PresetRules.hipaaNoMedicalAdvice(): ComplianceRule\n...',
        description: 'Factory object with 9 preset compliance rule generators. Each returns a fully configured ComplianceRule ready for use with ComplianceEnforcer.',
        options: [
          { name: 'hipaaNoMedicalAdvice()', type: 'ComplianceRule', default: 'Blocks medical diagnoses and treatment advice' },
          { name: 'hipaaPIIProtection()', type: 'ComplianceRule', default: 'Redacts PHI (SSN, MRN, DOB) from output' },
          { name: 'secFinancialDisclaimer()', type: 'ComplianceRule', default: 'Appends financial disclaimer to investment content' },
          { name: 'secNoInvestmentAdvice()', type: 'ComplianceRule', default: 'Blocks specific buy/sell recommendations' },
          { name: 'noLegalAdvice()', type: 'ComplianceRule', default: 'Appends legal disclaimer to legal content' },
          { name: 'gdprPIIProtection()', type: 'ComplianceRule', default: 'Redacts PII per GDPR (email, phone, address, IP)' },
          { name: 'ccpaPrivacy()', type: 'ComplianceRule', default: 'Redacts sensitive data per CCPA (SSN, credit card, passport)' },
          { name: 'ageAppropriate(minAge?)', type: 'ComplianceRule', default: 'Blocks mature content for underage users (default: 13+)' },
          { name: 'noPasswordRequest()', type: 'ComplianceRule', default: 'Blocks AI from requesting passwords or credentials' },
        ],
      },
      {
        name: 'createComplianceRule',
        signature: 'createComplianceRule(options: CreateRuleOptions): ComplianceRule',
        description: 'Create a custom compliance rule with a check function that receives (input, output, context) and returns a compliance result.',
        options: [
          { name: 'id', type: 'string', default: 'required' },
          { name: 'name', type: 'string', default: 'required' },
          { name: 'description', type: 'string', default: 'required' },
          { name: 'category', type: "'healthcare' | 'finance' | 'legal' | 'privacy' | 'safety' | 'security'", default: 'required' },
          { name: 'severity', type: "'low' | 'medium' | 'high' | 'critical'", default: 'required' },
          { name: 'check', type: 'ComplianceCheckFn', default: 'required' },
          { name: 'tags', type: 'string[]', default: '[]' },
          { name: 'enabled', type: 'boolean', default: 'true' },
        ],
        example: `const customRule = createComplianceRule({
  id: 'no-competitor-mention',
  name: 'No Competitor Mentions',
  description: 'Prevent mentioning competitor products',
  category: 'safety',
  severity: 'medium',
  tags: ['brand', 'marketing'],
  check: async (input, output, context) => {
    const competitors = ['CompetitorA', 'CompetitorB'];
    const mentioned = competitors.filter(c =>
      output.toLowerCase().includes(c.toLowerCase())
    );
    if (mentioned.length > 0) {
      return {
        compliant: false,
        action: 'replace',
        message: \`Competitor mentioned: \${mentioned.join(', ')}\`,
        replacement: 'I can help you with our product features.',
        issues: mentioned.map(m => \`competitor_\${m}\`),
        confidence: 0.9,
      };
    }
    return { compliant: true, action: 'allow' };
  },
});`,
      },
      {
        name: 'detectPII / redactPII',
        signature: 'detectPII(text: string, types?: PIIType[]): PIIMatch[]\nredactPII(text: string, types?: PIIType[], replacement?: string): string',
        description: 'Compliance-focused PII detection and redaction. Supports filtering by type: email, phone, ssn, credit_card, ip_address, medical_record, passport, address, name, date_of_birth.',
      },
    ],
  },
  {
    package: '@waymakerai/aicofounder-agent-sdk',
    description: 'Guardrail wrapper for the Anthropic Agent SDK. Adds PII, injection, compliance, cost tracking, content filtering, audit logging, and rate limiting as interceptors.',
    install: 'npm install @waymakerai/aicofounder-agent-sdk',
    exports: [
      {
        name: 'createGuardedAgent',
        signature: 'createGuardedAgent(config: GuardedAgentConfig): GuardedAgent',
        description: 'Create an agent with a full guard pipeline. The pipeline processes input through interceptors (rate limit, injection, PII, compliance, content, cost, audit), calls the LLM, then guards the output. Returns an agent with run() and getGuardReport() methods.',
        options: [
          { name: 'model', type: 'string', default: 'required' },
          { name: 'instructions', type: 'string', default: "'You are a helpful assistant.'" },
          { name: 'guards', type: 'GuardConfig | boolean', default: 'required' },
        ],
        example: `const agent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a helpful customer service agent.',
  guards: {
    pii: { mode: 'redact', onDetection: 'redact' },
    injection: { sensitivity: 'medium', onDetection: 'block' },
    compliance: { frameworks: ['hipaa', 'gdpr'] },
    cost: { budgetPeriod: 'day', warningThreshold: 0.8 },
    contentFilter: true,
    audit: { destination: 'file', filePath: './audit.log' },
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
});

const result = await agent.run('Help me with my account');
console.log(result.output);
console.log(result.blocked);
console.log(result.violations);
console.log(result.cost);
console.log(result.tokensUsed);
console.log(result.guardsApplied);`,
      },
      {
        name: 'GuardedAgent.run',
        signature: 'run(input: string, context?: Record<string, unknown>): Promise<GuardedAgentResult>',
        description: 'Send a message through the guard pipeline, to the LLM, and back through the output guards. Returns the output, block status, violations, cost, token usage, and list of applied guards.',
        returnType: `interface GuardedAgentResult {
  output: string;
  blocked: boolean;
  violations: Violation[];
  cost: number;
  tokensUsed: { input: number; output: number };
  guardsApplied: string[];
}`,
      },
      {
        name: 'GuardedAgent.getGuardReport',
        signature: 'getGuardReport(): GuardReport',
        description: 'Returns a comprehensive report: total requests, total cost, PII detections by type, injection attempts, compliance violations by framework, content filtered count, rate limit hits, audit event count, and timestamps.',
      },
      {
        name: 'Pre-built Factories',
        signature: 'createHIPAAAgent(config): GuardedAgent\ncreateFinancialAgent(config): GuardedAgent\ncreateGDPRAgent(config): GuardedAgent\ncreateSafeAgent(config): GuardedAgent',
        description: 'Pre-configured agent factories with industry-specific guard settings. Each factory creates a GuardedAgent with the appropriate interceptors enabled and configured for its compliance domain.',
        options: [
          { name: 'createHIPAAAgent', type: 'GuardedAgent', default: 'PII redaction + HIPAA compliance + audit logging' },
          { name: 'createFinancialAgent', type: 'GuardedAgent', default: 'SEC/FINRA compliance + cost controls + audit' },
          { name: 'createGDPRAgent', type: 'GuardedAgent', default: 'GDPR PII protection + data minimization + audit' },
          { name: 'createSafeAgent', type: 'GuardedAgent', default: 'Full guard stack: PII + injection + toxicity + rate limit' },
        ],
        example: `import { createHIPAAAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createHIPAAAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a healthcare information assistant.',
});

const result = await agent.run('Tell me about diabetes management');`,
      },
      {
        name: 'Interceptors (7 total)',
        signature: 'PIIInterceptor | InjectionInterceptor | CostInterceptor | ComplianceInterceptor | ContentInterceptor | AuditInterceptor | RateLimitInterceptor',
        description: 'Individual interceptor classes that implement the Interceptor interface with processInput() and processOutput() methods. Can be composed into a custom GuardPipeline for advanced use cases.',
      },
      {
        name: 'GuardPipeline',
        signature: 'new GuardPipeline()\npipeline.use(interceptor: Interceptor): void\npipeline.processInput(text, context): Promise<PipelineResult>\npipeline.processOutput(text, context): Promise<PipelineResult>',
        description: 'Low-level pipeline that chains interceptors. Add interceptors with use(), then process input/output text through the full chain. Order matters: rate limit, injection, PII, compliance, content, cost, audit.',
      },
      {
        name: 'guardTool',
        signature: 'guardTool(tool: ToolDefinition, guards: GuardConfig): ToolDefinition',
        description: 'Wrap an individual tool definition with guards. The tool\'s handler is intercepted and guarded before and after execution.',
      },
      {
        name: 'Reporting',
        signature: 'generateCostReport(agent): CostReportData\nformatCostReport(data): string\ngenerateComplianceReport(agent): ComplianceReportData\nformatComplianceReport(data): string',
        description: 'Generate structured or human-readable reports from a GuardedAgent\'s activity. Cost reports include per-model token usage and spending. Compliance reports include violation counts by framework.',
      },
    ],
  },
  {
    package: '@waymakerai/aicofounder-policies',
    description: 'Declarative policy engine for PII rules, content rules, model rules, cost rules, and data retention. Includes 9 industry presets and a composable policy builder.',
    install: 'npm install @waymakerai/aicofounder-policies',
    exports: [
      {
        name: 'PolicyEngine',
        signature: 'new PolicyEngine(policies: Policy[])',
        description: 'Load one or more policies and evaluate text/context against all active rules. Supports PII patterns, content patterns, model restrictions, cost limits, and data retention rules.',
        example: `import { PolicyEngine, hipaaPolicy, gdprPolicy } from '@waymakerai/aicofounder-policies';

const engine = new PolicyEngine([hipaaPolicy, gdprPolicy]);
const result = engine.evaluate('Patient SSN: 123-45-6789', {
  model: 'claude-sonnet-4-20250514',
  direction: 'output',
});

console.log(result.allowed);    // false
console.log(result.violations); // [{ rule: 'pii', pattern: 'ssn', ... }]`,
      },
      {
        name: 'compose',
        signature: 'compose(policies: Policy[], strategy?: CompositionStrategy, conflictResolution?: ConflictResolution): Policy',
        description: 'Merge multiple policies into a single composite policy. Strategies: "merge" (union of all rules), "override" (last policy wins), "strict" (most restrictive rule wins). Conflict resolution: "most-restrictive", "least-restrictive", "first-wins", "last-wins".',
        options: [
          { name: 'policies', type: 'Policy[]', default: 'required' },
          { name: 'strategy', type: "'merge' | 'override' | 'strict'", default: "'merge'" },
          { name: 'conflictResolution', type: "'most-restrictive' | 'least-restrictive' | 'first-wins' | 'last-wins'", default: "'most-restrictive'" },
        ],
      },
      {
        name: 'evaluatePolicy / evaluatePolicies',
        signature: 'evaluatePolicy(policy: Policy, text: string, context: EvaluationContext): EvaluationResult\nevaluatePolicies(policies: Policy[], text: string, context: EvaluationContext): EvaluationResult',
        description: 'Evaluate text against one or multiple policies. Returns allowed/blocked status, violations with rule details, and the applicable action.',
      },
      {
        name: 'parsePolicy',
        signature: 'parsePolicy(input: string | object): Policy',
        description: 'Parse a policy from YAML string or JavaScript object. Useful for loading policies from configuration files.',
      },
      {
        name: 'validatePolicy',
        signature: 'validatePolicy(policy: Policy): ValidationResult',
        description: 'Validate a policy structure. Returns { valid: boolean, errors: ValidationError[] } with details about any structural issues.',
      },
      {
        name: 'Policy Presets (9 total)',
        signature: 'hipaaPolicy | gdprPolicy | ccpaPolicy | secPolicy | pciPolicy | ferpaPolicy | soxPolicy | safetyPolicy | enterprisePolicy',
        description: 'Pre-built policies for common regulatory frameworks. Each includes appropriate PII rules, content rules, model restrictions, cost controls, and data retention settings.',
        options: [
          { name: 'hipaaPolicy', type: 'Policy', default: 'HIPAA healthcare compliance' },
          { name: 'gdprPolicy', type: 'Policy', default: 'EU General Data Protection Regulation' },
          { name: 'ccpaPolicy', type: 'Policy', default: 'California Consumer Privacy Act' },
          { name: 'secPolicy', type: 'Policy', default: 'SEC/FINRA financial regulations' },
          { name: 'pciPolicy', type: 'Policy', default: 'PCI-DSS payment card security' },
          { name: 'ferpaPolicy', type: 'Policy', default: 'FERPA student data protection' },
          { name: 'soxPolicy', type: 'Policy', default: 'Sarbanes-Oxley financial reporting' },
          { name: 'safetyPolicy', type: 'Policy', default: 'General AI safety (harmful content, jailbreaks)' },
          { name: 'enterprisePolicy', type: 'Policy', default: 'Combined enterprise baseline' },
        ],
      },
      {
        name: 'PII Pattern Constants',
        signature: 'CORE_PII_PATTERNS | EXTENDED_PII_PATTERNS | ALL_PII_PATTERNS | EMAIL_PATTERN | PHONE_PATTERN | SSN_PATTERN | CREDIT_CARD_PATTERN | ...',
        description: 'Pre-defined regex patterns for 20+ PII types. Use these to build custom policy rules. Includes: EMAIL, PHONE, SSN, CREDIT_CARD, CREDIT_CARD_FORMATTED, IPV4, IPV6, DOB, ADDRESS, MEDICAL_RECORD, PASSPORT, DRIVERS_LICENSE, BANK_ACCOUNT, ZIP_CODE, FULL_NAME, AGE, VIN, DEA, NPI.',
      },
      {
        name: 'Content Pattern Constants',
        signature: 'SAFETY_PROHIBITED_PATTERNS | FINANCIAL_REQUIRED_PATTERNS | MEDICAL_REQUIRED_PATTERNS | JAILBREAK_ATTEMPT | PROMPT_INJECTION | ...',
        description: 'Pre-defined content detection patterns for harmful instructions, suicide/self-harm, child exploitation, violence threats, jailbreak attempts, prompt injection, and required disclaimers (investment, medical, legal, AI disclosure).',
      },
      {
        name: 'Cost Rule Presets',
        signature: 'FREE_TIER_COST_RULES | STANDARD_COST_RULES | ENTERPRISE_COST_RULES | UNLIMITED_COST_RULES | createCostRules(config)',
        description: 'Pre-configured cost limits by tier. FREE_TIER: $1/day, STANDARD: $50/day, ENTERPRISE: $500/day. Use createCostRules() to define custom limits.',
      },
      {
        name: 'Model Rule Presets',
        signature: 'OPENAI_ONLY | ANTHROPIC_ONLY | MAJOR_PROVIDERS_ONLY | NO_DEPRECATED | createModelRules(config)',
        description: 'Model restriction presets. OPENAI_ONLY and ANTHROPIC_ONLY lock to a single provider. MAJOR_PROVIDERS_ONLY allows OpenAI, Anthropic, and Google. NO_DEPRECATED blocks known deprecated models.',
      },
      {
        name: 'PolicyBuilder',
        signature: 'new PolicyBuilder(name: string)',
        description: 'Fluent builder for constructing policies programmatically. Chain methods like .pii(patterns).content(rules).model(rules).cost(rules).data(rules).build().',
      },
    ],
  },
  {
    package: '@waymakerai/aicofounder-core',
    description: 'Core SDK with the main CoFounder client, cost tracking, provider management, rate limiting, retry logic, and fallback system.',
    install: 'npm install @waymakerai/aicofounder-core',
    exports: [
      {
        name: 'createCoFounder',
        signature: 'createCoFounder(config: CoFounderConfig): CoFounderClient',
        description: 'Create the main CoFounder client. Configure providers, default model, caching, optimization strategy, and plugins. Supports fluent API chaining.',
        options: [
          { name: 'providers', type: 'Record<string, string>', default: 'required (API keys)' },
          { name: 'defaultModel', type: 'string', default: "'claude-sonnet-4-20250514'" },
          { name: 'cache', type: 'boolean | CacheConfig', default: 'false' },
          { name: 'optimize', type: "'cost' | 'speed' | 'quality'", default: "'cost'" },
          { name: 'budget', type: 'BudgetConfig', default: 'undefined' },
          { name: 'plugins', type: 'RanaPlugin[]', default: '[]' },
        ],
        example: `import { createCoFounder } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    openai: process.env.OPENAI_API_KEY!,
  },
  defaultModel: 'claude-sonnet-4-20250514',
  cache: true,
  optimize: 'cost',
});

// Simple usage
const response = await cofounder.chat('Hello!');

// Fluent API
const response2 = await cofounder
  .provider('anthropic')
  .model('claude-sonnet-4-20250514')
  .optimize('quality')
  .cache(true)
  .chat({ messages: [{ role: 'user', content: 'Hello!' }] });`,
      },
      {
        name: 'CostTracker',
        signature: 'new CostTracker(config?: CostTrackingConfig)',
        description: 'Track spending across all providers and models. Supports budget limits with configurable periods and warning thresholds. Methods: record(model, inputTokens, outputTokens), getStats(), getCostBreakdown(), isOverBudget(), reset().',
        options: [
          { name: 'budget', type: 'BudgetConfig', default: 'undefined' },
          { name: 'onBudgetWarning', type: '(stats: CostStats) => void', default: 'undefined' },
          { name: 'onBudgetExceeded', type: '(stats: CostStats) => void', default: 'undefined' },
        ],
      },
      {
        name: 'withRetry',
        signature: 'withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<RetryResult<T>>',
        description: 'Retry a function with exponential backoff and jitter. Classifies errors (rate_limit, server_error, network_error, timeout) and only retries retryable failures. Returns the result with retry metadata.',
        options: [
          { name: 'maxRetries', type: 'number', default: '3' },
          { name: 'baseDelay', type: 'number (ms)', default: '1000' },
          { name: 'maxDelay', type: 'number (ms)', default: '30000' },
          { name: 'backoffMultiplier', type: 'number', default: '2' },
          { name: 'jitter', type: 'boolean', default: 'true' },
        ],
      },
      {
        name: 'RateLimiter',
        signature: 'createRateLimiter(config: RateLimiterOptions): RateLimiter',
        description: 'Provider-aware rate limiter that respects API rate limit headers. Configure per-provider limits and automatic backoff.',
      },
      {
        name: 'Error Classes',
        signature: 'RanaError | RanaAuthError | RanaRateLimitError | RanaNetworkError | RanaBudgetExceededError | RanaBudgetWarningError',
        description: 'Typed error classes for different failure modes. Each extends RanaError with provider, model, and context information for debugging.',
      },
    ],
  },
];

export default function APIPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-5xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-foreground-secondary mb-4">
            Complete API documentation for the five core CoFounder packages. Every function,
            class, type, and option is documented here with signatures, parameters, defaults,
            return types, and examples.
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {apiSections.map((section) => (
              <a
                key={section.package}
                href={`#${section.package}`}
                className="px-3 py-1.5 text-sm font-mono rounded-lg bg-background-secondary hover:bg-gradient-subtle transition-colors"
              >
                {section.package.replace('@waymakerai/aicofounder-', '')}
              </a>
            ))}
          </div>
        </motion.div>

        <div className="space-y-20">
          {apiSections.map((section, sectionIndex) => (
            <motion.section
              key={section.package}
              id={section.package}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
            >
              <div className="mb-6 pb-4 border-b border-border">
                <h2 className="text-2xl font-bold font-mono mb-2">
                  {section.package}
                </h2>
                <p className="text-foreground-secondary mb-3">{section.description}</p>
                <div className="code-block font-mono text-sm">
                  {section.install}
                </div>
              </div>

              <div className="space-y-8">
                {section.exports.map((exp) => (
                  <div key={exp.name} className="card">
                    <h3 className="text-lg font-bold font-mono mb-2">{exp.name}</h3>
                    <div className="code-block font-mono text-sm mb-4 overflow-x-auto whitespace-pre-wrap">
                      {exp.signature}
                    </div>
                    <p className="text-foreground-secondary mb-4">{exp.description}</p>

                    {exp.options && exp.options.length > 0 && (
                      <>
                        <h4 className="text-sm font-semibold mb-2">Parameters / Options</h4>
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 font-medium">Name</th>
                                <th className="text-left py-2 font-medium">Type</th>
                                <th className="text-left py-2 font-medium">Default</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exp.options.map((opt) => (
                                <tr key={opt.name} className="border-b border-border last:border-0">
                                  <td className="py-2 font-mono text-gradient-from text-xs">{opt.name}</td>
                                  <td className="py-2 font-mono text-foreground-secondary text-xs">{opt.type}</td>
                                  <td className="py-2 text-foreground-secondary text-xs">{opt.default}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {'returnType' in exp && exp.returnType && (
                      <>
                        <h4 className="text-sm font-semibold mb-2">Return Type</h4>
                        <div className="code-block font-mono text-xs mb-4 overflow-x-auto">
                          <pre>{exp.returnType}</pre>
                        </div>
                      </>
                    )}

                    {exp.example && (
                      <>
                        <h4 className="text-sm font-semibold mb-2">Example</h4>
                        <div className="code-block font-mono text-sm overflow-x-auto">
                          <pre>{exp.example}</pre>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-border"
        >
          <Link
            href="https://github.com/waymaker-ai/cofounder"
            target="_blank"
            className="btn-secondary px-6 py-3 inline-flex items-center"
          >
            View Full Source on GitHub
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/docs/security"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Security Deep Dive
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
