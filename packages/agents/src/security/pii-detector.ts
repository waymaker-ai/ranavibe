/**
 * PII Detection and Redaction
 * Comprehensive detection of personally identifiable information
 */

export interface PIIMatch {
  type: PIIType;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'address'
  | 'name'
  | 'passport'
  | 'driver_license'
  | 'bank_account'
  | 'api_key'
  | 'password'
  | 'aws_key'
  | 'private_key';

export interface PIIDetectorConfig {
  /** Types of PII to detect */
  types?: PIIType[];
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Custom patterns to detect */
  customPatterns?: Array<{
    name: string;
    pattern: RegExp;
    type: PIIType;
    confidence: number;
  }>;
  /** Context-aware detection (slower but more accurate) */
  contextAware?: boolean;
}

/**
 * PII Detection patterns with confidence scores
 */
const PII_PATTERNS: Record<PIIType, Array<{ pattern: RegExp; confidence: number }>> = {
  email: [
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, confidence: 0.95 },
  ],
  phone: [
    // US formats
    { pattern: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, confidence: 0.85 },
    // International
    { pattern: /\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, confidence: 0.8 },
    // With extension
    { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\s*(ext|x|extension)\.?\s*\d{1,5}\b/gi, confidence: 0.9 },
  ],
  ssn: [
    { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, confidence: 0.9 },
    // With common prefixes
    { pattern: /\b(ssn|social\s*security)[:\s]*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/gi, confidence: 0.98 },
  ],
  credit_card: [
    // Visa
    { pattern: /\b4\d{3}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, confidence: 0.95 },
    // Mastercard
    { pattern: /\b5[1-5]\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, confidence: 0.95 },
    // Amex
    { pattern: /\b3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5}\b/g, confidence: 0.95 },
    // Discover
    { pattern: /\b6(?:011|5\d{2})[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, confidence: 0.95 },
    // Generic 16 digits
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, confidence: 0.7 },
  ],
  ip_address: [
    // IPv4
    { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, confidence: 0.9 },
    // IPv6
    { pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g, confidence: 0.95 },
  ],
  date_of_birth: [
    // With context
    { pattern: /\b(dob|date\s*of\s*birth|born|birthday)[:\s]*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/gi, confidence: 0.95 },
    { pattern: /\b(dob|date\s*of\s*birth|born|birthday)[:\s]*\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/gi, confidence: 0.95 },
  ],
  address: [
    // US street address
    { pattern: /\b\d{1,5}\s+[\w\s]{1,30}\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)\b/gi, confidence: 0.8 },
    // With unit/apt
    { pattern: /\b(apt|apartment|unit|suite|ste|#)\s*\d+\w?\b/gi, confidence: 0.7 },
    // Zip code
    { pattern: /\b\d{5}(-\d{4})?\b/g, confidence: 0.5 },
  ],
  name: [
    // Name with context
    { pattern: /\b(name|patient|client|customer)[:\s]+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, confidence: 0.85 },
  ],
  passport: [
    // US passport
    { pattern: /\b[A-Z]\d{8}\b/g, confidence: 0.7 },
    // With context
    { pattern: /\b(passport)[:\s#]*[A-Z0-9]{6,9}\b/gi, confidence: 0.95 },
  ],
  driver_license: [
    // With context
    { pattern: /\b(driver'?s?\s*license|dl)[:\s#]*[A-Z0-9]{5,15}\b/gi, confidence: 0.9 },
  ],
  bank_account: [
    // Routing number
    { pattern: /\b(routing|aba)[:\s#]*\d{9}\b/gi, confidence: 0.95 },
    // Account number with context
    { pattern: /\b(account|acct)[:\s#]*\d{8,17}\b/gi, confidence: 0.9 },
    // IBAN
    { pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, confidence: 0.95 },
  ],
  api_key: [
    // Generic API key patterns
    { pattern: /\b(api[_-]?key|apikey)[:\s=]*['"]?[A-Za-z0-9_-]{20,}['"]?\b/gi, confidence: 0.95 },
    // Bearer tokens
    { pattern: /\b(bearer|token)[:\s]+[A-Za-z0-9_-]{20,}\b/gi, confidence: 0.9 },
  ],
  password: [
    // Password in config/code
    { pattern: /\b(password|passwd|pwd)[:\s=]*['"][^'"]{4,}['"]/gi, confidence: 0.95 },
    { pattern: /\b(password|passwd|pwd)[:\s=]+[^\s]{4,}\b/gi, confidence: 0.85 },
  ],
  aws_key: [
    // AWS Access Key ID
    { pattern: /\b(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g, confidence: 0.98 },
    // AWS Secret Access Key
    { pattern: /\b(aws[_-]?secret[_-]?access[_-]?key)[:\s=]*['"]?[A-Za-z0-9/+=]{40}['"]?\b/gi, confidence: 0.98 },
  ],
  private_key: [
    // PEM private key
    { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, confidence: 0.99 },
    // SSH private key
    { pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/g, confidence: 0.99 },
  ],
};

/**
 * Redaction placeholders
 */
const REDACTION_PLACEHOLDERS: Record<PIIType, string> = {
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  ssn: '[SSN_REDACTED]',
  credit_card: '[CC_REDACTED]',
  ip_address: '[IP_REDACTED]',
  date_of_birth: '[DOB_REDACTED]',
  address: '[ADDRESS_REDACTED]',
  name: '[NAME_REDACTED]',
  passport: '[PASSPORT_REDACTED]',
  driver_license: '[DL_REDACTED]',
  bank_account: '[BANK_REDACTED]',
  api_key: '[API_KEY_REDACTED]',
  password: '[PASSWORD_REDACTED]',
  aws_key: '[AWS_KEY_REDACTED]',
  private_key: '[PRIVATE_KEY_REDACTED]',
};

/**
 * PII Detector class
 */
export class PIIDetector {
  private config: Required<PIIDetectorConfig>;
  private allPatterns: Array<{ type: PIIType; pattern: RegExp; confidence: number }>;

  constructor(config: PIIDetectorConfig = {}) {
    this.config = {
      types: config.types || (Object.keys(PII_PATTERNS) as PIIType[]),
      minConfidence: config.minConfidence ?? 0.7,
      customPatterns: config.customPatterns || [],
      contextAware: config.contextAware ?? false,
    };

    // Build pattern list
    this.allPatterns = [];
    for (const type of this.config.types) {
      const patterns = PII_PATTERNS[type] || [];
      for (const p of patterns) {
        this.allPatterns.push({ type, ...p });
      }
    }

    // Add custom patterns
    for (const custom of this.config.customPatterns) {
      this.allPatterns.push(custom);
    }
  }

  /**
   * Detect PII in text
   */
  detect(text: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const seen = new Set<string>();

    for (const { type, pattern, confidence } of this.allPatterns) {
      if (confidence < this.config.minConfidence) continue;

      // Reset regex state
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const key = `${type}:${match.index}:${match[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Adjust confidence based on context if enabled
        let adjustedConfidence = confidence;
        if (this.config.contextAware) {
          adjustedConfidence = this.adjustConfidenceByContext(text, match, type, confidence);
        }

        if (adjustedConfidence >= this.config.minConfidence) {
          matches.push({
            type,
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            confidence: adjustedConfidence,
          });
        }
      }
    }

    // Sort by position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlaps (keep higher confidence)
    return this.removeOverlaps(matches);
  }

  /**
   * Redact PII from text
   */
  redact(text: string): { redacted: string; matches: PIIMatch[] } {
    const matches = this.detect(text);
    let redacted = text;
    let offset = 0;

    for (const match of matches) {
      const placeholder = REDACTION_PLACEHOLDERS[match.type];
      const start = match.start + offset;
      const end = match.end + offset;

      redacted = redacted.slice(0, start) + placeholder + redacted.slice(end);
      offset += placeholder.length - (match.end - match.start);
    }

    return { redacted, matches };
  }

  /**
   * Check if text contains PII
   */
  containsPII(text: string): boolean {
    return this.detect(text).length > 0;
  }

  /**
   * Get PII summary
   */
  getSummary(text: string): Record<PIIType, number> {
    const matches = this.detect(text);
    const summary: Record<string, number> = {};

    for (const match of matches) {
      summary[match.type] = (summary[match.type] || 0) + 1;
    }

    return summary as Record<PIIType, number>;
  }

  /**
   * Validate credit card using Luhn algorithm
   */
  private validateLuhn(number: string): boolean {
    const digits = number.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Adjust confidence based on surrounding context
   */
  private adjustConfidenceByContext(
    text: string,
    match: RegExpExecArray,
    type: PIIType,
    baseConfidence: number
  ): number {
    const contextWindow = 50;
    const start = Math.max(0, match.index - contextWindow);
    const end = Math.min(text.length, match.index + match[0].length + contextWindow);
    const context = text.slice(start, end).toLowerCase();

    // Context keywords that increase confidence
    const boostKeywords: Record<PIIType, string[]> = {
      email: ['email', 'contact', 'reach', 'mail'],
      phone: ['call', 'phone', 'tel', 'mobile', 'cell', 'contact'],
      ssn: ['ssn', 'social', 'security', 'tax'],
      credit_card: ['card', 'payment', 'credit', 'debit', 'visa', 'mastercard'],
      ip_address: ['ip', 'address', 'server', 'host'],
      date_of_birth: ['birth', 'dob', 'born', 'age'],
      address: ['address', 'street', 'city', 'state', 'zip', 'mail'],
      name: ['name', 'patient', 'client', 'user'],
      passport: ['passport', 'travel', 'document'],
      driver_license: ['license', 'driver', 'dl', 'driving'],
      bank_account: ['bank', 'account', 'routing', 'iban'],
      api_key: ['api', 'key', 'token', 'secret'],
      password: ['password', 'pwd', 'pass', 'credential'],
      aws_key: ['aws', 'amazon', 'access', 'secret'],
      private_key: ['private', 'key', 'pem', 'ssh'],
    };

    const keywords = boostKeywords[type] || [];
    const hasKeyword = keywords.some((kw) => context.includes(kw));

    // Additional validation for credit cards
    if (type === 'credit_card') {
      const isValidLuhn = this.validateLuhn(match[0]);
      if (!isValidLuhn) return baseConfidence * 0.3;
    }

    if (hasKeyword) {
      return Math.min(1, baseConfidence * 1.15);
    }

    return baseConfidence;
  }

  /**
   * Remove overlapping matches, keeping higher confidence ones
   */
  private removeOverlaps(matches: PIIMatch[]): PIIMatch[] {
    const result: PIIMatch[] = [];

    for (const match of matches) {
      const overlapping = result.findIndex(
        (r) => !(match.end <= r.start || match.start >= r.end)
      );

      if (overlapping === -1) {
        result.push(match);
      } else if (match.confidence > result[overlapping].confidence) {
        result[overlapping] = match;
      }
    }

    return result;
  }
}

/**
 * Create a PII detector with default config
 */
export function createPIIDetector(config?: PIIDetectorConfig): PIIDetector {
  return new PIIDetector(config);
}

/**
 * Quick PII detection
 */
export function detectPII(text: string, config?: PIIDetectorConfig): PIIMatch[] {
  return new PIIDetector(config).detect(text);
}

/**
 * Quick PII redaction
 */
export function redactPII(
  text: string,
  config?: PIIDetectorConfig
): { redacted: string; matches: PIIMatch[] } {
  return new PIIDetector(config).redact(text);
}
