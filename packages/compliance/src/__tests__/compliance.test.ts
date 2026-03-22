import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ComplianceEnforcer,
  createComplianceEnforcer,
  createComplianceRule,
  PresetRules,
  getAllPresetRules,
  detectPII,
  redactPII,
} from '../index';

// =============================================================================
// createComplianceRule
// =============================================================================

describe('createComplianceRule', () => {
  it('should create a rule with required fields', () => {
    const rule = createComplianceRule({
      id: 'test-rule',
      name: 'Test Rule',
      description: 'A test rule',
      category: 'safety',
      severity: 'medium',
      check: async () => ({ compliant: true, action: 'allow' }),
    });

    expect(rule.id).toBe('test-rule');
    expect(rule.name).toBe('Test Rule');
    expect(rule.category).toBe('safety');
    expect(rule.severity).toBe('medium');
    expect(rule.enabled).toBe(true);
  });

  it('should default enabled to true', () => {
    const rule = createComplianceRule({
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'safety',
      severity: 'low',
      check: async () => ({ compliant: true, action: 'allow' }),
    });
    expect(rule.enabled).toBe(true);
  });

  it('should respect explicit enabled=false', () => {
    const rule = createComplianceRule({
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'safety',
      severity: 'low',
      check: async () => ({ compliant: true, action: 'allow' }),
      enabled: false,
    });
    expect(rule.enabled).toBe(false);
  });

  it('should preserve tags and metadata', () => {
    const rule = createComplianceRule({
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'safety',
      severity: 'low',
      check: async () => ({ compliant: true, action: 'allow' }),
      tags: ['tag1', 'tag2'],
      metadata: { custom: 'value' },
    });
    expect(rule.tags).toEqual(['tag1', 'tag2']);
    expect(rule.metadata).toEqual({ custom: 'value' });
  });
});

// =============================================================================
// PII Detection (compliance module)
// =============================================================================

describe('Compliance PII Detection', () => {
  it('should detect emails', () => {
    const matches = detectPII('Contact us at admin@company.com', ['email']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].type).toBe('email');
  });

  it('should detect SSNs', () => {
    const matches = detectPII('SSN: 123-45-6789', ['ssn']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].type).toBe('ssn');
  });

  it('should detect credit cards', () => {
    const matches = detectPII('Card: 4111-1111-1111-1111', ['credit_card']);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should detect phone numbers', () => {
    const matches = detectPII('Phone: 555-123-4567', ['phone']);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should detect IP addresses', () => {
    const matches = detectPII('Server: 10.0.0.1', ['ip_address']);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should detect medical records', () => {
    const matches = detectPII('MRN: 12345678', ['medical_record']);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should detect dates of birth', () => {
    const matches = detectPII('DOB: 01/15/1990', ['date_of_birth']);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should detect only specified types', () => {
    const text = 'Email: test@example.com, Phone: 555-123-4567';
    const emailOnly = detectPII(text, ['email']);
    expect(emailOnly.every(m => m.type === 'email')).toBe(true);
  });

  it('should detect all types when no filter specified', () => {
    const text = 'Email: test@example.com, SSN: 123-45-6789';
    const all = detectPII(text);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Compliance PII Redaction', () => {
  it('should redact detected PII with default placeholder', () => {
    const result = redactPII('Email: test@example.com');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('test@example.com');
  });

  it('should redact only specified types', () => {
    const text = 'Email: test@example.com, SSN: 123-45-6789';
    const result = redactPII(text, ['email']);
    expect(result).not.toContain('test@example.com');
    // SSN should still be present
    expect(result).toContain('123-45-6789');
  });

  it('should support custom replacement text', () => {
    const result = redactPII('Email: test@example.com', undefined, '***');
    expect(result).toContain('***');
  });
});

// =============================================================================
// Preset Rules
// =============================================================================

describe('getAllPresetRules', () => {
  it('should return 9 preset rules', () => {
    const rules = getAllPresetRules();
    expect(rules.length).toBe(9);
  });

  it('should have unique IDs for all preset rules', () => {
    const rules = getAllPresetRules();
    const ids = new Set(rules.map(r => r.id));
    expect(ids.size).toBe(rules.length);
  });

  it('should have all rules enabled by default', () => {
    const rules = getAllPresetRules();
    expect(rules.every(r => r.enabled !== false)).toBe(true);
  });
});

// =============================================================================
// HIPAA Preset
// =============================================================================

describe('HIPAA Rules', () => {
  it('should block medical advice in healthcare context', async () => {
    const rule = PresetRules.hipaaNoMedicalAdvice();
    const result = await rule.check(
      'What should I take for a headache?',
      'You should take 400mg of ibuprofen for your headache.',
      { input: '', output: '', topic: 'medical' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('replace');
  });

  it('should allow non-medical content in healthcare context', async () => {
    const rule = PresetRules.hipaaNoMedicalAdvice();
    const result = await rule.check(
      'What are your office hours?',
      'Our office is open from 9 AM to 5 PM, Monday through Friday.',
      { input: '', output: '', topic: 'medical' }
    );
    expect(result.compliant).toBe(true);
  });

  it('should not trigger on medical keywords outside healthcare context', async () => {
    const rule = PresetRules.hipaaNoMedicalAdvice();
    const result = await rule.check(
      'Tell me about diagnosis',
      'A diagnosis is a medical term for identifying a disease.',
      { input: '', output: '', topic: 'education' }
    );
    expect(result.compliant).toBe(true);
  });

  it('should detect PHI (SSN, MRN, DOB) in output', async () => {
    const rule = PresetRules.hipaaPIIProtection();
    const result = await rule.check(
      'Show me patient info',
      'Patient SSN: 123-45-6789, MRN: 12345678',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('redact');
    expect(result.replacement).toBeDefined();
  });

  it('should pass when no PHI is present', async () => {
    const rule = PresetRules.hipaaPIIProtection();
    const result = await rule.check(
      'What is the weather?',
      'The weather is sunny today.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// SEC/FINRA Preset
// =============================================================================

describe('SEC/FINRA Rules', () => {
  it('should require financial disclaimer for investment content', async () => {
    const rule = PresetRules.secFinancialDisclaimer();
    const result = await rule.check(
      'Should I invest in stocks?',
      'You could consider investing in a diversified stock portfolio.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('append');
    expect(result.replacement).toContain('not financial advice');
  });

  it('should pass when financial disclaimer is present', async () => {
    const rule = PresetRules.secFinancialDisclaimer();
    const result = await rule.check(
      'Tell me about stocks',
      'Stocks can be a good investment. Disclaimer: This is not financial advice.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });

  it('should block specific investment recommendations', async () => {
    const rule = PresetRules.secNoInvestmentAdvice();
    const result = await rule.check(
      'What stock should I buy?',
      'You should buy AAPL stock right now.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('replace');
  });

  it('should block "I recommend investing" pattern', async () => {
    const rule = PresetRules.secNoInvestmentAdvice();
    const result = await rule.check(
      'Where should I put my money?',
      'I recommend investing in Bitcoin.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
  });

  it('should pass general financial education', async () => {
    const rule = PresetRules.secNoInvestmentAdvice();
    const result = await rule.check(
      'Explain index funds',
      'An index fund is a type of mutual fund that tracks a market index like the S&P 500.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// GDPR Preset
// =============================================================================

describe('GDPR Rules', () => {
  it('should detect and redact PII in output', async () => {
    const rule = PresetRules.gdprPIIProtection();
    const result = await rule.check(
      'Show me contacts',
      'Email: john@company.com, Phone: 555-123-4567, IP: 192.168.1.1',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('redact');
    expect(result.replacement).not.toContain('john@company.com');
  });

  it('should pass when no PII is present', async () => {
    const rule = PresetRules.gdprPIIProtection();
    const result = await rule.check(
      'What is GDPR?',
      'GDPR is the General Data Protection Regulation.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// CCPA Preset
// =============================================================================

describe('CCPA Rules', () => {
  it('should detect SSN in output', async () => {
    const rule = PresetRules.ccpaPrivacy();
    const result = await rule.check(
      'Show records',
      'SSN: 123-45-6789',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('redact');
  });

  it('should pass when no sensitive info present', async () => {
    const rule = PresetRules.ccpaPrivacy();
    const result = await rule.check(
      'What is CCPA?',
      'The California Consumer Privacy Act protects consumer data.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// Legal Advice Preset
// =============================================================================

describe('Legal Advice Rules', () => {
  it('should flag legal advice suggestions', async () => {
    const rule = PresetRules.noLegalAdvice();
    const result = await rule.check(
      'Should I sue my neighbor?',
      'You should sue your neighbor for damages.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.replacement).toContain('not legal advice');
  });

  it('should pass neutral legal information', async () => {
    const rule = PresetRules.noLegalAdvice();
    const result = await rule.check(
      'What is tort law?',
      'Tort law covers civil wrongs that cause harm to another person.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// Age-Appropriate Content Preset
// =============================================================================

describe('Age-Appropriate Content Rules', () => {
  it('should block mature content for default age', async () => {
    const rule = PresetRules.ageAppropriate();
    const result = await rule.check(
      'Tell me a story',
      'Here is some explicit content that is not appropriate.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('block');
  });

  it('should allow clean content', async () => {
    const rule = PresetRules.ageAppropriate();
    const result = await rule.check(
      'Tell me a story',
      'Once upon a time, there was a kind princess who helped everyone in the kingdom.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });

  it('should accept custom minimum age', () => {
    const rule = PresetRules.ageAppropriate(18);
    expect(rule.description).toContain('18');
  });
});

// =============================================================================
// No Password Request Preset
// =============================================================================

describe('No Password Request Rules', () => {
  it('should block password requests', async () => {
    const rule = PresetRules.noPasswordRequest();
    const result = await rule.check(
      'Help me login',
      'Please enter your password to continue.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(false);
    expect(result.action).toBe('block');
  });

  it('should allow normal auth discussion', async () => {
    const rule = PresetRules.noPasswordRequest();
    const result = await rule.check(
      'How do passwords work?',
      'Passwords are hashed using algorithms like bcrypt for security.',
      { input: '', output: '' }
    );
    expect(result.compliant).toBe(true);
  });
});

// =============================================================================
// ComplianceEnforcer
// =============================================================================

describe('ComplianceEnforcer', () => {
  let enforcer: ComplianceEnforcer;

  beforeEach(() => {
    enforcer = new ComplianceEnforcer({ logViolations: false });
  });

  it('should create enforcer with default config', () => {
    const e = new ComplianceEnforcer();
    expect(e.getAllRules()).toHaveLength(0);
  });

  it('should add and retrieve rules', () => {
    const rule = PresetRules.hipaaNoMedicalAdvice();
    enforcer.addRule(rule);
    expect(enforcer.getRule('hipaa-no-medical-advice')).toBeDefined();
    expect(enforcer.getAllRules()).toHaveLength(1);
  });

  it('should remove rules', () => {
    enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());
    enforcer.removeRule('hipaa-no-medical-advice');
    expect(enforcer.getRule('hipaa-no-medical-advice')).toBeUndefined();
  });

  it('should not add disabled rules (enabled=false)', () => {
    const rule = createComplianceRule({
      id: 'disabled',
      name: 'Disabled',
      description: 'Test',
      category: 'safety',
      severity: 'low',
      check: async () => ({ compliant: true, action: 'allow' }),
      enabled: false,
    });
    enforcer.addRule(rule);
    expect(enforcer.getRule('disabled')).toBeUndefined();
  });

  it('should load all presets when enableAllPresets is true', () => {
    const e = new ComplianceEnforcer({ enableAllPresets: true, logViolations: false });
    expect(e.getAllRules().length).toBe(9);
  });

  it('should enforce and detect violations', async () => {
    enforcer.addRule(PresetRules.secNoInvestmentAdvice());
    const result = await enforcer.enforce(
      'What should I buy?',
      'You should buy AAPL stock.',
    );
    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.wasModified).toBe(true);
  });

  it('should return compliant result for clean output', async () => {
    enforcer.addRule(PresetRules.secNoInvestmentAdvice());
    const result = await enforcer.enforce(
      'What is an ETF?',
      'An ETF is an exchange-traded fund that holds a basket of securities.',
    );
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.wasModified).toBe(false);
  });

  it('should apply block action correctly', async () => {
    enforcer.addRule(PresetRules.noPasswordRequest());
    const result = await enforcer.enforce(
      'Login help',
      'Please enter your password now.',
    );
    expect(result.action).toBe('block');
    expect(result.finalOutput).toBe('');
  });

  it('should apply append action correctly', async () => {
    enforcer.addRule(PresetRules.secFinancialDisclaimer());
    const result = await enforcer.enforce(
      'Tell me about stocks',
      'You could invest in index funds.',
    );
    expect(result.action).toBe('append');
    expect(result.finalOutput).toContain('not financial advice');
  });

  it('should apply redact action correctly', async () => {
    enforcer.addRule(PresetRules.gdprPIIProtection());
    const result = await enforcer.enforce(
      'Show contacts',
      'Email: john@company.com',
    );
    expect(result.action).toBe('redact');
    expect(result.finalOutput).not.toContain('john@company.com');
  });

  it('should apply replace action correctly', async () => {
    enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());
    const result = await enforcer.enforce(
      'What is my diagnosis?',
      'Your diagnosis is acute bronchitis.',
      { topic: 'medical' }
    );
    expect(result.action).toBe('replace');
    expect(result.finalOutput).toContain('healthcare professional');
  });

  it('should block on critical violation in strict mode', async () => {
    const e = new ComplianceEnforcer({ strictMode: true, logViolations: false });
    e.addRule(PresetRules.hipaaNoMedicalAdvice());
    const result = await e.enforce(
      'Diagnose me',
      'Your diagnosis is cancer',
      { topic: 'medical' }
    );
    expect(result.action).toBe('block');
    expect(result.finalOutput).toBe('');
  });

  it('should store violations for analytics', async () => {
    const e = new ComplianceEnforcer({ storeViolations: true, logViolations: false });
    e.addRule(PresetRules.secNoInvestmentAdvice());
    await e.enforce('Buy?', 'You should buy Bitcoin.');
    await e.enforce('Sell?', 'I recommend selling everything.');

    const violations = e.getViolations();
    expect(violations.length).toBe(2);
  });

  it('should filter violations by ruleId', async () => {
    const e = new ComplianceEnforcer({ storeViolations: true, logViolations: false });
    e.addRule(PresetRules.secNoInvestmentAdvice());
    e.addRule(PresetRules.noPasswordRequest());
    await e.enforce('Buy?', 'You should buy Bitcoin.');
    await e.enforce('Login', 'Enter your password.');

    const secViolations = e.getViolations({ ruleId: 'sec-no-investment-advice' });
    expect(secViolations.length).toBe(1);
  });

  it('should clear all violations', async () => {
    const e = new ComplianceEnforcer({ storeViolations: true, logViolations: false });
    e.addRule(PresetRules.secNoInvestmentAdvice());
    await e.enforce('Buy?', 'You should buy Bitcoin.');
    e.clearViolations();
    expect(e.getViolations()).toHaveLength(0);
  });

  it('should generate stats correctly', async () => {
    const e = new ComplianceEnforcer({ enableAllPresets: true, storeViolations: true, logViolations: false });
    await e.enforce('Buy?', 'You should buy Bitcoin.');

    const stats = e.getStats();
    expect(stats.totalRules).toBe(9);
    expect(stats.enabledRules).toBe(9);
    expect(stats.totalViolations).toBeGreaterThanOrEqual(1);
  });

  it('should support dry-run check (no enforcement side effects)', async () => {
    enforcer.addRule(PresetRules.secNoInvestmentAdvice());
    const result = await enforcer.check(
      'What should I buy?',
      'You should buy AAPL stock.',
    );
    expect(result.compliant).toBe(false);
  });

  it('should call onViolation callback', async () => {
    const onViolation = vi.fn();
    const e = new ComplianceEnforcer({ onViolation, logViolations: false });
    e.addRule(PresetRules.noPasswordRequest());
    await e.enforce('Login', 'Enter your password now.');
    expect(onViolation).toHaveBeenCalled();
  });

  it('should call onEnforcement callback', async () => {
    const onEnforcement = vi.fn();
    const e = new ComplianceEnforcer({ onEnforcement, logViolations: false });
    e.addRule(PresetRules.secNoInvestmentAdvice());
    await e.enforce('Tell me about finance', 'Finance is interesting.');
    expect(onEnforcement).toHaveBeenCalled();
  });

  it('should export and import rules', () => {
    enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());
    enforcer.addRule(PresetRules.secFinancialDisclaimer());

    const exported = enforcer.export();
    expect(exported.rules).toHaveLength(2);

    const e2 = new ComplianceEnforcer({ logViolations: false });
    e2.import(exported);
    expect(e2.getAllRules()).toHaveLength(2);
  });

  it('should handle rules that throw errors gracefully', async () => {
    const badRule = createComplianceRule({
      id: 'bad-rule',
      name: 'Bad',
      description: 'Throws error',
      category: 'safety',
      severity: 'low',
      check: async () => { throw new Error('Rule error'); },
    });
    enforcer.addRule(badRule);
    // Should not throw
    const result = await enforcer.enforce('Test', 'Test output');
    expect(result).toBeDefined();
  });

  it('should handle rules that throw errors in strict mode by blocking', async () => {
    const e = new ComplianceEnforcer({ strictMode: true, logViolations: false });
    const badRule = createComplianceRule({
      id: 'bad-rule',
      name: 'Bad',
      description: 'Throws error',
      category: 'safety',
      severity: 'low',
      check: async () => { throw new Error('Rule error'); },
    });
    e.addRule(badRule);
    const result = await e.enforce('Test', 'Test output');
    expect(result.action).toBe('block');
  });

  it('should check multiple rules in sequence', async () => {
    enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());
    enforcer.addRule(PresetRules.secFinancialDisclaimer());
    enforcer.addRule(PresetRules.gdprPIIProtection());

    const result = await enforcer.enforce(
      'Medical finance question',
      'You could invest in healthcare stocks. Email: doc@hospital.com',
    );
    // Should detect at least the financial content and the PII
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// createComplianceEnforcer factory
// =============================================================================

describe('createComplianceEnforcer', () => {
  it('should create an enforcer instance', () => {
    const e = createComplianceEnforcer();
    expect(e).toBeInstanceOf(ComplianceEnforcer);
  });

  it('should accept config options', () => {
    const e = createComplianceEnforcer({ enableAllPresets: true, logViolations: false });
    expect(e.getAllRules().length).toBe(9);
  });
});

// =============================================================================
// Integration: End-to-end compliance scenarios
// =============================================================================

describe('End-to-end compliance scenarios', () => {
  it('HIPAA scenario: patient data in AI response', async () => {
    const enforcer = createComplianceEnforcer({
      rules: [PresetRules.hipaaPIIProtection(), PresetRules.hipaaNoMedicalAdvice()],
      logViolations: false,
    });

    const result = await enforcer.enforce(
      'What is the patient status?',
      'Patient John Smith (SSN: 123-45-6789) was diagnosed with pneumonia. Treatment plan includes antibiotics.',
      { topic: 'medical' }
    );

    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
  });

  it('SEC scenario: unauthorized investment advice', async () => {
    const enforcer = createComplianceEnforcer({
      rules: [PresetRules.secFinancialDisclaimer(), PresetRules.secNoInvestmentAdvice()],
      logViolations: false,
    });

    const result = await enforcer.enforce(
      'What stock should I buy?',
      'You should buy NVDA stock because it is a good investment right now.',
    );

    expect(result.compliant).toBe(false);
  });

  it('GDPR scenario: PII leaked in response', async () => {
    const enforcer = createComplianceEnforcer({
      rules: [PresetRules.gdprPIIProtection()],
      logViolations: false,
    });

    const result = await enforcer.enforce(
      'List team contacts',
      'Team: alice@company.com (192.168.1.50), bob@company.com (10.0.0.1)',
    );

    expect(result.compliant).toBe(false);
    expect(result.finalOutput).not.toContain('alice@company.com');
    expect(result.finalOutput).not.toContain('192.168.1.50');
  });

  it('Clean scenario: compliant response passes all rules', async () => {
    const enforcer = createComplianceEnforcer({
      enableAllPresets: true,
      logViolations: false,
    });

    const result = await enforcer.enforce(
      'What is machine learning?',
      'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
    );

    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.wasModified).toBe(false);
  });
});

// =============================================================================
// Performance
// =============================================================================

describe('Compliance Performance', () => {
  it('should enforce all 9 presets in under 100ms', async () => {
    const enforcer = createComplianceEnforcer({
      enableAllPresets: true,
      logViolations: false,
    });

    const start = performance.now();
    await enforcer.enforce(
      'What should I do?',
      'Here is a general response about topics including healthcare, finance, and legal matters.',
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
