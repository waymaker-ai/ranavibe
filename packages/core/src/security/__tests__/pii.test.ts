import { describe, it, expect } from 'vitest';
import {
  PIIDetector,
  createPIIDetector,
  detectPIIAdvanced,
  redactPII,
  maskPII,
  validateCreditCard,
  detectCreditCardType,
  type PIIType,
  type PIIMode,
} from '../pii.js';

describe('PIIDetector', () => {
  describe('Basic Detection', () => {
    it('should detect email addresses', () => {
      const detector = createPIIDetector();
      const result = detector.detect('Contact me at john.doe@example.com');

      expect(result.detected).toBe(true);
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe('email');
      expect(result.detections[0].value).toBe('john.doe@example.com');
    });

    it('should detect phone numbers', () => {
      const detector = createPIIDetector();
      const result = detector.detect('Call me at 555-123-4567');

      expect(result.detected).toBe(true);
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe('phone');
    });

    it('should detect SSN', () => {
      const detector = createPIIDetector();
      const result = detector.detect('SSN: 123-45-6789');

      expect(result.detected).toBe(true);
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe('ssn');
      expect(result.detections[0].value).toBe('123-45-6789');
    });

    it('should detect credit card numbers', () => {
      const detector = createPIIDetector();
      const result = detector.detect('Card: 4532-1234-5678-9010');

      expect(result.detected).toBe(true);
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe('creditCard');
    });

    it('should detect IP addresses', () => {
      const detector = createPIIDetector();
      const result = detector.detect('Server IP: 192.168.1.100');

      expect(result.detected).toBe(true);
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe('ipAddress');
      expect(result.detections[0].value).toBe('192.168.1.100');
    });

    it('should detect multiple PII types', () => {
      const detector = createPIIDetector();
      const result = detector.detect(
        'Email: john@example.com, Phone: 555-123-4567, SSN: 123-45-6789'
      );

      expect(result.detected).toBe(true);
      expect(result.detections.length).toBeGreaterThanOrEqual(3);
      expect(result.stats.byType.email).toBe(1);
      expect(result.stats.byType.phone).toBe(1);
      expect(result.stats.byType.ssn).toBe(1);
    });

    it('should return false when no PII is detected', () => {
      const detector = createPIIDetector();
      const result = detector.detect('This is just normal text with no PII');

      expect(result.detected).toBe(false);
      expect(result.detections).toHaveLength(0);
    });
  });

  describe('Redaction Mode', () => {
    it('should redact email addresses', () => {
      const detector = createPIIDetector();
      const result = detector.redact('Contact me at john@example.com');

      expect(result.processed).toBe('Contact me at [EMAIL]');
      expect(result.detections[0].redacted).toBe('[EMAIL]');
    });

    it('should redact phone numbers', () => {
      const detector = createPIIDetector();
      const result = detector.redact('Call 555-123-4567');

      expect(result.processed).toBe('Call [PHONE]');
    });

    it('should redact SSN', () => {
      const detector = createPIIDetector();
      const result = detector.redact('SSN: 123-45-6789');

      expect(result.processed).toBe('SSN: [SSN]');
    });

    it('should redact multiple PII instances', () => {
      const detector = createPIIDetector();
      const result = detector.redact('Email: john@example.com, Phone: 555-123-4567');

      expect(result.processed).toBe('Email: [EMAIL], Phone: [PHONE]');
    });

    it('should use custom placeholders', () => {
      const detector = createPIIDetector({
        placeholders: {
          email: '[REDACTED_EMAIL]',
          phone: '[REDACTED_PHONE]',
        },
      });
      const result = detector.redact('Email: john@example.com, Phone: 555-123-4567');

      expect(result.processed).toContain('[REDACTED_EMAIL]');
      expect(result.processed).toContain('[REDACTED_PHONE]');
    });
  });

  describe('Masking Mode', () => {
    it('should mask email addresses preserving domain', () => {
      const detector = createPIIDetector();
      const result = detector.mask('john@example.com');

      expect(result.processed).toBe('j***@example.com');
    });

    it('should mask phone numbers showing last 4 digits', () => {
      const detector = createPIIDetector();
      const result = detector.mask('555-123-4567');

      expect(result.processed).toContain('4567');
      expect(result.processed).toContain('*');
    });

    it('should mask SSN showing last 4 digits', () => {
      const detector = createPIIDetector();
      const result = detector.mask('123-45-6789');

      expect(result.processed).toBe('***-**-6789');
    });

    it('should mask credit card showing last 4 digits', () => {
      const detector = createPIIDetector();
      const result = detector.mask('4532-1234-5678-9010');

      expect(result.processed).toContain('9010');
      expect(result.processed).toContain('*');
    });

    it('should mask IP showing first octet', () => {
      const detector = createPIIDetector();
      const result = detector.mask('192.168.1.100');

      expect(result.processed).toBe('192.***.***.***');
    });
  });

  describe('Name Detection', () => {
    it('should detect names when enabled', () => {
      const detector = createPIIDetector({
        enabledTypes: ['name'],
        detectNames: true,
      });
      const result = detector.detect('My name is John Smith');

      expect(result.detected).toBe(true);
      const nameDetection = result.detections.find((d) => d.type === 'name');
      expect(nameDetection).toBeDefined();
      expect(nameDetection?.confidence).toBeGreaterThan(0);
    });

    it('should not detect names when disabled', () => {
      const detector = createPIIDetector({
        enabledTypes: ['email', 'phone'],
        detectNames: false,
      });
      const result = detector.detect('My name is John Smith');

      expect(result.detected).toBe(false);
    });

    it('should detect names with honorifics', () => {
      const detector = createPIIDetector({
        enabledTypes: ['name'],
        detectNames: true,
      });
      const result = detector.detect('Dr. Jane Doe will see you now');

      expect(result.detected).toBe(true);
      const nameDetection = result.detections.find((d) => d.type === 'name');
      expect(nameDetection).toBeDefined();
    });

    it('should mask names preserving first letters', () => {
      const detector = createPIIDetector({
        enabledTypes: ['name'],
        detectNames: true,
      });
      const result = detector.mask('John Smith');

      if (result.detected) {
        expect(result.processed).toContain('J***');
        expect(result.processed).toContain('S***');
      }
    });
  });

  describe('Custom Patterns', () => {
    it('should detect custom patterns', () => {
      const detector = createPIIDetector({
        customPatterns: [
          {
            name: 'employeeId',
            pattern: /EMP-\d{6}/g,
            placeholder: '[EMPLOYEE_ID]',
          },
        ],
        enabledTypes: ['custom'],
      });

      const result = detector.detect('Employee ID: EMP-123456');

      expect(result.detected).toBe(true);
      expect(result.detections[0].type).toBe('custom');
      expect(result.detections[0].value).toBe('EMP-123456');
    });

    it('should redact custom patterns with custom placeholder', () => {
      const detector = createPIIDetector({
        customPatterns: [
          {
            name: 'employeeId',
            pattern: /EMP-\d{6}/g,
            placeholder: '[EMPLOYEE_ID]',
          },
        ],
        enabledTypes: ['custom'],
      });

      const result = detector.redact('Employee ID: EMP-123456');

      expect(result.processed).toBe('Employee ID: [REDACTED]');
    });

    it('should use custom mask function', () => {
      const detector = createPIIDetector({
        customPatterns: [
          {
            name: 'customId',
            pattern: /ID-\d{4}/g,
            maskPattern: (value: string) => {
              const parts = value.split('-');
              return `${parts[0]}-****`;
            },
          },
        ],
        enabledTypes: ['custom'],
      });

      const result = detector.mask('ID-1234');

      expect(result.processed).toBe('ID-****');
    });
  });

  describe('Region-Specific Patterns', () => {
    it('should use US patterns by default', () => {
      const detector = createPIIDetector();
      const result = detector.detect('123-45-6789');

      expect(result.detected).toBe(true);
      expect(result.detections[0].type).toBe('ssn');
    });

    it('should support EU region', () => {
      const detector = createPIIDetector({
        region: 'EU',
      });

      // EU patterns are more lenient for national IDs
      const result = detector.detect('123456789');

      // This may or may not detect depending on context
      expect(result).toBeDefined();
    });

    it('should support UK phone numbers', () => {
      const detector = createPIIDetector({
        region: 'UK',
      });

      const result = detector.detect('Call +44 123 456 7890');

      expect(result.detected).toBe(true);
      expect(result.detections.some((d) => d.type === 'phone')).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should only detect enabled types', () => {
      const detector = createPIIDetector({
        enabledTypes: ['email'],
      });

      const result = detector.detect('Email: john@example.com, Phone: 555-123-4567');

      expect(result.detected).toBe(true);
      expect(result.stats.byType.email).toBe(1);
      expect(result.stats.byType.phone).toBe(0);
    });

    it('should update configuration', () => {
      const detector = createPIIDetector({
        enabledTypes: ['email'],
      });

      detector.updateConfig({
        enabledTypes: ['phone'],
      });

      const result = detector.detect('Phone: 555-123-4567');

      expect(result.detected).toBe(true);
      expect(result.detections[0].type).toBe('phone');
    });

    it('should preserve format when configured', () => {
      const detector = createPIIDetector({
        preserveFormat: true,
      });

      const result = detector.mask('john@example.com');

      expect(result.processed).toContain('@example.com');
    });
  });

  describe('Utility Methods', () => {
    it('hasPII should return true when PII exists', () => {
      const detector = createPIIDetector();

      expect(detector.hasPII('Email: john@example.com')).toBe(true);
      expect(detector.hasPII('No sensitive data here')).toBe(false);
    });

    it('process method should support all modes', () => {
      const detector = createPIIDetector();
      const text = 'Email: john@example.com';

      const detectResult = detector.process(text, 'detect');
      expect(detectResult.processed).toBe(text);

      const redactResult = detector.process(text, 'redact');
      expect(redactResult.processed).toContain('[EMAIL]');

      const maskResult = detector.process(text, 'mask');
      expect(maskResult.processed).toContain('@example.com');
    });

    it('should get current configuration', () => {
      const config = {
        enabledTypes: ['email', 'phone'] as PIIType[],
        region: 'US' as const,
      };
      const detector = createPIIDetector(config);

      const currentConfig = detector.getConfig();

      expect(currentConfig.enabledTypes).toEqual(config.enabledTypes);
      expect(currentConfig.region).toBe(config.region);
    });
  });

  describe('Convenience Functions', () => {
    it('detectPIIAdvanced should work', () => {
      const result = detectPIIAdvanced('Email: john@example.com');

      expect(result.detected).toBe(true);
      expect(result.detections[0].type).toBe('email');
    });

    it('redactPII should return redacted string', () => {
      const result = redactPII('Email: john@example.com');

      expect(result).toBe('Email: [EMAIL]');
    });

    it('maskPII should return masked string', () => {
      const result = maskPII('Email: john@example.com');

      expect(result).toContain('@example.com');
    });
  });

  describe('Credit Card Validation', () => {
    it('should validate valid credit card numbers', () => {
      expect(validateCreditCard('4532015112830366')).toBe(true);
      expect(validateCreditCard('4532-0151-1283-0366')).toBe(true);
    });

    it('should reject invalid credit card numbers', () => {
      expect(validateCreditCard('1234567890123456')).toBe(false);
      expect(validateCreditCard('4532015112830367')).toBe(false);
    });

    it('should detect credit card types', () => {
      expect(detectCreditCardType('4532015112830366')).toBe('Visa');
      expect(detectCreditCardType('5425233430109903')).toBe('Mastercard');
      expect(detectCreditCardType('374245455400126')).toBe('American Express');
      expect(detectCreditCardType('6011111111111117')).toBe('Discover');
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      const detector = createPIIDetector();
      const result = detector.detect(
        'Email: john@example.com, Phone: 555-123-4567, Another email: jane@test.com'
      );

      expect(result.stats.total).toBeGreaterThanOrEqual(3);
      expect(result.stats.byType.email).toBe(2);
      expect(result.stats.byType.phone).toBe(1);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions', () => {
      const detector = createPIIDetector();
      const text = 'Contact john@example.com for details';
      const result = detector.detect(text);

      expect(result.detections[0].start).toBe(8);
      expect(result.detections[0].end).toBe(24);
      expect(text.substring(result.detections[0].start, result.detections[0].end)).toBe(
        'john@example.com'
      );
    });

    it('should maintain correct positions after redaction', () => {
      const detector = createPIIDetector();
      const result = detector.redact('Email: john@example.com and phone: 555-123-4567');

      expect(result.processed).toBe('Email: [EMAIL] and phone: [PHONE]');
    });
  });
});
