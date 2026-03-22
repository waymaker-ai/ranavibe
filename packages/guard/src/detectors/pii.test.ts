import { describe, it, expect } from 'vitest';
import { detectPII, redactPII, hasPII } from './pii.js';

describe('detectPII', () => {
  describe('email detection', () => {
    it('should detect a valid email address', () => {
      const findings = detectPII('Contact me at john.doe@example.com please');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('email');
      expect(findings[0].value).toBe('john.doe@example.com');
      expect(findings[0].confidence).toBe(0.95);
    });

    it('should detect multiple email addresses', () => {
      const findings = detectPII('Email alice@test.org or bob@company.co.uk');
      const emails = findings.filter((f) => f.type === 'email');
      expect(emails.length).toBeGreaterThanOrEqual(2);
    });

    it('should not detect invalid email-like strings without TLD', () => {
      const findings = detectPII('user@localhost is not a real email');
      const emails = findings.filter((f) => f.type === 'email');
      expect(emails).toHaveLength(0);
    });
  });

  describe('phone number detection', () => {
    it('should detect US phone numbers', () => {
      const findings = detectPII('Call me at (555) 123-4567');
      const phones = findings.filter((f) => f.type === 'phone');
      expect(phones.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect phone numbers with country code', () => {
      const findings = detectPII('My number is +1-555-123-4567');
      const phones = findings.filter((f) => f.type === 'phone');
      expect(phones.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect international phone numbers', () => {
      const findings = detectPII('Reach me at +44 20 7946 0958');
      const phones = findings.filter((f) => f.type === 'phone');
      expect(phones.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SSN detection', () => {
    it('should detect a valid SSN with dashes', () => {
      const findings = detectPII('My SSN is 123-45-6789');
      const ssns = findings.filter((f) => f.type === 'ssn');
      expect(ssns.length).toBeGreaterThanOrEqual(1);
      expect(ssns[0].value).toBe('123-45-6789');
    });

    it('should reject SSN starting with 000', () => {
      const findings = detectPII('Invalid SSN: 000-12-3456');
      const ssns = findings.filter((f) => f.type === 'ssn');
      expect(ssns).toHaveLength(0);
    });

    it('should reject SSN starting with 666', () => {
      const findings = detectPII('Invalid SSN: 666-12-3456');
      const ssns = findings.filter((f) => f.type === 'ssn');
      expect(ssns).toHaveLength(0);
    });

    it('should reject SSN starting with 9xx', () => {
      const findings = detectPII('Invalid SSN: 900-12-3456');
      const ssns = findings.filter((f) => f.type === 'ssn');
      expect(ssns).toHaveLength(0);
    });
  });

  describe('credit card detection', () => {
    it('should detect a valid Visa card number', () => {
      const findings = detectPII('Card: 4532015112830366');
      const cards = findings.filter((f) => f.type === 'credit_card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect a valid Mastercard number', () => {
      const findings = detectPII('Card: 5425233430109903');
      const cards = findings.filter((f) => f.type === 'credit_card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Amex card numbers', () => {
      const findings = detectPII('Card: 374245455400126');
      const cards = findings.filter((f) => f.type === 'credit_card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject card numbers that fail Luhn check', () => {
      const findings = detectPII('Card: 4111111111111112');
      const cards = findings.filter((f) => f.type === 'credit_card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('IP address detection', () => {
    it('should detect IPv4 addresses', () => {
      const findings = detectPII('Server is at 192.168.1.100');
      const ips = findings.filter((f) => f.type === 'ip_address');
      expect(ips.length).toBeGreaterThanOrEqual(1);
      expect(ips[0].value).toBe('192.168.1.100');
    });

    it('should detect IPv6 addresses', () => {
      const findings = detectPII('IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      const ips = findings.filter((f) => f.type === 'ip_address');
      expect(ips.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('date of birth detection', () => {
    it('should detect DOB in MM/DD/YYYY format', () => {
      const findings = detectPII('DOB: 03/15/1990');
      const dobs = findings.filter((f) => f.type === 'date_of_birth');
      expect(dobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect DOB in YYYY-MM-DD format', () => {
      const findings = detectPII('Birthday: 1990-03-15');
      const dobs = findings.filter((f) => f.type === 'date_of_birth');
      expect(dobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect DOB with keyword context', () => {
      const findings = detectPII('born on January 15, 1990');
      const dobs = findings.filter((f) => f.type === 'date_of_birth');
      expect(dobs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('address detection', () => {
    it('should detect street addresses', () => {
      const findings = detectPII('I live at 123 Main Street');
      const addrs = findings.filter((f) => f.type === 'address');
      expect(addrs.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect PO Box addresses', () => {
      const findings = detectPII('Send to P.O. Box 1234');
      const addrs = findings.filter((f) => f.type === 'address');
      expect(addrs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('medical record number detection', () => {
    it('should detect MRN numbers', () => {
      const findings = detectPII('Patient MRN: ABC123456');
      const mrns = findings.filter((f) => f.type === 'medical_record');
      expect(mrns.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Medical Record keyword', () => {
      const findings = detectPII('Medical Record #MR789012');
      const mrns = findings.filter((f) => f.type === 'medical_record');
      expect(mrns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('multiple PII in same text', () => {
    it('should detect multiple PII types in one string', () => {
      const text = 'John is at john@example.com, SSN 123-45-6789, phone (555) 867-5309';
      const findings = detectPII(text);
      const types = new Set(findings.map((f) => f.type));
      expect(types.has('email')).toBe(true);
      expect(types.has('ssn')).toBe(true);
    });
  });

  describe('clean text', () => {
    it('should return no findings for clean text', () => {
      const findings = detectPII('The quick brown fox jumps over the lazy dog.');
      expect(findings).toHaveLength(0);
    });
  });
});

describe('redactPII', () => {
  it('should redact email addresses', () => {
    const result = redactPII('Email: test@example.com');
    expect(result.redacted).toBe('Email: [REDACTED_EMAIL]');
    expect(result.findings).toHaveLength(1);
  });

  it('should redact SSNs', () => {
    const result = redactPII('SSN: 123-45-6789');
    expect(result.redacted).toContain('[REDACTED_SSN]');
    expect(result.redacted).not.toContain('123-45-6789');
  });

  it('should redact multiple PII types correctly', () => {
    const result = redactPII('Contact test@example.com or call (555) 867-5309');
    expect(result.redacted).toContain('[REDACTED_EMAIL]');
    expect(result.redacted).not.toContain('test@example.com');
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
  });

  it('should return original text if no PII found', () => {
    const text = 'Nothing sensitive here.';
    const result = redactPII(text);
    expect(result.redacted).toBe(text);
    expect(result.findings).toHaveLength(0);
  });
});

describe('hasPII', () => {
  it('should return true when PII is present', () => {
    expect(hasPII('My email is user@test.com')).toBe(true);
  });

  it('should return false when no PII is present', () => {
    expect(hasPII('Hello world, no PII here')).toBe(false);
  });

  it('should detect SSN as PII', () => {
    expect(hasPII('SSN: 234-56-7890')).toBe(true);
  });
});
