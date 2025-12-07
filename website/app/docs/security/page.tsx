'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertTriangle, Eye, Filter, Key, ClipboardList } from 'lucide-react';

const features = [
  {
    icon: AlertTriangle,
    title: 'Prompt Injection Detection',
    description: 'Detect and block prompt injection attacks in real-time',
    code: `import { PromptGuard } from '@rana/security';

const guard = new PromptGuard({
  sensitivity: 'high',
  blockOnDetection: true,
  logAttempts: true
});

// Check user input before sending to LLM
const result = guard.check(userInput);

if (result.isInjection) {
  console.log(result.type);        // 'jailbreak' | 'instruction_override' | 'data_extraction'
  console.log(result.confidence);  // 0.95
  console.log(result.details);     // Explanation
  throw new Error('Prompt injection detected');
}

// Or use as middleware
app.use(guard.middleware());`,
  },
  {
    icon: Eye,
    title: 'PII Detection & Redaction',
    description: 'Automatically detect and redact sensitive data',
    code: `import { PIIDetector } from '@rana/security';

const detector = new PIIDetector({
  types: ['email', 'phone', 'ssn', 'credit_card', 'address'],
  customPatterns: [
    { name: 'employee_id', pattern: /EMP-\\d{6}/ }
  ]
});

// Detect PII
const findings = detector.detect(text);
// [{ type: 'email', value: 'john@...', start: 10, end: 25 }]

// Redact PII
const redacted = detector.redact(text);
// "Contact [EMAIL] for support"

// Redact with replacement
const masked = detector.redact(text, {
  email: (val) => val.replace(/(?<=.).(?=.*@)/g, '*')
});
// "Contact j***@example.com for support"`,
  },
  {
    icon: Filter,
    title: 'Content Filtering',
    description: 'Filter harmful, inappropriate, or off-topic content',
    code: `import { ContentFilter } from '@rana/security';

const filter = new ContentFilter({
  categories: ['hate', 'violence', 'sexual', 'self_harm'],
  customRules: [
    { name: 'competitor_mention', keywords: ['competitor1', 'competitor2'] }
  ],
  thresholds: {
    hate: 0.7,
    violence: 0.8
  }
});

// Check content
const result = await filter.check(content);

if (result.flagged) {
  console.log(result.categories);  // ['hate']
  console.log(result.scores);      // { hate: 0.85, violence: 0.1 }
}

// Filter and modify
const safe = await filter.filter(content, {
  action: 'redact'  // or 'block', 'warn'
});`,
  },
  {
    icon: ClipboardList,
    title: 'Audit Logging',
    description: 'Comprehensive audit trail for all AI operations',
    code: `import { AuditLogger } from '@rana/security';

const audit = new AuditLogger({
  storage: 'postgresql',
  retention: '7 years',
  encryption: true
});

// Log AI operations
await audit.log({
  action: 'ai.chat',
  actor: { id: userId, type: 'user' },
  resource: { type: 'conversation', id: conversationId },
  input: { prompt: userMessage },
  output: { response: aiResponse },
  metadata: { model: 'gpt-4', tokens: 500 }
});

// Query audit logs
const logs = await audit.query({
  actor: userId,
  action: 'ai.*',
  timeRange: { from: '30d ago' }
});

// Export for compliance
await audit.export({
  format: 'csv',
  period: 'last-quarter'
});`,
  },
  {
    icon: Shield,
    title: 'Rate Limiting',
    description: 'Per-user and per-endpoint rate limiting',
    code: `import { RateLimiter } from '@rana/security';

const limiter = new RateLimiter({
  storage: 'redis',
  defaultLimits: {
    requests: { max: 100, window: '1m' },
    tokens: { max: 10000, window: '1h' },
    cost: { max: 1.00, window: '1d' }
  }
});

// Check rate limit
const allowed = await limiter.check(userId, {
  type: 'requests',
  cost: 1
});

if (!allowed.success) {
  console.log(allowed.retryAfter);  // seconds until reset
  throw new RateLimitError(allowed);
}

// Custom limits per user tier
await limiter.setUserLimits(userId, {
  requests: { max: 1000, window: '1m' }  // Premium user
});

// Express middleware
app.use('/api/chat', limiter.middleware('requests'));`,
  },
  {
    icon: Key,
    title: 'API Key Management',
    description: 'Secure API key rotation and access control',
    code: `import { KeyManager } from '@rana/security';

const keys = new KeyManager({
  storage: 'vault',  // or 'aws-secrets', 'env'
  rotationPolicy: {
    maxAge: '90d',
    warningBefore: '14d'
  }
});

// Get current key (auto-rotates if needed)
const apiKey = await keys.get('openai');

// Manual rotation
await keys.rotate('openai', {
  newKey: process.env.NEW_OPENAI_KEY,
  gracePeriod: '1h'  // Both keys valid during transition
});

// Key usage tracking
const usage = await keys.getUsage('openai');
console.log(usage.requestCount);
console.log(usage.lastUsed);

// Alerts
keys.onRotationNeeded((keyName, daysUntilExpiry) => {
  notify(\`Key \${keyName} expires in \${daysUntilExpiry} days\`);
});`,
  },
];

export default function SecurityPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Security</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Protect your AI applications from prompt injection, data leaks,
            and abuse. Built-in security features for production deployments.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/security
          </div>
        </motion.div>

        {/* Security Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-500 mb-1">Security Best Practice</h3>
              <p className="text-foreground-secondary">
                Always validate and sanitize user inputs before sending to LLMs. Enable prompt
                injection detection and PII redaction for all user-facing applications.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
