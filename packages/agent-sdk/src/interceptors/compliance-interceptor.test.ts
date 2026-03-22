import { describe, it, expect } from 'vitest';
import { ComplianceInterceptor } from './compliance-interceptor.js';
import type { InterceptorContext } from '../types.js';

const ctx: InterceptorContext = {
  requestId: 'test-1',
  timestamp: Date.now(),
  direction: 'input',
};

describe('ComplianceInterceptor', () => {
  describe('HIPAA rules', () => {
    it('should detect SSN in PHI context', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processInput('Patient SSN is 123-45-6789', ctx);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations.some((v) => v.rule === 'hipaa-phi-ssn')).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it('should detect medical record numbers', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processInput('Patient MRN: ABC123456', ctx);
      expect(result.violations.some((v) => v.rule === 'hipaa-phi-mrn')).toBe(true);
    });

    it('should detect diagnosis without disclaimer', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'warn' });
      const result = interceptor.processInput('The patient was diagnosed with diabetes', ctx);
      expect(result.violations.some((v) => v.rule === 'hipaa-phi-diagnosis')).toBe(true);
    });

    it('should not flag diagnosis with medical disclaimer', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processInput('Diagnosed with flu. This is not medical advice.', ctx);
      expect(result.violations.filter((v) => v.rule === 'hipaa-phi-diagnosis')).toHaveLength(0);
    });

    it('should detect prescription without professional referral', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processInput('You should take 500mg of aspirin daily', ctx);
      expect(result.violations.some((v) => v.rule === 'hipaa-phi-prescription')).toBe(true);
    });

    it('should not flag prescription with doctor referral', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processInput('Take 500mg as prescribed. Consult your doctor.', ctx);
      expect(result.violations.filter((v) => v.rule === 'hipaa-phi-prescription')).toHaveLength(0);
    });
  });

  describe('GDPR rules', () => {
    it('should detect PII collection without consent', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['gdpr'], onViolation: 'warn' });
      const result = interceptor.processInput('We will collect your email and phone number', ctx);
      expect(result.violations.some((v) => v.rule === 'gdpr-pii-collection')).toBe(true);
    });

    it('should not flag PII collection with consent reference', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['gdpr'], onViolation: 'block' });
      const result = interceptor.processInput('With your consent, we collect your email address', ctx);
      expect(result.violations.filter((v) => v.rule === 'gdpr-pii-collection')).toHaveLength(0);
    });

    it('should detect indefinite data retention', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['gdpr'], onViolation: 'warn' });
      const result = interceptor.processInput('We store indefinitely all records', ctx);
      expect(result.violations.some((v) => v.rule === 'gdpr-data-retention')).toBe(true);
    });

    it('should detect automated profiling without consent', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['gdpr'], onViolation: 'warn' });
      const result = interceptor.processInput('We profile users based on their browsing history', ctx);
      expect(result.violations.some((v) => v.rule === 'gdpr-profiling')).toBe(true);
    });
  });

  describe('SEC rules', () => {
    it('should detect investment advice without disclaimer', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['sec'], onViolation: 'block' });
      const result = interceptor.processInput('You should buy AAPL stock, guaranteed return on investment', ctx);
      expect(result.violations.some((v) => v.rule === 'sec-advice')).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it('should detect insider information references', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['sec'], onViolation: 'block' });
      const result = interceptor.processInput("I have insider information about the merger", ctx);
      expect(result.violations.some((v) => v.rule === 'sec-insider')).toBe(true);
    });

    it('should detect forward-looking statements without disclaimers', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['sec'], onViolation: 'warn' });
      const result = interceptor.processInput('The stock will increase by 50%', ctx);
      expect(result.violations.some((v) => v.rule === 'sec-forward')).toBe(true);
    });
  });

  describe('multiple frameworks', () => {
    it('should check all active frameworks', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa', 'gdpr'], onViolation: 'warn' });
      const result = interceptor.processInput('Patient SSN 123-45-6789. We store data indefinitely.', ctx);
      const frameworks = new Set(result.violations.map((v) => v.details?.framework));
      expect(frameworks.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('violation tracking', () => {
    it('should track total violation count', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'warn' });
      interceptor.processInput('SSN: 123-45-6789', ctx);
      interceptor.processInput('MRN: ABC123456', ctx);
      expect(interceptor.violationCount).toBeGreaterThanOrEqual(2);
    });

    it('should track violations by framework', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa', 'sec'], onViolation: 'warn' });
      interceptor.processInput('SSN: 123-45-6789', ctx);
      interceptor.processInput('You should buy this guaranteed return stock', ctx);
      expect(interceptor.violationsByFramework['HIPAA']).toBeGreaterThanOrEqual(1);
      expect(interceptor.violationsByFramework['SEC']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('output processing', () => {
    it('should check output text for compliance violations', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa'], onViolation: 'block' });
      const result = interceptor.processOutput('Patient SSN: 456-78-9012', ctx);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clean text', () => {
    it('should pass clean text with no violations', () => {
      const interceptor = new ComplianceInterceptor({ frameworks: ['hipaa', 'gdpr', 'sec'], onViolation: 'block' });
      const result = interceptor.processInput('How is the weather today?', ctx);
      expect(result.violations).toHaveLength(0);
      expect(result.blocked).toBe(false);
      expect(result.allowed).toBe(true);
    });
  });

  describe('constructor with true', () => {
    it('should enable default frameworks when given true', () => {
      const interceptor = new ComplianceInterceptor(true);
      expect(interceptor.name).toBe('compliance');
      const result = interceptor.processInput('Patient SSN 123-45-6789', ctx);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
