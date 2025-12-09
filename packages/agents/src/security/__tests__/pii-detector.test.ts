/**
 * PII Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { PIIDetector, detectPII, redactPII } from '../pii-detector';

describe('PIIDetector', () => {
  describe('email detection', () => {
    it('should detect email addresses', () => {
      const text = 'Contact me at john.doe@example.com for more info';
      const matches = detectPII(text);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('email');
      expect(matches[0].value).toBe('john.doe@example.com');
    });

    it('should detect multiple emails', () => {
      const text = 'Email john@test.com or jane@example.org';
      const matches = detectPII(text);

      expect(matches).toHaveLength(2);
      expect(matches.every((m) => m.type === 'email')).toBe(true);
    });
  });

  describe('phone detection', () => {
    it('should detect US phone numbers', () => {
      const text = 'Call me at 555-123-4567';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'phone')).toBe(true);
    });

    it('should detect phone with area code in parens', () => {
      const text = 'Phone: (555) 123-4567';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'phone')).toBe(true);
    });

    it('should detect international format', () => {
      const text = 'Call +1-555-123-4567';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'phone')).toBe(true);
    });
  });

  describe('SSN detection', () => {
    it('should detect SSN format', () => {
      const text = 'SSN: 123-45-6789';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'ssn')).toBe(true);
    });

    it('should detect SSN with context', () => {
      const text = 'My social security number is 123 45 6789';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'ssn')).toBe(true);
    });
  });

  describe('credit card detection', () => {
    it('should detect Visa card numbers', () => {
      const text = 'Card: 4111-1111-1111-1111';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'credit_card')).toBe(true);
    });

    it('should detect Mastercard numbers', () => {
      const text = 'Pay with 5500 0000 0000 0004';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'credit_card')).toBe(true);
    });

    it('should detect Amex numbers', () => {
      const text = 'Amex: 3782 822463 10005';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'credit_card')).toBe(true);
    });
  });

  describe('IP address detection', () => {
    it('should detect IPv4 addresses', () => {
      const text = 'Server IP: 192.168.1.100';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'ip_address')).toBe(true);
    });
  });

  describe('API key detection', () => {
    it('should detect API keys', () => {
      // Using a fake test key pattern (not a real Stripe key format)
      const text = 'api_key: test_key_abcdefghijklmnopqrstuvwxyz1234';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'api_key')).toBe(true);
    });

    it('should detect bearer tokens', () => {
      const text = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'api_key')).toBe(true);
    });
  });

  describe('AWS key detection', () => {
    it('should detect AWS access key IDs', () => {
      const text = 'AWS key: AKIAIOSFODNN7EXAMPLE';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'aws_key')).toBe(true);
    });
  });

  describe('private key detection', () => {
    it('should detect PEM private keys', () => {
      const text = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...';
      const matches = detectPII(text);

      expect(matches.some((m) => m.type === 'private_key')).toBe(true);
    });
  });

  describe('redaction', () => {
    it('should redact all PII', () => {
      const text = 'Email john@test.com, call 555-123-4567, SSN 123-45-6789';
      const result = redactPII(text);

      expect(result.redacted).not.toContain('john@test.com');
      expect(result.redacted).not.toContain('555-123-4567');
      expect(result.redacted).not.toContain('123-45-6789');
      expect(result.redacted).toContain('[EMAIL_REDACTED]');
      expect(result.redacted).toContain('[PHONE_REDACTED]');
      expect(result.redacted).toContain('[SSN_REDACTED]');
    });

    it('should return matches with redaction', () => {
      const text = 'Contact: user@example.com';
      const result = redactPII(text);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].type).toBe('email');
    });
  });

  describe('configuration', () => {
    it('should filter by type', () => {
      const detector = new PIIDetector({ types: ['email'] });
      const text = 'Email: test@test.com, Phone: 555-123-4567';
      const matches = detector.detect(text);

      expect(matches.every((m) => m.type === 'email')).toBe(true);
    });

    it('should filter by confidence', () => {
      const detector = new PIIDetector({ minConfidence: 0.9 });
      const text = 'Email: test@test.com';
      const matches = detector.detect(text);

      expect(matches.every((m) => m.confidence >= 0.9)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const matches = detectPII('');
      expect(matches).toHaveLength(0);
    });

    it('should handle text without PII', () => {
      const matches = detectPII('Hello, this is a normal message');
      expect(matches).toHaveLength(0);
    });

    it('should handle overlapping patterns', () => {
      const text = 'SSN: 123-45-6789';
      const matches = detectPII(text);
      // Should not have duplicates
      const uniquePositions = new Set(matches.map((m) => `${m.start}-${m.end}`));
      expect(uniquePositions.size).toBe(matches.length);
    });
  });
});
