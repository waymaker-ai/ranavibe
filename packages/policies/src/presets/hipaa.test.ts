import { describe, it, expect } from 'vitest';
import { hipaaPolicy } from './hipaa.js';
import { evaluatePolicy } from '../evaluator.js';

describe('HIPAA preset', () => {
  describe('metadata', () => {
    it('should have correct id', () => {
      expect(hipaaPolicy.metadata.id).toBe('hipaa');
    });

    it('should have appropriate tags', () => {
      expect(hipaaPolicy.metadata.tags).toContain('healthcare');
      expect(hipaaPolicy.metadata.tags).toContain('hipaa');
      expect(hipaaPolicy.metadata.tags).toContain('phi');
    });
  });

  describe('PHI identifier detection', () => {
    it('should detect email addresses (PHI identifier #6)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient email: patient@hospital.com' });
      expect(result.violations.some((v) => v.category === 'pii' && v.match?.includes('@'))).toBe(true);
    });

    it('should detect SSN (PHI identifier #7)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient SSN: 123-45-6789' });
      expect(result.violations.some((v) => v.rule === 'ssn')).toBe(true);
    });

    it('should detect medical record numbers (PHI identifier #8)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'MRN: ABC123456' });
      expect(result.violations.some((v) => v.rule === 'medical-record-number')).toBe(true);
    });

    it('should detect phone numbers (PHI identifier #4)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient phone: (555) 123-4567' });
      expect(result.violations.some((v) => v.rule === 'phone')).toBe(true);
    });

    it('should detect street addresses (PHI identifier #2)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient lives at 123 Main Street' });
      expect(result.violations.some((v) => v.rule === 'address')).toBe(true);
    });

    it('should detect dates of birth (PHI identifier #3)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient DOB: 03/15/1990' });
      expect(result.violations.some((v) => v.rule === 'dob')).toBe(true);
    });

    it('should detect IP addresses (PHI identifier #15)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient connected from 10.45.67.89' });
      expect(result.violations.some((v) => v.rule === 'ipv4')).toBe(true);
    });

    it('should detect patient names with title (PHI identifier #1)', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'Patient: Mr. John Smith' });
      expect(result.violations.some((v) => v.rule === 'full-name')).toBe(true);
    });
  });

  describe('content rules', () => {
    it('should flag content containing PHI identifiers', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'The patient SSN is 123-45-6789 and their email is patient@hospital.com',
      });
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should flag medical record numbers', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'MRN: ABC123456 shows the treatment history',
      });
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should require HIPAA disclaimer in content', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'Information about diabetes treatment options available.',
      });
      expect(result.violations.some((v) => v.rule === 'hipaa-disclaimer')).toBe(true);
    });

    it('should not flag content with HIPAA reference', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'Per our HIPAA privacy policy, we handle data carefully.',
      });
      expect(result.violations.filter((v) => v.rule === 'hipaa-disclaimer')).toHaveLength(0);
    });
  });

  describe('model rules', () => {
    it('should deny GPT-3.5', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'test', model: 'gpt-3.5-turbo' });
      expect(result.violations.some((v) => v.rule === 'model-not-allowed')).toBe(true);
    });

    it('should allow Claude models', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'HIPAA compliance test', model: 'claude-sonnet-4-6' });
      expect(result.violations.filter((v) => v.rule === 'model-not-allowed')).toHaveLength(0);
    });
  });

  describe('cost rules', () => {
    it('should flag cost over $5 per request', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'test', cost: 10 });
      expect(result.violations.some((v) => v.rule === 'cost-per-request')).toBe(true);
    });

    it('should pass for costs under $5', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'HIPAA', cost: 2 });
      expect(result.violations.filter((v) => v.rule === 'cost-per-request')).toHaveLength(0);
    });
  });

  describe('access rules', () => {
    it('should require authentication', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'test', authenticated: false });
      expect(result.violations.some((v) => v.rule === 'auth-required')).toBe(true);
    });

    it('should require MFA', () => {
      const result = evaluatePolicy(hipaaPolicy, { content: 'test', authenticated: true, mfa: false });
      expect(result.violations.some((v) => v.rule === 'mfa-required')).toBe(true);
    });

    it('should allow physician role', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'HIPAA test',
        authenticated: true,
        mfa: true,
        role: 'physician',
      });
      expect(result.violations.filter((v) => v.rule === 'role-not-allowed')).toHaveLength(0);
    });

    it('should deny unauthorized roles', () => {
      const result = evaluatePolicy(hipaaPolicy, {
        content: 'test',
        authenticated: true,
        mfa: true,
        role: 'marketing',
      });
      expect(result.violations.some((v) => v.rule === 'role-not-allowed')).toBe(true);
    });
  });
});
