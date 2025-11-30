# PII Detection and Redaction

Comprehensive personally identifiable information (PII) detection, redaction, and masking system for RANA.

## Features

- **Multiple PII Types**: Detect emails, phone numbers, SSNs, credit cards, IP addresses, and names
- **Three Processing Modes**: Detect, redact, or mask PII
- **Region-Specific Patterns**: Support for US, EU, UK, CA, AU, and global patterns
- **Custom Patterns**: Add your own PII patterns
- **Configurable**: Enable/disable specific PII types, custom placeholders, and more
- **Structured Results**: Detailed detection information with positions and statistics
- **Credit Card Validation**: Luhn algorithm validation and card type detection

## Installation

```typescript
import {
  PIIDetector,
  createPIIDetector,
  detectPIIAdvanced,
  redactPII,
  maskPII,
} from '@rana/core';
```

## Quick Start

### Basic Detection

```typescript
const detector = createPIIDetector();

const result = detector.detect('Contact me at john@example.com');

console.log(result.detected); // true
console.log(result.detections);
// [{
//   type: 'email',
//   value: 'john@example.com',
//   start: 14,
//   end: 30
// }]
```

### Redaction

```typescript
const redacted = detector.redact('My SSN is 123-45-6789');
console.log(redacted.processed); // "My SSN is [SSN]"
```

### Masking

```typescript
const masked = detector.mask('Email: john.doe@example.com');
console.log(masked.processed); // "Email: j*******@example.com"
```

## Processing Modes

### Detect Mode

Returns PII locations without modifying the text.

```typescript
const result = detector.detect(text);
// result.processed === text (unchanged)
// result.detections contains all found PII
```

### Redact Mode

Replaces PII with placeholders.

```typescript
const result = detector.redact('Call 555-123-4567');
// result.processed === "Call [PHONE]"
```

### Mask Mode

Partially hides PII while preserving some information.

```typescript
const result = detector.mask('Card: 4532-1234-5678-9010');
// result.processed === "Card: ****-****-****-9010"
```

## Supported PII Types

| Type | Examples | Default Enabled |
|------|----------|----------------|
| `email` | john@example.com | ✓ |
| `phone` | 555-123-4567, (555) 123-4567 | ✓ |
| `ssn` | 123-45-6789 | ✓ |
| `creditCard` | 4532-1234-5678-9010 | ✓ |
| `ipAddress` | 192.168.1.100 | ✓ |
| `name` | John Smith, Dr. Jane Doe | ✗ (heuristic) |
| `custom` | Custom patterns | ✗ |

## Configuration

### Basic Configuration

```typescript
const detector = createPIIDetector({
  // Which PII types to detect
  enabledTypes: ['email', 'phone', 'ssn'],

  // Region-specific patterns
  region: 'US', // 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'global'

  // Custom redaction placeholders
  placeholders: {
    email: '[EMAIL_REDACTED]',
    phone: '[PHONE_REDACTED]',
  },

  // Preserve format when masking
  preserveFormat: true,
});
```

### Name Detection (Heuristic)

Name detection uses heuristics and may have false positives.

```typescript
const detector = createPIIDetector({
  enabledTypes: ['name'],
  detectNames: true,
  nameConfidenceThreshold: 0.6, // 0-1, higher = stricter
});

const result = detector.detect('My name is John Smith');
// result.detections[0].confidence === 0.8 (example)
```

### Custom Patterns

Add your own PII patterns:

```typescript
const detector = createPIIDetector({
  enabledTypes: ['custom'],
  customPatterns: [
    {
      name: 'employeeId',
      pattern: /EMP-\d{6}/g,
      placeholder: '[EMPLOYEE_ID]',
      maskPattern: (value) => 'EMP-******',
    },
  ],
});
```

## Region-Specific Patterns

Different regions have different PII formats:

```typescript
// US patterns (default)
const usDetector = createPIIDetector({ region: 'US' });
usDetector.detect('555-123-4567'); // Detects US phone format

// UK patterns
const ukDetector = createPIIDetector({ region: 'UK' });
ukDetector.detect('+44 20 7123 4567'); // Detects UK phone format
ukDetector.detect('AB123456C'); // Detects UK National Insurance Number

// EU patterns
const euDetector = createPIIDetector({ region: 'EU' });
// More lenient patterns for various EU formats

// Global patterns (most permissive)
const globalDetector = createPIIDetector({ region: 'global' });
```

## Result Structure

All processing methods return a `PIIResult`:

```typescript
interface PIIResult {
  original: string;        // Original input text
  processed: string;       // Processed text (redacted/masked/same)
  detected: boolean;       // Whether any PII was found
  detections: PIIDetection[];  // Array of detected PII
  stats: {
    total: number;         // Total PII instances found
    byType: Record<PIIType, number>;  // Count by type
  };
}

interface PIIDetection {
  type: PIIType;          // Type of PII
  value: string;          // Original value
  start: number;          // Start position in text
  end: number;            // End position in text
  redacted?: string;      // Redacted/masked value (if applicable)
  confidence?: number;    // Confidence score (0-1, for names)
}
```

## Advanced Usage

### Dynamic Configuration

Update configuration at runtime:

```typescript
const detector = createPIIDetector({ enabledTypes: ['email'] });

// Later...
detector.updateConfig({
  enabledTypes: ['email', 'phone', 'ssn'],
  region: 'EU',
});
```

### Process by Mode

Use a single detector with different modes:

```typescript
const detector = createPIIDetector();
const text = 'Contact: john@example.com';

detector.process(text, 'detect');  // Detection only
detector.process(text, 'redact');  // Redaction
detector.process(text, 'mask');    // Masking
```

### Quick Check

Check if text contains PII without full processing:

```typescript
if (detector.hasPII(userInput)) {
  console.log('Warning: PII detected in user input');
}
```

### Convenience Functions

For one-off operations:

```typescript
// Quick detection with config
const result = detectPIIAdvanced(text, { region: 'EU' });

// Quick redaction with defaults
const redacted = redactPII(text);

// Quick masking with defaults
const masked = maskPII(text);
```

## Credit Card Utilities

### Validate Credit Cards

```typescript
import { validateCreditCard, detectCreditCardType } from '@rana/core';

const isValid = validateCreditCard('4532015112830366');
console.log(isValid); // true (uses Luhn algorithm)

const cardType = detectCreditCardType('4532015112830366');
console.log(cardType); // "Visa"
```

Supported card types:
- Visa
- Mastercard
- American Express
- Discover
- JCB
- Diners Club

## Real-World Examples

### Chat Application

Protect user messages in a chat application:

```typescript
const chatDetector = createPIIDetector({
  enabledTypes: ['email', 'phone', 'creditCard'],
  preserveFormat: true,
});

function sanitizeChatMessage(message: string): string {
  return chatDetector.mask(message).processed;
}

const userMessage = 'My email is john@example.com';
const safe = sanitizeChatMessage(userMessage);
// "My email is j***@example.com"
```

### Audit Log Sanitization

Remove PII from audit logs:

```typescript
const auditDetector = createPIIDetector({
  enabledTypes: ['email', 'phone', 'ipAddress'],
});

function sanitizeAuditLog(log: AuditLog): AuditLog {
  return {
    ...log,
    user: redactPII(log.user),
    details: redactPII(log.details),
  };
}
```

### Content Moderation

Detect and warn about PII in user-generated content:

```typescript
function moderateContent(content: string): {
  safe: boolean;
  warnings: string[];
  sanitized: string;
} {
  const detector = createPIIDetector();
  const result = detector.mask(content);

  const warnings = result.detections.map(
    d => `${d.type} detected and masked`
  );

  return {
    safe: !result.detected,
    warnings,
    sanitized: result.processed,
  };
}
```

### API Request/Response Logging

Sanitize API logs:

```typescript
const apiDetector = createPIIDetector({
  enabledTypes: ['email', 'phone', 'creditCard', 'ssn'],
});

function logAPIRequest(request: any): void {
  const sanitized = {
    ...request,
    body: redactPII(JSON.stringify(request.body)),
  };

  logger.info('API Request:', sanitized);
}
```

## Masking Strategies

Different PII types use different masking strategies:

```typescript
// Email: Show first letter and domain
'john.doe@example.com' → 'j*******@example.com'

// Phone: Show last 4 digits
'555-123-4567' → '***-***-4567'

// SSN: Show last 4 digits
'123-45-6789' → '***-**-6789'

// Credit Card: Show last 4 digits with format
'4532-1234-5678-9010' → '****-****-****-9010'

// IP Address: Show first octet
'192.168.1.100' → '192.***.***.***'

// Name: Show first letter of each part
'John Smith' → 'J*** S*****'
```

## Best Practices

### 1. Use Appropriate Mode

- **Detect**: For analytics and alerting
- **Redact**: For complete PII removal (logs, archives)
- **Mask**: For user-facing displays (support tickets, previews)

### 2. Configure for Your Region

```typescript
// Configure based on your primary user base
const detector = createPIIDetector({
  region: process.env.REGION || 'US',
});
```

### 3. Enable Only Needed Types

```typescript
// Don't enable all types if you don't need them
const detector = createPIIDetector({
  enabledTypes: ['email', 'phone'], // Only what you need
});
```

### 4. Name Detection Caveats

Name detection is heuristic-based and may have false positives:

```typescript
// Use higher threshold for fewer false positives
const detector = createPIIDetector({
  detectNames: true,
  nameConfidenceThreshold: 0.7, // Higher = stricter
});

// Review detected names before taking action
const result = detector.detect(text);
result.detections
  .filter(d => d.type === 'name')
  .forEach(d => {
    if (d.confidence && d.confidence < 0.8) {
      console.warn('Low confidence name detection:', d.value);
    }
  });
```

### 5. Custom Patterns for Domain-Specific PII

```typescript
const detector = createPIIDetector({
  customPatterns: [
    {
      name: 'patientId',
      pattern: /PAT-\d{6}/g,
      placeholder: '[PATIENT_ID]',
    },
    {
      name: 'accountNumber',
      pattern: /ACC-[A-Z]{2}-\d{8}/g,
      placeholder: '[ACCOUNT]',
    },
  ],
});
```

### 6. Test with Real Data

```typescript
// Test with realistic samples
const testCases = [
  'john.doe@company.com',
  'Contact: (555) 123-4567',
  'SSN: 123-45-6789',
];

testCases.forEach(test => {
  const result = detector.detect(test);
  console.log(`Test: ${test}`);
  console.log(`Detected: ${result.detected}`);
  console.log(`Types: ${result.detections.map(d => d.type).join(', ')}`);
});
```

## Performance Considerations

### Efficient Pattern Matching

The detector uses optimized regex patterns:

```typescript
// Patterns are compiled once at initialization
const detector = createPIIDetector();

// Reuse the same detector instance
for (const text of largeDataset) {
  detector.detect(text);
}
```

### Quick Check Before Full Processing

```typescript
// Use hasPII for quick checks
if (!detector.hasPII(text)) {
  return text; // Skip processing if no PII
}

// Only process if needed
return detector.redact(text).processed;
```

## Integration with RANA Security

### Combine with Audit Logger

```typescript
import { createAuditLogger, createPIIDetector } from '@rana/core';

const auditLogger = createAuditLogger({
  hashSensitiveData: true,
});

const piiDetector = createPIIDetector();

// Sanitize before logging
function secureLog(action: string, details: any) {
  const sanitizedDetails = redactPII(JSON.stringify(details));

  auditLogger.logAction(action, 'user-123', {
    details: sanitizedDetails,
  });
}
```

### Combine with Content Filter

```typescript
import { createContentFilter, createPIIDetector } from '@rana/core';

const contentFilter = createContentFilter();
const piiDetector = createPIIDetector();

function processUserContent(content: string): {
  safe: boolean;
  processed: string;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for unsafe content
  const filterResult = contentFilter.check(content);
  if (!filterResult.safe) {
    issues.push('Unsafe content detected');
  }

  // Check for PII
  const piiResult = piiDetector.mask(content);
  if (piiResult.detected) {
    issues.push('PII detected and masked');
  }

  return {
    safe: filterResult.safe && !piiResult.detected,
    processed: piiResult.processed,
    issues,
  };
}
```

## TypeScript Types

```typescript
// Main types
type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'creditCard'
  | 'ipAddress'
  | 'name'
  | 'custom';

type PIIMode = 'detect' | 'redact' | 'mask';

type PIIRegion = 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'global';

// Configuration
interface PIIDetectorConfig {
  enabledTypes?: PIIType[];
  region?: PIIRegion;
  customPatterns?: CustomPattern[];
  placeholders?: Partial<Record<PIIType, string>>;
  detectNames?: boolean;
  nameConfidenceThreshold?: number;
  preserveFormat?: boolean;
}

// Custom pattern
interface CustomPattern {
  name: string;
  pattern: RegExp;
  placeholder?: string;
  maskPattern?: (value: string) => string;
}

// Detection result
interface PIIDetection {
  type: PIIType;
  value: string;
  start: number;
  end: number;
  redacted?: string;
  confidence?: number;
}

// Processing result
interface PIIResult {
  original: string;
  processed: string;
  detected: boolean;
  detections: PIIDetection[];
  stats: {
    total: number;
    byType: Record<PIIType, number>;
  };
}
```

## Troubleshooting

### Pattern Not Matching

```typescript
// Check if pattern is correctly configured
const detector = createPIIDetector({
  enabledTypes: ['phone'],
  region: 'US', // Make sure region matches your data
});

const result = detector.detect('+44 20 7123 4567'); // UK phone
console.log(result.detected); // false (US patterns don't match UK)
```

### False Positives in Name Detection

```typescript
// Increase confidence threshold
const detector = createPIIDetector({
  detectNames: true,
  nameConfidenceThreshold: 0.8, // Higher = fewer false positives
});

// Or review confidence scores
result.detections.forEach(d => {
  if (d.type === 'name' && d.confidence && d.confidence < 0.7) {
    console.warn('Possible false positive:', d.value);
  }
});
```

### Performance Issues

```typescript
// Disable unnecessary PII types
const detector = createPIIDetector({
  enabledTypes: ['email'], // Only what you need
});

// Use hasPII for quick filtering
const textsWithPII = texts.filter(text => detector.hasPII(text));
```

## License

Part of RANA - Rapid AI Native Architecture. See main package for license details.
