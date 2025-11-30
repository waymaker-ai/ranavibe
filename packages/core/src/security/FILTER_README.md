# RANA Content Filter

A robust content filtering system for RANA that filters profanity, harmful content, spam, and custom blocklisted words/phrases.

## Features

- **Multi-Category Filtering**: Profanity, violence, hate speech, self-harm, adult content, spam, and custom patterns
- **Flexible Actions**: Block, redact, warn, or log filtered content
- **Severity Levels**: Low, medium, high, and critical severity ratings
- **Allowlist Support**: Define exceptions for words that should not be filtered
- **Custom Patterns**: Add your own regex or string patterns
- **Category-Specific Actions**: Different actions for different content categories
- **Callbacks**: React to violations and blocks with custom logic
- **Performance Optimized**: Fast pattern matching with configurable content length limits

## Installation

The content filter is included in `@rana/core`:

```typescript
import { createContentFilter, isContentSafe } from '@rana/core';
```

## Quick Start

### Basic Usage

```typescript
import { createContentFilter } from '@rana/core';

const filter = createContentFilter({
  defaultAction: 'warn',
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
});

const result = filter.filter('Some content to check');

if (!result.passed) {
  console.log('Violations found:', result.violations);
}
```

### Simple Safety Check

```typescript
import { isContentSafe } from '@rana/core';

if (!isContentSafe(userInput)) {
  console.log('Content is not safe!');
}
```

## Configuration

### ContentFilterConfig

```typescript
interface ContentFilterConfig {
  // Custom patterns to block
  blocklist?: FilterPattern[];

  // Allowed exceptions
  allowlist?: string[];

  // Default action when violations are found
  defaultAction?: 'block' | 'redact' | 'warn' | 'log';

  // Only act on violations >= this severity
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';

  // Category-specific actions
  categoryActions?: {
    profanity?: FilterAction;
    violence?: FilterAction;
    adult?: FilterAction;
    hate?: FilterAction;
    'self-harm'?: FilterAction;
    spam?: FilterAction;
    custom?: FilterAction;
  };

  // Enable/disable built-in filters
  enableProfanityFilter?: boolean;
  enableHarmfulContentFilter?: boolean;
  enableSpamFilter?: boolean;

  // Redaction settings
  redactionText?: string; // Default: '[FILTERED]'

  // Performance
  maxContentLength?: number; // Default: 100000

  // Callbacks
  onViolation?: (violation: FilterViolation, content: string) => void;
  onBlock?: (result: FilterResult) => void;
}
```

## Filter Actions

| Action | Description |
|--------|-------------|
| `block` | Prevent content from being processed (throws error or marks as failed) |
| `redact` | Remove/replace filtered content with redactionText |
| `warn` | Flag content but allow it through |
| `log` | Log for review without blocking |

## Filter Categories

| Category | Description |
|----------|-------------|
| `profanity` | Common profane words and phrases |
| `violence` | Violent content, threats, weapon instructions |
| `adult` | Adult/sexual content |
| `hate` | Hate speech, discrimination |
| `self-harm` | Self-harm and suicide content |
| `spam` | Spam patterns, marketing language |
| `custom` | Your custom patterns |

## Severity Levels

| Severity | Use Case |
|----------|----------|
| `low` | Minor profanity, mild spam |
| `medium` | Moderate profanity, suggestive content |
| `high` | Strong profanity, violent content |
| `critical` | Extreme violence, hate speech, self-harm |

## Examples

### 1. Content Redaction

```typescript
const filter = createContentFilter({
  defaultAction: 'redact',
  enableProfanityFilter: true,
  redactionText: '***',
});

const result = filter.filter('This damn thing is crap!');
console.log(result.filtered_content); // "This *** thing is ***!"
```

### 2. Custom Blocklist

```typescript
const filter = createContentFilter({
  blocklist: [
    {
      pattern: /\b(confidential|secret)\b/i,
      category: 'custom',
      severity: 'high',
    },
    {
      pattern: 'internal-only',
      category: 'custom',
      severity: 'medium',
      wholeWord: true,
    },
  ],
  defaultAction: 'block',
});
```

### 3. Allowlist (Exceptions)

```typescript
const filter = createContentFilter({
  allowlist: ['damn', 'hell'], // These won't be filtered
  enableProfanityFilter: true,
  defaultAction: 'warn',
});

const result = filter.filter('Damn, this is good!');
console.log(result.violations.length); // 0
```

### 4. Category-Specific Actions

```typescript
const filter = createContentFilter({
  categoryActions: {
    violence: 'block',      // Block violent content
    profanity: 'redact',    // Redact profanity
    spam: 'warn',           // Warn about spam
    adult: 'log',           // Just log adult content
  },
});
```

### 5. Severity Threshold

```typescript
const filter = createContentFilter({
  severityThreshold: 'high', // Only act on high and critical
  defaultAction: 'block',
});

// Low/medium violations will pass through
// High/critical violations will be blocked
```

### 6. Using Callbacks

```typescript
const filter = createContentFilter({
  onViolation: (violation, content) => {
    logger.warn(`Content violation: ${violation.category}`, {
      match: violation.match,
      severity: violation.severity,
    });
  },
  onBlock: (result) => {
    logger.error(`Content blocked`, {
      violations: result.violations.length,
      categories: result.metadata.categories_triggered,
    });
  },
});
```

### 7. Dynamic Pattern Management

```typescript
const filter = createContentFilter();

// Add patterns at runtime
filter.addPattern({
  pattern: /\b(restricted)\b/i,
  category: 'custom',
  severity: 'high',
});

// Add to allowlist
filter.addToAllowlist('acceptable-word');

// Remove patterns by category
filter.removePatternsByCategory('spam');

// Get statistics
const stats = filter.getStats();
console.log('Total patterns:', stats.totalPatterns);
```

### 8. Integration with RANA Chat

```typescript
import { createRana, createContentFilter, ContentBlockedError } from '@rana/core';

const contentFilter = createContentFilter({
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  defaultAction: 'block',
  categoryActions: {
    violence: 'block',
    'self-harm': 'block',
    hate: 'block',
  },
});

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

async function safeChatRequest(userMessage: string) {
  // Filter user input
  const filterResult = contentFilter.filter(userMessage);

  if (filterResult.action_taken === 'block') {
    throw new ContentBlockedError(filterResult.violations, {
      message: 'Your message contains prohibited content',
    });
  }

  // Use redacted content if applicable
  const safeMessage = filterResult.action_taken === 'redact'
    ? filterResult.filtered_content
    : userMessage;

  // Send to LLM
  return await rana.chat({
    messages: [{ role: 'user', content: safeMessage }],
  });
}
```

## Filter Result

The `filter()` method returns a `FilterResult` object:

```typescript
interface FilterResult {
  // Whether content passed the filter
  passed: boolean;

  // Action that was taken
  action_taken: FilterAction;

  // Filtered/modified content (if redacted)
  filtered_content: string;

  // List of violations found
  violations: FilterViolation[];

  // Additional metadata
  metadata: {
    total_violations: number;
    highest_severity: FilterSeverity;
    categories_triggered: FilterCategory[];
  };
}
```

## Violation Details

Each violation includes:

```typescript
interface FilterViolation {
  category: FilterCategory;      // Type of violation
  match: string;                 // The matched text
  position?: number;             // Position in content
  severity: FilterSeverity;      // Severity level
  context?: string;              // Surrounding context
}
```

## Utility Functions

### isContentSafe()

Quick check if content is safe:

```typescript
if (isContentSafe(userInput)) {
  // Process content
}
```

### assertContentSafe()

Assert content is safe or throw error:

```typescript
try {
  assertContentSafe(userInput);
  // Content is safe
} catch (error) {
  // Content was blocked
  console.error(error.violations);
}
```

## Performance Considerations

1. **Content Length Limit**: Set `maxContentLength` to prevent performance issues with very large content
2. **Pattern Optimization**: Use specific patterns rather than broad ones
3. **Severity Threshold**: Use severity threshold to reduce unnecessary checks
4. **Disable Unused Filters**: Turn off filters you don't need

```typescript
const filter = createContentFilter({
  maxContentLength: 50000,           // Limit content size
  severityThreshold: 'medium',       // Only check medium+
  enableSpamFilter: false,           // Disable if not needed
});
```

## Best Practices

1. **Layer Your Filters**: Use different actions for different severity levels
2. **Combine with Rate Limiting**: Content filtering works well with rate limiting
3. **Log Violations**: Always log violations for review and improvement
4. **Use Allowlists Carefully**: Don't over-allowlist, it reduces effectiveness
5. **Test Thoroughly**: Test with real user content before deployment
6. **Update Patterns**: Regularly review and update your custom patterns
7. **Monitor False Positives**: Track and address false positives

## Error Handling

```typescript
import { ContentBlockedError, ContentFilterError } from '@rana/core';

try {
  const result = filter.filter(content);

  if (result.action_taken === 'block') {
    throw new ContentBlockedError(result.violations);
  }
} catch (error) {
  if (error instanceof ContentBlockedError) {
    // Handle blocked content
    console.error('Content blocked:', error.violations);
  } else if (error instanceof ContentFilterError) {
    // Handle filter error
    console.error('Filter error:', error.message);
  }
}
```

## Advanced Usage

### Custom Severity Scoring

```typescript
const filter = createContentFilter({
  blocklist: [
    // Critical business logic violations
    {
      pattern: /\b(drop|delete)\s+table\b/i,
      category: 'custom',
      severity: 'critical',
    },
    // High priority security
    {
      pattern: /api[_-]?key|secret|password/i,
      category: 'custom',
      severity: 'high',
    },
  ],
  severityThreshold: 'high',
  categoryActions: {
    custom: 'block',
  },
});
```

### Multi-Language Support

```typescript
const filter = createContentFilter({
  blocklist: [
    // English profanity
    { pattern: /\b(profanity)\b/i, category: 'profanity', severity: 'medium' },
    // Spanish profanity
    { pattern: /\b(palabra)\b/i, category: 'profanity', severity: 'medium' },
    // French profanity
    { pattern: /\b(mot)\b/i, category: 'profanity', severity: 'medium' },
  ],
});
```

## Contributing

To extend the built-in patterns:

1. Add patterns to the appropriate `BUILT_IN_*` constant
2. Categorize appropriately (profanity, violence, etc.)
3. Assign proper severity level
4. Test thoroughly with real-world content
5. Document any new categories or severity levels

## License

Part of the RANA project. See main project license.
