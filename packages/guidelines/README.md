# @rana/guidelines

> Dynamic guideline management for RANA agents - Context-aware behavioral rules

## Features

✨ **Dynamic Matching** - Guidelines automatically apply based on conversation context
🎯 **Priority System** - Resolve conflicts with weighted priorities
📊 **Analytics** - Track guideline compliance and violations
🔄 **Flexible Enforcement** - Strict, advisory, or monitored modes
💾 **Persistent Storage** - Memory or file-based storage
⚡ **High Performance** - Built-in caching for fast matching

## Installation

```bash
npm install @rana/guidelines
```

## Quick Start

### Basic Usage

```typescript
import { createGuidelineManager, createGuideline, Conditions } from '@rana/guidelines';

const manager = createGuidelineManager();

// Add a guideline
await manager.addGuideline(createGuideline({
  id: 'no-medical-advice',
  name: 'No Medical Advice',
  condition: Conditions.topic(['medical', 'health']),
  content: 'Never provide medical diagnoses. Always suggest consulting a doctor.',
  enforcement: 'strict',
  priority: 100,
  category: 'healthcare'
}));

// Match guidelines against context
const matched = await manager.match({
  topic: 'medical',
  message: 'I have a headache, what should I do?'
});

console.log(matched);
// [{ guideline: {...}, resolvedContent: '...', matchedAt: ... }]
```

### Using Presets

```typescript
import { PresetGuidelines } from '@rana/guidelines';

// Add preset guidelines
await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
await manager.addGuideline(PresetGuidelines.financialDisclaimer());
await manager.addGuideline(PresetGuidelines.professionalTone());
```

## Condition Builders

Build complex matching logic easily:

```typescript
import { Conditions } from '@rana/guidelines';

// Topic matching
Conditions.topic('medical')
Conditions.topic(['finance', 'investment'])

// Category matching
Conditions.category('support')

// User role matching
Conditions.userRole(['admin', 'moderator'])

// Message content matching
Conditions.messageContains('password')
Conditions.messageMatches(/\b\d{3}-\d{2}-\d{4}\b/)

// Combine conditions
Conditions.and(
  Conditions.topic('finance'),
  Conditions.messageContains('invest')
)

Conditions.or(
  Conditions.category('support'),
  Conditions.intent('help')
)

Conditions.not(Conditions.userRole('admin'))
```

## Dynamic Content

Guidelines can have static or dynamic content:

```typescript
// Static content
createGuideline({
  id: 'professional',
  condition: Conditions.always(),
  content: 'Always maintain a professional tone.',
  enforcement: 'advisory',
  priority: 50,
})

// Dynamic content
createGuideline({
  id: 'personalized-greeting',
  condition: Conditions.intent('greeting'),
  content: (context) => {
    const userName = context.user?.metadata?.name ?? 'there';
    return `Greet the user warmly. User's name is ${userName}.`;
  },
  enforcement: 'advisory',
  priority: 60,
})
```

## Enforcement Levels

- **`strict`** - Block responses that violate the guideline
- **`advisory`** - Warn but allow the response
- **monitored`** - Log violations for review only

## Priority System

Higher priority guidelines take precedence:

```typescript
createGuideline({
  id: 'critical-safety',
  priority: 100,  // Takes precedence
  ...
})

createGuideline({
  id: 'style-preference',
  priority: 30,   // Lower priority
  ...
})
```

## Conflict Resolution

```typescript
const matched = await manager.match(context, {
  conflictResolution: 'highest-priority', // Default
  // or 'merge' - include all matching
  // or 'first-match' - use first match only
});
```

## Analytics

Track guideline performance:

```typescript
// Get analytics for specific guideline
const stats = manager.getAnalytics('no-medical-advice');
console.log(stats);
// {
//   matchCount: 45,
//   violationCount: 3,
//   complianceRate: 0.93,
//   lastMatched: Date,
//   lastViolated: Date
// }

// Get all analytics
const allStats = manager.getAllAnalytics();

// Reset analytics
manager.resetAnalytics('no-medical-advice');
manager.resetAnalytics(); // Reset all
```

## Validation

Validate responses against matched guidelines:

```typescript
const validation = await manager.validate(
  'AI should definitely invest in crypto!',
  context
);

console.log(validation);
// {
//   compliant: false,
//   matchedGuidelines: [...],
//   violations: [...],
//   action: 'block',
//   modifiedResponse: '...'
// }
```

## Storage

### Memory Storage (Default)

```typescript
const manager = createGuidelineManager({
  storage: new MemoryStorage()
});
```

### File Storage

```typescript
import { FileStorage } from '@rana/guidelines';

const manager = createGuidelineManager({
  storage: new FileStorage('./guidelines.json')
});
```

## Configuration

```typescript
const manager = createGuidelineManager({
  enableAnalytics: true,
  defaultEnforcement: 'advisory',
  maxMatches: 10,
  enableCache: true,
  cacheTTL: 300, // 5 minutes

  onViolation: async (violation) => {
    console.log('Guideline violated:', violation);
    // Send to monitoring, logging, etc.
  }
});
```

## Preset Guidelines

Available presets:

- `noMedicalAdvice()` - Prevent medical diagnoses/advice
- `financialDisclaimer()` - Require financial disclaimers
- `professionalTone()` - Maintain professional communication
- `dataPrivacy()` - Protect sensitive information
- `legalDisclaimer()` - Require legal disclaimers
- `brandVoice(name, voice)` - Maintain brand consistency
- `customerEmpathy()` - Empathetic support responses
- `ageAppropriate(minAge)` - Age-appropriate content

## Advanced Example

```typescript
import {
  createGuidelineManager,
  createGuideline,
  Conditions,
  PresetGuidelines,
} from '@rana/guidelines';

const manager = createGuidelineManager({
  enableAnalytics: true,
  defaultEnforcement: 'advisory',

  onViolation: async (violation) => {
    await fetch('/api/analytics/violations', {
      method: 'POST',
      body: JSON.stringify(violation),
    });
  },
});

// Add presets
await manager.addGuidelines([
  PresetGuidelines.noMedicalAdvice(),
  PresetGuidelines.financialDisclaimer(),
  PresetGuidelines.dataPrivacy(),
  PresetGuidelines.professionalTone(),
]);

// Add custom guidelines
await manager.addGuideline(createGuideline({
  id: 'company-policy',
  name: 'Company Refund Policy',
  condition: Conditions.and(
    Conditions.category('support'),
    Conditions.messageContains('refund')
  ),
  content: `Our refund policy:
    - Full refund within 30 days
    - Pro-rated refund within 90 days
    - No refunds after 90 days
    Always be empathetic and helpful when discussing refunds.`,
  enforcement: 'strict',
  priority: 80,
  category: 'policy',
}));

// Use in conversation
async function handleMessage(userMessage: string, context: any) {
  // Match guidelines
  const guidelines = await manager.match({
    message: userMessage,
    category: context.category,
    topic: context.topic,
    user: context.user,
  });

  // Pass guidelines to LLM as system prompts
  const systemPrompts = guidelines.map(g => g.resolvedContent).join('\n\n');

  // Generate response with LLM...
  const response = await llm.chat({
    system: systemPrompts,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Validate response
  const validation = await manager.validate(
    response.content,
    { message: userMessage, ...context },
    guidelines
  );

  if (!validation.compliant) {
    console.log('Violations detected:', validation.violations);
  }

  return validation.modifiedResponse ?? response.content;
}
```

## Export/Import

```typescript
// Export guidelines for backup
const exported = manager.export();
await fs.writeFile('backup.json', JSON.stringify(exported));

// Import guidelines
const data = JSON.parse(await fs.readFile('backup.json'));
await manager.import(data);
```

## TypeScript Support

Full TypeScript support with comprehensive types:

```typescript
import type {
  Guideline,
  GuidelineContext,
  GuidelineCondition,
  MatchedGuideline,
  GuidelineViolation,
  ValidationResult,
  EnforcementLevel,
} from '@rana/guidelines';
```

## Best Practices

1. **Use Clear IDs** - Use descriptive, unique IDs for guidelines
2. **Set Appropriate Priorities** - Critical safety: 100+, policies: 70-90, style: 50-70
3. **Choose Right Enforcement** - Use `strict` for safety, `advisory` for style
4. **Monitor Analytics** - Review compliance rates regularly
5. **Version Guidelines** - Track changes with version field
6. **Cache Aggressively** - Enable caching for better performance
7. **Test Thoroughly** - Test guideline matching logic before deployment

## License

MIT © Waymaker
