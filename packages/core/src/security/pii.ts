/**
 * RANA PII Detection and Redaction
 * Comprehensive PII detection, redaction, and masking system
 *
 * @example
 * ```typescript
 * import { PIIDetector, createPIIDetector } from '@rana/core';
 *
 * // Create detector with default settings
 * const detector = createPIIDetector();
 *
 * // Detect PII
 * const result = detector.detect('Contact me at john@example.com or 555-123-4567');
 * // { detected: true, detections: [...], original: '...', processed: '...' }
 *
 * // Redact PII
 * const redacted = detector.redact('SSN: 123-45-6789');
 * // { original: 'SSN: 123-45-6789', processed: 'SSN: [SSN]', detections: [...] }
 *
 * // Mask PII
 * const masked = detector.mask('john.doe@example.com');
 * // { original: 'john.doe@example.com', processed: '***@example.com', detections: [...] }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Types of PII that can be detected
 */
export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'creditCard'
  | 'ipAddress'
  | 'name'
  | 'custom';

/**
 * Processing modes for PII handling
 */
export type PIIMode = 'detect' | 'redact' | 'mask';

/**
 * Region-specific patterns for PII detection
 */
export type PIIRegion = 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'global';

/**
 * Individual PII detection result
 */
export interface PIIDetection {
  /** Type of PII detected */
  type: PIIType;
  /** Original value detected */
  value: string;
  /** Start position in original text */
  start: number;
  /** End position in original text */
  end: number;
  /** Redacted/masked value (if applicable) */
  redacted?: string;
  /** Confidence score (0-1) for name detection */
  confidence?: number;
}

/**
 * PII processing result
 */
export interface PIIResult {
  /** Original input text */
  original: string;
  /** Processed text (may be same as original in detect mode) */
  processed: string;
  /** Whether any PII was detected */
  detected: boolean;
  /** Array of detected PII instances */
  detections: PIIDetection[];
  /** Statistics about detected PII */
  stats: {
    total: number;
    byType: Record<PIIType, number>;
  };
}

/**
 * Custom pattern definition
 */
export interface CustomPattern {
  /** Name/identifier for this pattern */
  name: string;
  /** Regular expression pattern */
  pattern: RegExp;
  /** Placeholder for redaction */
  placeholder?: string;
  /** Mask pattern for masking mode */
  maskPattern?: (value: string) => string;
}

/**
 * Configuration for PII detector
 */
export interface PIIDetectorConfig {
  /** Which PII types to detect (default: all except 'name') */
  enabledTypes?: PIIType[];
  /** Region-specific patterns to use (default: 'US') */
  region?: PIIRegion;
  /** Custom patterns to detect */
  customPatterns?: CustomPattern[];
  /** Custom placeholders for redaction */
  placeholders?: Partial<Record<PIIType, string>>;
  /** Whether to detect names (heuristic-based, may have false positives) */
  detectNames?: boolean;
  /** Minimum confidence for name detection (0-1, default: 0.6) */
  nameConfidenceThreshold?: number;
  /** Whether to preserve format in masking (e.g., keep email domain visible) */
  preserveFormat?: boolean;
}

// ============================================================================
// Pattern Definitions
// ============================================================================

/**
 * Default PII patterns by type and region
 */
const PII_PATTERNS: Record<PIIRegion, Record<string, RegExp>> = {
  US: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
  EU: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?[1-9]\d{0,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?){1,3}\d{1,4}\b/g,
    ssn: /\b\d{9,13}\b/g, // Various EU national IDs
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
  UK: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?44[-.\s]?)?(\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})\b/g,
    ssn: /\b[A-Z]{2}\d{6}[A-D]\b/g, // UK National Insurance Number
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
  CA: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, // Canadian SIN
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
  AU: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?61[-.\s]?)?(\(?\d{1}[-.\s]?\)?)?(\d{4}[-.\s]?\d{4})\b/g,
    ssn: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, // Australian TFN
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
  global: {
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    phone: /\b(\+?[1-9]\d{0,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?){1,4}\d{1,4}\b/g,
    ssn: /\b\d{3}[-\s]?\d{2,3}[-\s]?\d{3,4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  },
};

/**
 * Default placeholders for redaction
 */
const DEFAULT_PLACEHOLDERS: Record<PIIType, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  ssn: '[SSN]',
  creditCard: '[CREDIT_CARD]',
  ipAddress: '[IP_ADDRESS]',
  name: '[NAME]',
  custom: '[REDACTED]',
};

/**
 * Common name patterns and indicators (heuristic-based)
 */
const NAME_PATTERNS = {
  // Honorifics
  honorifics: /\b(Mr|Mrs|Ms|Miss|Dr|Prof|Sir|Madam|Lord|Lady)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
  // Full names (capitalized words, 2-3 parts)
  fullName: /\b[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+\b/g,
  // Context-based (common name introductions)
  contextual: /(?:my name is|I am|I'm|this is|signed by|from|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
};

/**
 * Common first and last names for validation (small subset for confidence scoring)
 */
const COMMON_NAMES = new Set([
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Mary',
  'James', 'Jennifer', 'William', 'Linda', 'Richard', 'Patricia', 'Joseph',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore',
]);

// ============================================================================
// PIIDetector Class
// ============================================================================

/**
 * PII Detector - Detects and processes personally identifiable information
 */
export class PIIDetector {
  private config: Required<PIIDetectorConfig>;
  private patterns: Map<PIIType, RegExp[]>;

  constructor(config: PIIDetectorConfig = {}) {
    // Set defaults
    this.config = {
      enabledTypes: config.enabledTypes || ['email', 'phone', 'ssn', 'creditCard', 'ipAddress'],
      region: config.region || 'US',
      customPatterns: config.customPatterns || [],
      placeholders: { ...DEFAULT_PLACEHOLDERS, ...config.placeholders },
      detectNames: config.detectNames || false,
      nameConfidenceThreshold: config.nameConfidenceThreshold || 0.6,
      preserveFormat: config.preserveFormat !== undefined ? config.preserveFormat : true,
    };

    // Build pattern map
    this.patterns = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize regex patterns based on configuration
   */
  private initializePatterns(): void {
    const regionPatterns = PII_PATTERNS[this.config.region];

    // Add standard patterns
    for (const type of this.config.enabledTypes) {
      if (type === 'custom' || type === 'name') continue;

      const pattern = regionPatterns[type];
      if (pattern) {
        // Clone the regex to reset lastIndex
        const clonedPattern = new RegExp(pattern.source, pattern.flags);
        this.patterns.set(type, [clonedPattern]);
      }
    }

    // Add custom patterns
    if (this.config.customPatterns.length > 0) {
      const customRegexes = this.config.customPatterns.map(p => {
        return new RegExp(p.pattern.source, p.pattern.flags);
      });
      this.patterns.set('custom', customRegexes);
    }

    // Add name patterns if enabled
    if (this.config.detectNames) {
      this.patterns.set('name', [
        new RegExp(NAME_PATTERNS.honorifics.source, NAME_PATTERNS.honorifics.flags),
        new RegExp(NAME_PATTERNS.fullName.source, NAME_PATTERNS.fullName.flags),
        new RegExp(NAME_PATTERNS.contextual.source, NAME_PATTERNS.contextual.flags),
      ]);
    }
  }

  /**
   * Detect PII in text without modifying it
   */
  detect(text: string): PIIResult {
    const detections: PIIDetection[] = [];

    // Detect each enabled PII type
    this.patterns.forEach((patterns, type) => {
      for (const pattern of patterns) {
        // Reset regex state
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
          const value = match[0];
          const start = match.index;
          const end = start + value.length;

          // For names, calculate confidence
          let confidence: number | undefined;
          if (type === 'name') {
            confidence = this.calculateNameConfidence(value);
            if (confidence < this.config.nameConfidenceThreshold) {
              continue; // Skip low-confidence name matches
            }
          }

          detections.push({
            type,
            value,
            start,
            end,
            confidence,
          });
        }
      }
    });

    // Sort by position
    detections.sort((a, b) => a.start - b.start);

    return {
      original: text,
      processed: text,
      detected: detections.length > 0,
      detections,
      stats: this.calculateStats(detections),
    };
  }

  /**
   * Redact PII by replacing with placeholders
   */
  redact(text: string): PIIResult {
    const detectResult = this.detect(text);
    if (!detectResult.detected) {
      return detectResult;
    }

    let processed = text;
    let offset = 0;

    // Process detections in order
    for (const detection of detectResult.detections) {
      const placeholder = this.getPlaceholder(detection.type);
      const originalLength = detection.value.length;
      const newLength = placeholder.length;

      // Update positions with offset
      const adjustedStart = detection.start + offset;
      const adjustedEnd = detection.end + offset;

      // Replace in processed text
      processed = processed.substring(0, adjustedStart) + placeholder + processed.substring(adjustedEnd);

      // Update offset for next replacements
      offset += newLength - originalLength;

      // Store redacted value
      detection.redacted = placeholder;
    }

    return {
      ...detectResult,
      processed,
    };
  }

  /**
   * Mask PII by partially hiding it
   */
  mask(text: string): PIIResult {
    const detectResult = this.detect(text);
    if (!detectResult.detected) {
      return detectResult;
    }

    let processed = text;
    let offset = 0;

    // Process detections in order
    for (const detection of detectResult.detections) {
      const masked = this.maskValue(detection.type, detection.value);
      const originalLength = detection.value.length;
      const newLength = masked.length;

      // Update positions with offset
      const adjustedStart = detection.start + offset;
      const adjustedEnd = detection.end + offset;

      // Replace in processed text
      processed = processed.substring(0, adjustedStart) + masked + processed.substring(adjustedEnd);

      // Update offset for next replacements
      offset += newLength - originalLength;

      // Store masked value
      detection.redacted = masked;
    }

    return {
      ...detectResult,
      processed,
    };
  }

  /**
   * Process text according to specified mode
   */
  process(text: string, mode: PIIMode): PIIResult {
    switch (mode) {
      case 'detect':
        return this.detect(text);
      case 'redact':
        return this.redact(text);
      case 'mask':
        return this.mask(text);
      default:
        throw new Error(`Invalid PII mode: ${mode}`);
    }
  }

  /**
   * Check if text contains any PII (quick check)
   */
  hasPII(text: string): boolean {
    let hasPII = false;
    this.patterns.forEach((patterns) => {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) {
          hasPII = true;
          return;
        }
      }
    });
    return hasPII;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get placeholder for a PII type
   */
  private getPlaceholder(type: PIIType): string {
    return this.config.placeholders[type] || DEFAULT_PLACEHOLDERS[type];
  }

  /**
   * Mask a value based on its type
   */
  private maskValue(type: PIIType, value: string): string {
    if (!this.config.preserveFormat) {
      return '*'.repeat(value.length);
    }

    switch (type) {
      case 'email':
        return this.maskEmail(value);
      case 'phone':
        return this.maskPhone(value);
      case 'ssn':
        return this.maskSSN(value);
      case 'creditCard':
        return this.maskCreditCard(value);
      case 'ipAddress':
        return this.maskIP(value);
      case 'name':
        return this.maskName(value);
      case 'custom':
        return this.maskCustom(value);
      default:
        return '*'.repeat(value.length);
    }
  }

  /**
   * Mask email address (show domain)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '*'.repeat(email.length);

    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 1)
      : '*'.repeat(local.length);

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number (show last 4 digits)
   */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(phone.length);

    const last4 = digits.slice(-4);
    const masked = '*'.repeat(digits.length - 4) + last4;

    // Try to preserve original format
    let result = '';
    let digitIndex = 0;
    for (const char of phone) {
      if (/\d/.test(char)) {
        result += masked[digitIndex++] || '*';
      } else {
        result += char;
      }
    }
    return result;
  }

  /**
   * Mask SSN (show last 4 digits)
   */
  private maskSSN(ssn: string): string {
    const digits = ssn.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(ssn.length);

    const last4 = digits.slice(-4);
    return '***-**-' + last4;
  }

  /**
   * Mask credit card (show last 4 digits)
   */
  private maskCreditCard(cc: string): string {
    const digits = cc.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(cc.length);

    const last4 = digits.slice(-4);
    const separator = cc.includes('-') ? '-' : cc.includes(' ') ? ' ' : '';

    if (separator) {
      return `****${separator}****${separator}****${separator}${last4}`;
    }
    return '*'.repeat(digits.length - 4) + last4;
  }

  /**
   * Mask IP address (show first octet)
   */
  private maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return '*'.repeat(ip.length);

    return `${parts[0]}.***.***.***`;
  }

  /**
   * Mask name (show first letter of each part)
   */
  private maskName(name: string): string {
    return name
      .split(/\s+/)
      .map(part => part.length > 1 ? part[0] + '*'.repeat(part.length - 1) : part)
      .join(' ');
  }

  /**
   * Mask custom pattern value
   */
  private maskCustom(value: string): string {
    // Check if custom pattern has a mask function
    const customPattern = this.config.customPatterns.find(p =>
      new RegExp(p.pattern.source, p.pattern.flags).test(value)
    );

    if (customPattern?.maskPattern) {
      return customPattern.maskPattern(value);
    }

    return '*'.repeat(value.length);
  }

  /**
   * Calculate confidence score for name detection
   */
  private calculateNameConfidence(value: string): number {
    let confidence = 0.5; // Base confidence

    // Check if parts are in common names list
    const parts = value.split(/\s+/);
    const commonNameMatches = parts.filter(part => COMMON_NAMES.has(part)).length;
    confidence += (commonNameMatches / parts.length) * 0.3;

    // Check for honorifics
    if (/^(Mr|Mrs|Ms|Miss|Dr|Prof)\./i.test(value)) {
      confidence += 0.2;
    }

    // Check capitalization pattern
    const properlyCapitalized = parts.every(part => /^[A-Z][a-z]+$/.test(part));
    if (properlyCapitalized) {
      confidence += 0.1;
    }

    // Penalize single words (less likely to be full names)
    if (parts.length === 1) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate statistics for detections
   */
  private calculateStats(detections: PIIDetection[]): {
    total: number;
    byType: Record<PIIType, number>;
  } {
    const byType: Record<PIIType, number> = {
      email: 0,
      phone: 0,
      ssn: 0,
      creditCard: 0,
      ipAddress: 0,
      name: 0,
      custom: 0,
    };

    for (const detection of detections) {
      byType[detection.type]++;
    }

    return {
      total: detections.length,
      byType,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PIIDetectorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      placeholders: {
        ...this.config.placeholders,
        ...config.placeholders,
      },
    };

    // Rebuild patterns
    this.patterns.clear();
    this.initializePatterns();
  }

  /**
   * Get current configuration
   */
  getConfig(): PIIDetectorConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a PII detector with configuration
 */
export function createPIIDetector(config?: PIIDetectorConfig): PIIDetector {
  return new PIIDetector(config);
}

/**
 * Quick detect function (convenience wrapper)
 */
export function detectPIIAdvanced(text: string, config?: PIIDetectorConfig): PIIResult {
  const detector = new PIIDetector(config);
  return detector.detect(text);
}

/**
 * Quick redact function (convenience wrapper)
 */
export function redactPII(text: string, config?: PIIDetectorConfig): string {
  const detector = new PIIDetector(config);
  return detector.redact(text).processed;
}

/**
 * Quick mask function (convenience wrapper)
 */
export function maskPII(text: string, config?: PIIDetectorConfig): string {
  const detector = new PIIDetector(config);
  return detector.mask(text).processed;
}

// ============================================================================
// Luhn Algorithm for Credit Card Validation
// ============================================================================

/**
 * Validate credit card number using Luhn algorithm
 */
export function validateCreditCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect credit card type
 */
export function detectCreditCardType(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\D/g, '');

  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  if (/^35/.test(digits)) return 'JCB';
  if (/^30[0-5]/.test(digits)) return 'Diners Club';

  return null;
}
